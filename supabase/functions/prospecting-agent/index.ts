import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// Agent 06 — Prospecting Agent
// Finds businesses that could use MoCreative Concept's services, scores
// them, and drafts a short first message for each good fit. It NEVER sends
// anything: results go to public.prospects (not public.leads, which the
// Screening Agent emails automatically). The founder reviews, sets status
// 'Approved', and sends by hand — the standing rule that outreach stays
// manual and human-approved.
//
// WHERE LEADS COME FROM: Google Places API (Text Search, New). Search terms
// live in public.prospect_queries — edit rows there to change targeting.
// Each run takes the QUERIES_PER_RUN least-recently-run active queries.
//
// SCORING (rules, documented — adjust here if the ICP changes):
//   no website            +3  (Product Design pitch: they need a site)
//   has website           +1  (AI Automation pitch: audit their operations)
//   reviews >= 50         +3  (established, can likely pay)
//   reviews 10-49         +2
//   rating >= 4.2         +1
//   phone listed          +1
//   sector Education      +2  (strongest proof: Topkids)
//   sector Healthcare / Real estate / Logistics  +1
// Drafts only for fit_score >= DRAFT_MIN_SCORE, at most MAX_DRAFTS_PER_RUN,
// to keep the metered Claude spend small.
//
// SECRETS REQUIRED: GOOGLE_PLACES_API_KEY, ANTHROPIC_API_KEY.

const QUERIES_PER_RUN = 2;
const RESULTS_PER_QUERY = 20;
const DRAFT_MIN_SCORE = 5;
const MAX_DRAFTS_PER_RUN = 15;
const MODEL = "claude-haiku-4-5-20251001";
const INBOX = "hello@mocreativeconcept.com";

type Place = {
  id: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  websiteUri?: string;
  nationalPhoneNumber?: string;
  rating?: number;
  userRatingCount?: number;
  googleMapsUri?: string;
  businessStatus?: string;
};

function score(p: Place, sector: string): { fit: number; pillar: string; reason: string } {
  let fit = 0;
  const why: string[] = [];
  const pillar = p.websiteUri ? "AI Automation" : "Product Design";
  if (p.websiteUri) { fit += 1; why.push("has a website (AI audit angle)"); }
  else { fit += 3; why.push("no website (needs a site)"); }
  const n = p.userRatingCount ?? 0;
  if (n >= 50) { fit += 3; why.push(`${n} reviews (established)`); }
  else if (n >= 10) { fit += 2; why.push(`${n} reviews`); }
  if ((p.rating ?? 0) >= 4.2) { fit += 1; why.push(`rated ${p.rating}`); }
  if (p.nationalPhoneNumber) { fit += 1; why.push("phone listed"); }
  if (sector === "Education") { fit += 2; why.push("education (Topkids proof)"); }
  else if (["Healthcare", "Real estate", "Logistics"].includes(sector)) { fit += 1; why.push(sector.toLowerCase()); }
  return { fit, pillar, reason: why.join("; ") };
}

const DRAFT_SYSTEM = `You draft a first outreach message from Damola, founder of MoCreative Concept
(Lagos): a one-person, AI-native practice with two services — product design taken from
brief to a live website or app, and AI automation audits that find where a business can
save staff hours.

Rules:
- 60 to 90 words. Plain, warm, direct. No hype, no emojis, no em dashes.
- Mention one specific, observable fact given to you about the business (for example that
  it has no website, or its number of Google reviews). Never invent facts.
- Offer exactly one thing, matching the pillar given: "Product Design" = a website/app;
  "AI Automation" = a short AI audit (a written report plus one quick win).
- Never claim past clients, results or numbers. Never promise outcomes.
- End with a soft question, then sign off: "Damola, MoCreative Concept" and ${INBOX}.
Return only the message text.`;

