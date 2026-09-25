import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// Agent 06 — Prospecting Agent
// Finds businesses that could use MoCreative Concept's services, records how
// to reach them and what to pitch, and drafts a first message for strong
// fits. It NEVER sends anything: results go to public.prospects (not
// public.leads, which the Screening Agent emails automatically). The founder
// reviews, sets status 'Approved', and sends by hand.
//
// WHERE LEADS COME FROM: Claude's web search tool (no Google billing needed).
// Search terms and their category live in public.prospect_queries; edit rows
// there to change targeting. Each run takes the QUERIES_PER_RUN
// least-recently-run active queries. Only facts seen in search results are
// stored, each with its source URL; nothing is guessed.
//
// WHAT TO PITCH (from website_status):
//   found       -> AI Automation (they have a site; offer the AI audit)
//   none_found  -> Product Design (searched, no site; offer a website)
//   unknown     -> Product Design, flagged "check before pitching"
// HOW TO REACH (contact_channel, best first): email, phone (drafted as a
// WhatsApp message), social (Instagram/Facebook DM), none (not drafted).
//
// SCORING (rules, documented — adjust here if the ICP changes):
//   website none_found +3, found +1, unknown +1
//   email +2, phone +2, social +1        (reachability matters most)
//   sector Education +2; Healthcare / Real estate / Logistics +1
//   no way to contact at all -> 0
//
// COST GUARD: web search is metered (about $0.01 per search plus tokens).
// MAX_SEARCHES_PER_QUERY x QUERIES_PER_RUN caps searches per run.
//
// SECRETS REQUIRED: ANTHROPIC_API_KEY.

const QUERIES_PER_RUN = 2;
const MAX_SEARCHES_PER_QUERY = 5;
const DRAFT_MIN_SCORE = 5;
const MAX_DRAFTS_PER_RUN = 15;
const MODEL = "claude-haiku-4-5-20251001";
const INBOX = "hello@mocreativeconcept.com";

type Found = {
  name?: string;
  website?: string | null;
  website_status?: "found" | "none_found" | "unknown";
  phone?: string | null;
  email?: string | null;
  social_url?: string | null;
  address?: string | null;
  source_urls?: string[];
};

const SEARCH_SYSTEM = `You research small businesses in Lagos, Nigeria for a sales prospect list.
Use web search to find up to 10 real, currently operating businesses matching the request.
For each, look for its own website, a phone number, an email address and an Instagram or
Facebook page. Business directories and social profiles are acceptable sources.

Rules:
- Only report facts you actually saw in search results. Never guess or construct a phone
  number, email or URL. Use null when not found.
- website_status: "found" if you found the business's own website; "none_found" if you
  searched and it only appears on directories or social media; "unknown" if unsure.
- A social media page is not a website.
- source_urls: the pages where you saw the details.
Reply with ONLY a JSON array, no prose, no markdown fences:
[{"name":"","website":null,"website_status":"unknown","phone":null,"email":null,"social_url":null,"address":null,"source_urls":[]}]`;

const LIMITS = { email: "60 to 90 words", whatsapp: "under 60 words", social_dm: "under 50 words" };

const draftSystem = (channel: "email" | "whatsapp" | "social_dm") =>
  `You draft a first outreach message from Damola, founder of MoCreative Concept (Lagos):
a one-person, AI-native practice with two services: product design taken from brief to a
live website or app, and AI automation audits that find where a business can save staff hours.

This message is a ${channel === "email" ? "short email" : channel === "whatsapp" ? "WhatsApp message" : "Instagram/Facebook direct message"}.
Rules:
- ${LIMITS[channel]}. Plain, warm, direct. No hype, no emojis, no em dashes.
- Mention one specific, observable fact you are given about the business. Never invent facts.
- Offer exactly one thing, matching the pillar given: "Product Design" = a website;
  "AI Automation" = a short AI audit (a written report plus one quick win).
- Never claim past clients, results or numbers. Never promise outcomes.
- End with a soft question, then sign off "Damola, MoCreative Concept"${channel === "email" ? ` and ${INBOX}` : ""}.
Return only the message text${channel === "email" ? ", starting with a subject line as 'Subject: ...'" : ""}.`;

const clean = (v?: string | null) => (v && String(v).trim() && String(v).trim().toLowerCase() !== "null" ? String(v).trim() : null);
const dedupeKey = (name: string, sector: string) =>
  `${name.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()}|${sector.toLowerCase()}`;

function classify(b: Found, sector: string) {
  const website = clean(b.website);
  const email = clean(b.email);
  const phone = clean(b.phone);
  const social = clean(b.social_url);
  const status = website ? "found" : (b.website_status === "none_found" ? "none_found" : "unknown");
  const pillar = status === "found" ? "AI Automation" : "Product Design";
  const channel = email ? "email" : phone ? "phone" : social ? "social" : "none";

  const why: string[] = [];
  let fit = 0;
  if (status === "none_found") { fit += 3; why.push("no website found (website pitch)"); }
  else if (status === "found") { fit += 1; why.push("has a website (AI audit pitch)"); }
  else { fit += 1; why.push("website unknown, check before pitching"); }
  if (email) { fit += 2; why.push("email found"); }
  if (phone) { fit += 2; why.push("phone found"); }
  if (social) { fit += 1; why.push("social page found"); }
  if (sector === "Education") { fit += 2; why.push("education (Topkids proof)"); }
  else if (["Healthcare", "Real estate", "Logistics"].includes(sector)) { fit += 1; why.push(sector.toLowerCase()); }
  if (channel === "none") { fit = 0; why.push("no way to contact found"); }

  return { website, email, phone, social, status, pillar, channel, fit, reason: why.join("; ") };
}

