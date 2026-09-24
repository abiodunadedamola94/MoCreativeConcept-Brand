import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// Agent 08 — Screening Agent
// Scores every new, unscreened lead against ICP fit using fields already in
// the CRM (source, client_tier, whether contactable), then either sends a
// discovery questionnaire (strong fit), a lighter nurture note (moderate
// fit), or nothing at all (weak fit — no automated outreach). Rules-based,
// no LLM call. Only RESEND_API_KEY needed, already set.
//
// SCORING RUBRIC (documented, not hidden — adjust here if ICP changes):
//   source:      Referral=4, LinkedIn=2, Inbound=2, Cold Outreach=1, Other/null=1
//   client_tier: Anchor=4, Strategic Partner=4, Growth=2, Passive Buyer/null=1
//   has_email:   +2 if contactable, +0 if not
//   Range: 2 (weakest) to 10 (strongest) — naturally fits fit_score's 1-10 scale.
// THRESHOLDS: >=7 Call, >=4 Nurture, <4 Decline.
//
// KNOWN SIMPLIFICATION: real inbound-inquiry content (what the lead actually
// wrote) isn't captured yet — scoring runs on structured CRM fields only.
// If/when a real contact-form pipeline exists, this should factor in stated
// budget/project signals too, not just source and tier.

// email.mocreativeconcept.com is send-only; replies go to the brand inbox
const REPLY_TO = "hello@mocreativeconcept.com";

Deno.serve(async (_req: Request) => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    if (!resendApiKey) {
      return new Response(JSON.stringify({ error: "RESEND_API_KEY not set" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { data: unscreened, error } = await supabase
      .from("leads")
      .select("id, contact_or_company, source, client_tier, email")
      .is("screened_at", null);

    if (error) throw error;

    const sourceScore: Record<string, number> = { Referral: 4, LinkedIn: 2, Inbound: 2, "Cold Outreach": 1, Other: 1 };
    const tierScore: Record<string, number> = { Anchor: 4, "Strategic Partner": 4, Growth: 2, "Passive Buyer": 1 };

    const results: Record<string, unknown>[] = [];

    for (const lead of unscreened ?? []) {
      const sScore = sourceScore[lead.source ?? ""] ?? 1;
      const tScore = tierScore[lead.client_tier ?? ""] ?? 1;
      const eScore = lead.email ? 2 : 0;
      const fitScore = sScore + tScore + eScore;

      const recommendation = fitScore >= 7 ? "Call" : fitScore >= 4 ? "Nurture" : "Decline";
      const now = new Date().toISOString();

      await supabase
        .from("leads")
        .update({ fit_score: fitScore, screening_recommendation: recommendation, screened_at: now })
        .eq("id", lead.id);

      const logEntry = { agent_name: "08 — Screening Agent", layer: "Layer 1 — Acquisition", triggered_by: "scheduled-check" };
      let sendResult: { attempted: boolean; ok?: boolean } = { attempted: false };

      if (recommendation !== "Decline" && lead.email) {
        const isCall = recommendation === "Call";
        const sendRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${resendApiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: "Abiodun Adedamola <hello@email.mocreativeconcept.com>",
            reply_to: REPLY_TO,
            to: [lead.email],
            subject: isCall ? "A few quick questions" : "Thanks for reaching out",
            template: {
              id: "follow-up",
              variables: {
                SUBJECT_LINE: isCall ? "getting a clearer picture of what you need" : "keeping in touch",
                MESSAGE_BODY: isCall
                  ? "Thanks for reaching out — before we jump on a call, a few quick things would help me come prepared: what's the core problem you're trying to solve, roughly what timeline you're working with, and whether there's a budget range already in mind."
                  : "Thanks for reaching out. Things are a bit full on my end right now, but I wanted to keep the door open — feel free to reply with more on what you're working on, and I'll follow up when the timing's better.",
                ACTION_LINK: "mailto:hello@mocreativeconcept.com?subject=Re%3A%20My%20project",
                ACTION_LABEL: isCall ? "Answer these" : "Tell me more",
              },
            },
          }),
        });
        sendResult = { attempted: true, ok: sendRes.ok };
        const sendJson = await sendRes.json();

        await supabase.from("agent_logs").insert({
          ...logEntry,
          status: sendRes.ok ? "success" : "failed",
          output_summary: sendRes.ok
            ? `Scored "${lead.contact_or_company}" at ${fitScore}/10 (${recommendation}), outreach sent to ${lead.email}`
            : `Scored "${lead.contact_or_company}" at ${fitScore}/10 (${recommendation}), send failed`,
          error_detail: sendRes.ok ? null : JSON.stringify(sendJson),
        });
      } else {
        await supabase.from("agent_logs").insert({
          ...logEntry,
          status: "success",
          output_summary: `Scored "${lead.contact_or_company}" at ${fitScore}/10 (${recommendation})${!lead.email ? " — no email on file, no outreach sent" : " — below outreach threshold"}`,
        });
      }

      results.push({ lead: lead.contact_or_company, fit_score: fitScore, recommendation, outreach: sendResult });
    }

    return new Response(JSON.stringify({ checked_at: new Date().toISOString(), processed: results.length, results }, null, 2), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});
