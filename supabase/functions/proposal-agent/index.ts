import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { refuseUnlessAgentCall } from "../_shared/agent-guard.ts";

// Agent 09 — Proposal Agent
// ────────────────────────────────────────────────────────────────────────
// The ONLY agent in the 33-agent OS that genuinely needs an LLM call.
// Everything else in this system is deterministic formatting wearing
// synthesis's clothes; this one is real synthesis — it reads what is known
// about a lead and writes a scoped, priced proposal for THEM, which is a
// judgement call no rules engine makes well.
//
// TRIGGER: a lead sitting at stage='Intent' with no proposal sent yet.
// That stage is the existing CRM semantic for "they've said they want to
// go ahead" — it is the step a proposal is supposed to convert into
// 'Decision'. No new stage value was invented for this.
//
// ON SUCCESS: writes the proposal to public.proposals, emails the client
// the Resend 'proposal' template pointing at /proposal/<id>, advances the
// lead to 'Decision', and stamps proposal_sent_at so a repeating cron can
// never double-send (same duplicate-guard pattern as Agent 10's
// invoice_issued_at and Agent 18's churn_check_tier).
//
// COST: claude-sonnet-4-6 at ~$3/M input, ~$15/M output. A proposal runs
// roughly $0.02. Real token counts come back on every call and are stored
// per row in proposals.cost_usd — so the running cost of the one metered
// agent is a fact in the database, not an estimate in a doc.
//
// SECRETS REQUIRED: ANTHROPIC_API_KEY, RESEND_API_KEY.

const MODEL = "claude-sonnet-4-6";
const PRICE_IN_PER_MTOK = 3.0;
const PRICE_OUT_PER_MTOK = 15.0;

const SITE = "https://mocreativeconcept.com";
// email.mocreativeconcept.com is send-only; replies go to the brand inbox
const REPLY_TO = "hello@mocreativeconcept.com";
const NGN = (n: number) => `₦${Number(n).toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;

// MoCreative Concept's real rate card lives in public.rate_card (private,
// service-role only), not in this file, because this repository is public.
// The model anchors to those prices instead of inventing numbers — it may
// adjust for scope, but it is not free to price the work from imagination.
type RateRow = { item: string; price_ngn: number; price_max_ngn: number | null; unit: string | null; notes: string | null };

function formatRateCard(rows: RateRow[]): string {
  return rows.map((r) => {
    const price = r.price_max_ngn ? `${NGN(r.price_ngn)} to ${NGN(r.price_max_ngn)}` : NGN(r.price_ngn);
    const unit = r.unit ? ` ${r.unit}` : "";
    const notes = r.notes ? ` (${r.notes})` : "";
    return `${r.item} — ${price}${unit}${notes}`;
  }).join("\n");
}

const systemPrompt = (RATE_CARD: string) => `You write project proposals for MoCreative Concept, a solo-operated,
AI-native product design and build practice run by Abiodun Adedamola David out of Lagos, Nigeria.

Two pillars: product design taken from brief to deployed code, and AI automation
consulting for teams and schools. The brand voice is plain, direct and confident —
never salesy, never padded with adjectives. It sells proof, not promises.

You are given what is actually known about a lead. Produce a proposal scoped to
THAT lead. Where information is missing, make a clearly-labelled assumption rather
than inventing a fact — the practice's own methodology ("Brief-First") treats
tracked assumptions as a deliverable, so stating them is correct, not a weakness.

Price from this rate card. You may combine, omit or adjust line items to fit the
scope, but do not invent prices far outside these bands:
${RATE_CARD}