function parseArray(text: string): Found[] {
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start < 0 || end <= start) return [];
  try {
    const arr = JSON.parse(text.slice(start, end + 1));
    return Array.isArray(arr) ? arr : [];
  } catch (_e) {
    return [];
  }
}

Deno.serve(async (_req: Request) => {
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
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
    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicKey) {
      await log("failed", "Missing secret ANTHROPIC_API_KEY — nothing searched.");
      return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY not set" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
    const claude = (body: unknown) =>
      fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "x-api-key": anthropicKey, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

    const { data: queries, error: qErr } = await supabase
      .from("prospect_queries")
      .select("id, query, sector, runs")
      .eq("active", true)
      .order("last_run_at", { ascending: true, nullsFirst: true })
      .limit(QUERIES_PER_RUN);
    if (qErr) throw qErr;

    let found = 0, added = 0, searches = 0;
    const errors: string[] = [];

    // ── 1. search, classify, store ──────────────────────────────────────
    for (const q of queries ?? []) {
      const res = await claude({
        model: MODEL,
        max_tokens: 4000,
        system: SEARCH_SYSTEM,
        tools: [{
          type: "web_search_20250305",
          name: "web_search",
          max_uses: MAX_SEARCHES_PER_QUERY,
          // no user_location: the search tool rejects country "NG"; every query names Lagos instead
        }],
        messages: [{ role: "user", content: `Find: ${q.query}` }],
      });
      const json = await res.json();
      await supabase.from("prospect_queries")
        .update({ last_run_at: new Date().toISOString(), runs: (q.runs ?? 0) + 1 })
        .eq("id", q.id);

      if (!res.ok) {
        errors.push(`"${q.query}": ${JSON.stringify(json).slice(0, 300)}`);
        continue;
      }
      searches += json?.usage?.server_tool_use?.web_search_requests ?? 0;
      const text = (json.content ?? [])
        .filter((c: { type: string }) => c.type === "text")
        .map((c: { text: string }) => c.text)
        .join("\n");
      const businesses = parseArray(text);
      if (!businesses.length) {
        errors.push(`"${q.query}": no parseable results`);
        continue;
      }

      for (const b of businesses) {
        const name = clean(b.name);
        if (!name) continue;
        found++;
        const c = classify(b, q.sector);
        const { data: ins, error: insErr } = await supabase
          .from("prospects")
          .upsert({
            dedupe_key: dedupeKey(name, q.sector),
            name,
            sector: q.sector,
            query: q.query,
            address: clean(b.address),
            website: c.website,
            website_status: c.status,
            phone: c.phone,
            email: c.email,
            social_url: c.social,
            contact_channel: c.channel,
            pillar: c.pillar,
            fit_score: c.fit,
            fit_reason: c.reason,
            sources: Array.isArray(b.source_urls) ? b.source_urls.slice(0, 5) : null,
          }, { onConflict: "dedupe_key", ignoreDuplicates: true })
          .select("id");
        if (insErr) { errors.push(`insert "${name}": ${insErr.message}`); continue; }
        if (ins && ins.length) added++;
      }
    }

    // ── 2. draft messages for the best reachable new fits ───────────────
    const { data: toDraft } = await supabase
      .from("prospects")
      .select("id, name, sector, pillar, website, website_status, contact_channel")
      .eq("status", "New")
      .is("draft_message", null)
      .neq("contact_channel", "none")
      .gte("fit_score", DRAFT_MIN_SCORE)
      .order("fit_score", { ascending: false })
      .limit(MAX_DRAFTS_PER_RUN);

    let drafted = 0;
    for (const p of toDraft ?? []) {
      const channel = p.contact_channel === "email" ? "email" : p.contact_channel === "phone" ? "whatsapp" : "social_dm";
      const facts = [
        `Business: ${p.name}`,
        `Sector: ${p.sector}`,
        `Pillar to offer: ${p.pillar}`,
        p.website_status === "found" ? `Website: ${p.website}`
          : p.website_status === "none_found" ? "Website: none found; appears only on directories or social media"
          : "Website: not confirmed",
      ].join("\n");

      const ai = await claude({
        model: MODEL,
        max_tokens: 400,
        system: draftSystem(channel),
        messages: [{ role: "user", content: facts }],
      });
      const aiJson = await ai.json();
      const text: string = aiJson?.content?.[0]?.text?.trim() ?? "";
      if (!ai.ok || !text) {
        errors.push(`draft "${p.name}": ${JSON.stringify(aiJson).slice(0, 300)}`);
        continue;
      }
      await supabase.from("prospects")
        .update({ draft_message: text, draft_channel: channel, drafted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq("id", p.id);
      drafted++;
    }

    // one row per run, including quiet runs, so a silent failure is visible
    const summary =
      `Searched ${(queries ?? []).map((q) => `"${q.query}"`).join(", ") || "nothing (no active queries)"} ` +
      `(${searches} web searches): ${found} found, ${added} new, ${drafted} drafts written. Nothing sent.`;
    await log(errors.length ? "failed" : "success", summary, errors.length ? errors.join(" | ").slice(0, 2000) : undefined);

    return new Response(JSON.stringify({ found, added, drafted, searches, errors }, null, 2), {
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