Deno.serve(async (_req: Request) => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const log = (status: string, output_summary: string, error_detail?: string) =>
    supabase.from("agent_logs").insert({
      agent_name: "06 — Prospecting Agent",
      layer: "Layer 1 — Acquisition",
      triggered_by: "scheduled-daily",
      status,
      output_summary,
      error_detail: error_detail ?? null,
    });

  try {
    const placesKey = Deno.env.get("GOOGLE_PLACES_API_KEY");
    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
    const missing = [!placesKey && "GOOGLE_PLACES_API_KEY", !anthropicKey && "ANTHROPIC_API_KEY"].filter(Boolean);
    if (missing.length) {
      await log("failed", `Missing secret(s): ${missing.join(", ")} — nothing searched.`);
      return new Response(JSON.stringify({ error: `Missing secret(s): ${missing.join(", ")}` }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { data: queries, error: qErr } = await supabase
      .from("prospect_queries")
      .select("id, query, sector, runs")
      .eq("active", true)
      .order("last_run_at", { ascending: true, nullsFirst: true })
      .limit(QUERIES_PER_RUN);
    if (qErr) throw qErr;

    let found = 0, added = 0, skipped = 0;
    const errors: string[] = [];

    // ── 1. search and score ─────────────────────────────────────────────
    for (const q of queries ?? []) {
      const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": placesKey!,
          "X-Goog-FieldMask":
            "places.id,places.displayName,places.formattedAddress,places.websiteUri,places.nationalPhoneNumber,places.rating,places.userRatingCount,places.googleMapsUri,places.businessStatus",
        },
        body: JSON.stringify({ textQuery: q.query, pageSize: RESULTS_PER_QUERY, regionCode: "NG" }),
      });
      const json = await res.json();
      await supabase.from("prospect_queries")
        .update({ last_run_at: new Date().toISOString(), runs: (q.runs ?? 0) + 1 })
        .eq("id", q.id);

      if (!res.ok) {
        errors.push(`"${q.query}": ${JSON.stringify(json).slice(0, 300)}`);
        continue;
      }

      for (const p of (json.places ?? []) as Place[]) {
        found++;
        if (p.businessStatus && p.businessStatus !== "OPERATIONAL") { skipped++; continue; }
        const s = score(p, q.sector);
        // ignoreDuplicates: a business already in the table keeps its status and draft
        const { data: ins, error: insErr } = await supabase
          .from("prospects")
          .upsert({
            place_id: p.id,
            name: p.displayName?.text ?? "(unnamed)",
            sector: q.sector,
            query: q.query,
            address: p.formattedAddress ?? null,
            website: p.websiteUri ?? null,
            phone: p.nationalPhoneNumber ?? null,
            rating: p.rating ?? null,
            rating_count: p.userRatingCount ?? null,
            maps_url: p.googleMapsUri ?? null,
            pillar: s.pillar,
            fit_score: s.fit,
            fit_reason: s.reason,
          }, { onConflict: "place_id", ignoreDuplicates: true })
          .select("id");
        if (insErr) { errors.push(`insert ${p.id}: ${insErr.message}`); continue; }
        if (ins && ins.length) added++;
      }
    }

    // ── 2. draft messages for the best new fits ─────────────────────────
    const { data: toDraft } = await supabase
      .from("prospects")
      .select("id, name, sector, pillar, website, rating, rating_count, fit_reason")
      .eq("status", "New")
      .is("draft_message", null)
      .gte("fit_score", DRAFT_MIN_SCORE)
      .order("fit_score", { ascending: false })
      .limit(MAX_DRAFTS_PER_RUN);

    let drafted = 0;
    for (const p of toDraft ?? []) {
      const facts = [
        `Business: ${p.name}`,
        `Sector: ${p.sector}`,
        `Pillar to offer: ${p.pillar}`,
        p.website ? `Website: ${p.website}` : "Website: none found on Google",
        p.rating_count ? `Google reviews: ${p.rating_count}${p.rating ? `, average ${p.rating}` : ""}` : null,
      ].filter(Boolean).join("\n");

      const ai = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "x-api-key": anthropicKey!, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 400,
          system: DRAFT_SYSTEM,
          messages: [{ role: "user", content: facts }],
        }),
      });
      const aiJson = await ai.json();
      const text: string = aiJson?.content?.[0]?.text?.trim() ?? "";
      if (!ai.ok || !text) {
        errors.push(`draft ${p.name}: ${JSON.stringify(aiJson).slice(0, 300)}`);
        continue;
      }
      await supabase.from("prospects")
        .update({ draft_message: text, drafted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq("id", p.id);
      drafted++;
    }

    // one row per run, including quiet runs, so a silent failure is visible
    const summary =
      `Searched ${(queries ?? []).map((q) => `"${q.query}"`).join(", ") || "nothing (no active queries)"}: ` +
      `${found} found, ${added} new, ${skipped} closed skipped, ${drafted} drafts written. Nothing sent.`;
    await log(errors.length ? "failed" : "success", summary, errors.length ? errors.join(" | ").slice(0, 2000) : undefined);

    return new Response(JSON.stringify({ found, added, skipped, drafted, errors }, null, 2), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    await log("failed", "Prospecting run crashed", String(err));
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