Respond with ONLY a JSON object, no prose before or after, no markdown fences:
{
  "project_name": "short, specific project title",
  "summary": "2-3 sentences on what the project is and the outcome it produces. Plain language.",
  "scope": [
    { "title": "line item", "description": "one short line on what it covers", "price": 120000 }
  ],
  "timeline": "e.g. 4-5 weeks",
  "assumptions": "the assumptions this scope rests on, as one paragraph. Be specific about what you did not know."
}`;

Deno.serve(async (req: Request) => {
  const refused = await refuseUnlessAgentCall(req);
  if (refused) return refused;
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const missing: string[] = [];
    if (!anthropicKey) missing.push("ANTHROPIC_API_KEY");
    if (!resendApiKey) missing.push("RESEND_API_KEY");
    if (missing.length) {
      return new Response(
        JSON.stringify({
          error: `Missing secret(s): ${missing.join(", ")}. Set them in Supabase dashboard > Edge Functions > Secrets.`,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    const { data: rateRows, error: rateErr } = await supabase
      .from("rate_card")
      .select("item, price_ngn, price_max_ngn, unit, notes")
      .eq("active", true)
      .order("sort", { ascending: true });
    if (rateErr) throw rateErr;

    const { data: leads, error: leadErr } = await supabase
      .from("leads")
      .select("id, contact_or_company, email, source, client_tier, fit_score, notes, screening_recommendation, stage")
      .eq("stage", "Intent")
      .is("proposal_sent_at", null);

    if (leadErr) throw leadErr;

    const logBase = {
      agent_name: "09 — Proposal Agent",
      layer: "Layer 1 — Acquisition",
      triggered_by: "scheduled-intent-check",
    };
    const results: Record<string, unknown>[] = [];

    // never price from nothing: an empty rate card stops the run, visibly
    if ((leads ?? []).length && !(rateRows ?? []).length) {
      await supabase.from("agent_logs").insert({
        ...logBase,
        status: "failed",
        output_summary: `${leads!.length} lead(s) at Intent, but public.rate_card has no active rows — no proposal written.`,
      });
      return new Response(JSON.stringify({ error: "rate_card is empty" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
    const SYSTEM_PROMPT = systemPrompt(formatRateCard((rateRows ?? []) as RateRow[]));

    for (const lead of leads ?? []) {
      if (!lead.email) {
        await supabase.from("agent_logs").insert({
          ...logBase,
          status: "skipped",
          output_summary: `"${lead.contact_or_company}" is at Intent but has no email on file — cannot send a proposal.`,
        });
        results.push({ lead: lead.contact_or_company, status: "skipped", reason: "no email" });
        continue;
      }

      // ── 1. synthesise the proposal ──────────────────────────────────
      const leadContext = [
        `Company or contact: ${lead.contact_or_company}`,
        lead.source ? `How they came in: ${lead.source}` : null,
        lead.client_tier ? `Client tier: ${lead.client_tier}` : null,
        lead.fit_score != null ? `ICP fit score: ${lead.fit_score}/10` : null,
        lead.screening_recommendation ? `Screening call: ${lead.screening_recommendation}` : null,
        lead.notes ? `Notes from discovery:\n${lead.notes}` : "No discovery notes were recorded for this lead.",
      ].filter(Boolean).join("\n");

      const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": anthropicKey!,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 2000,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: `Write a proposal for this lead.\n\n${leadContext}` }],
        }),
      });

      const aiJson = await aiRes.json();

      if (!aiRes.ok) {
        await supabase.from("agent_logs").insert({
          ...logBase,
          status: "failed",
          output_summary: `Claude API call failed for "${lead.contact_or_company}" — no proposal generated, nothing sent.`,
          error_detail: JSON.stringify(aiJson),
        });
        results.push({ lead: lead.contact_or_company, status: "failed", stage: "generation", error: aiJson });
        continue;
      }

      const rawText: string = aiJson?.content?.[0]?.text ?? "";
      const inTok: number = aiJson?.usage?.input_tokens ?? 0;
      const outTok: number = aiJson?.usage?.output_tokens ?? 0;
      const costUsd = (inTok / 1_000_000) * PRICE_IN_PER_MTOK + (outTok / 1_000_000) * PRICE_OUT_PER_MTOK;

      let parsed: {
        project_name?: string;
        summary?: string;
        scope?: { title: string; description?: string; price: number }[];
        timeline?: string;
        assumptions?: string;
      };
      try {
        // tolerate a stray fence even though the prompt forbids one
        const cleaned = rawText.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
        parsed = JSON.parse(cleaned);
      } catch (_e) {
        await supabase.from("agent_logs").insert({
          ...logBase,
          status: "failed",
          output_summary:
            `Claude returned unparseable output for "${lead.contact_or_company}" — nothing sent. Cost incurred anyway: $${costUsd.toFixed(4)}.`,
          error_detail: rawText.slice(0, 1000),
        });
        results.push({ lead: lead.contact_or_company, status: "failed", stage: "parse" });
        continue;
      }

      const scope = Array.isArray(parsed.scope) ? parsed.scope : [];
      const investment = scope.reduce((t, s) => t + (Number(s.price) || 0), 0);
      const projectName = parsed.project_name || `${lead.contact_or_company} — project`;

      if (!scope.length || !investment) {
        await supabase.from("agent_logs").insert({
          ...logBase,
          status: "failed",
          output_summary: `Generated proposal for "${lead.contact_or_company}" had no priced scope — not sending an empty proposal.`,
          error_detail: rawText.slice(0, 1000),
        });
        results.push({ lead: lead.contact_or_company, status: "failed", stage: "empty-scope" });
        continue;
      }

      // ── 2. persist it ───────────────────────────────────────────────
      const { data: proposal, error: propErr } = await supabase
        .from("proposals")
        .insert({
          lead_id: lead.id,
          project_name: projectName,
          summary: parsed.summary ?? null,
          scope_json: scope,
          timeline: parsed.timeline ?? null,
          investment_ngn: investment,
          assumptions: parsed.assumptions ?? null,
          model_used: MODEL,
          input_tokens: inTok,
          output_tokens: outTok,
          cost_usd: Number(costUsd.toFixed(6)),
          status: "draft",
          sent_to: lead.email,
        })
        .select("id")
        .single();

      if (propErr || !proposal) {
        await supabase.from("agent_logs").insert({
          ...logBase,
          status: "failed",
          output_summary: `Proposal generated for "${lead.contact_or_company}" but could not be saved — not sending a link to nothing.`,
          error_detail: JSON.stringify(propErr),
        });
        results.push({ lead: lead.contact_or_company, status: "failed", stage: "persist" });
        continue;
      }

      const proposalLink = `${SITE}/proposal/${proposal.id}`;

      // ── 3. send it ──────────────────────────────────────────────────
      const sendRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendApiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "Abiodun Adedamola <hello@email.mocreativeconcept.com>",
          reply_to: REPLY_TO,
          to: [lead.email],
          subject: `Your MoCreative Concept proposal — ${projectName}`,
          template: {
            id: "proposal",
            variables: { PROJECT_NAME: projectName, PROPOSAL_LINK: proposalLink },
          },
        }),
      });

      const sendJson = await sendRes.json();

      if (!sendRes.ok) {
        await supabase.from("agent_logs").insert({
          ...logBase,
          status: "failed",
          output_summary:
            `Proposal saved for "${lead.contact_or_company}" (${NGN(investment)}) but the email failed. Lead left at Intent so the next run retries the send, not the generation.`,
          error_detail: JSON.stringify(sendJson),
        });
        results.push({ lead: lead.contact_or_company, status: "failed", stage: "send", proposal_id: proposal.id });
        continue;
      }

      // ── 4. advance the lead + close the duplicate guard ─────────────
      const now = new Date().toISOString();
      await supabase
        .from("proposals")
        .update({ status: "sent", resend_id: sendJson.id, updated_at: now })
        .eq("id", proposal.id);

      await supabase
        .from("leads")
        .update({ stage: "Decision", proposal_sent_at: now, updated_at: now })
        .eq("id", lead.id);

      await supabase.from("agent_logs").insert({
        ...logBase,
        status: "success",
        output_summary:
          `Proposal "${projectName}" (${NGN(investment)}, ${scope.length} line items, ${parsed.timeline ?? "no timeline"}) written and sent to ${lead.email}. ` +
          `Lead advanced Intent → Decision. Cost $${costUsd.toFixed(4)} (${inTok} in / ${outTok} out). Resend id: ${sendJson.id}.`,
      });

      results.push({
        lead: lead.contact_or_company,
        status: "sent",
        proposal_id: proposal.id,
        project_name: projectName,
        investment_ngn: investment,
        line_items: scope.length,
        cost_usd: Number(costUsd.toFixed(4)),
        resend_id: sendJson.id,
      });
    }

    return new Response(
      JSON.stringify({ checked_at: new Date().toISOString(), processed: results.length, results }, null, 2),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
