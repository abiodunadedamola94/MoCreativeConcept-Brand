import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { refuseUnlessAgentCall } from "../_shared/agent-guard.ts";

// Agent 20 — Referral Agent
// Ladder of increasingly bigger asks to clients whose project finished well:
// 14 days = permission to feature as a case study (smallest ask), 21 days =
// testimonial request, 30 days = referral ask (biggest ask). Rules-based,
// no LLM call — only RESEND_API_KEY needed, already set.
//
// KNOWN SIMPLIFICATION: there's no NPS/satisfaction signal in the schema, so
// "satisfied client" is proxied by status IN ('Delivered','Retained') — the
// project didn't end badly, which is a real but imperfect proxy for genuine
// satisfaction. Also: this doesn't coordinate with Agent 18 (Churn) — a
// project could theoretically get both a churn check-in and a referral ask
// in the same window if it's both quiet and post-delivery. Not harmful
// (different asks, different templates), just not deduplicated across agents.

// email.mocreativeconcept.com is send-only; replies go to the brand inbox
const REPLY_TO = "hello@mocreativeconcept.com";

Deno.serve(async (req: Request) => {
  const refused = await refuseUnlessAgentCall(req);
  if (refused) return refused;
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

    const { data: candidates, error } = await supabase
      .from("projects")
      .select("id, project_name, client_id, updated_at, referral_tier")
      .in("status", ["Delivered", "Retained"]);

    if (error) throw error;

    const now = new Date();
    const results: Record<string, unknown>[] = [];

    for (const project of candidates ?? []) {
      const daysSince = Math.floor((now.getTime() - new Date(project.updated_at).getTime()) / (1000 * 60 * 60 * 24));
      const logEntry = { agent_name: "20 — Referral Agent", layer: "Layer 3 — MRR Engine", triggered_by: "scheduled-daily-check" };

      let targetTier = 0;
      if (daysSince >= 30) targetTier = 3;
      else if (daysSince >= 21) targetTier = 2;
      else if (daysSince >= 14) targetTier = 1;

      if (targetTier === 0 || targetTier <= project.referral_tier) {
        results.push({ project: project.project_name, action: "no action needed", days_since: daysSince, tier: project.referral_tier });
        continue;
      }

      if (!project.client_id) {
        results.push({ project: project.project_name, action: "skipped — no client_id" });
        continue;
      }
      const { data: client } = await supabase.from("leads").select("email").eq("id", project.client_id).single();
      if (!client?.email) {
        results.push({ project: project.project_name, action: "skipped — no client email" });
        continue;
      }

      let subjectLine: string, messageBody: string, actionLabel: string, emailSubject: string;

      if (targetTier === 1) {
        emailSubject = `Quick ask about ${project.project_name}`;
        subjectLine = `featuring ${project.project_name} as a case study`;
        messageBody = `Now that ${project.project_name} has had a bit of time to settle, I wanted to ask — would you be okay with me featuring it as a case study on my site? Happy to run anything by you before it goes up.`;
        actionLabel = "Sure, go ahead";
      } else if (targetTier === 2) {
        emailSubject = `A small favor — ${project.project_name}`;
        subjectLine = `a short testimonial for ${project.project_name}`;
        messageBody = `If you've got two minutes — would you be willing to share a short line or two about what it was like working together on ${project.project_name}? Even a couple of sentences helps a lot.`;
        actionLabel = "Happy to share a few lines";
      } else {
        emailSubject = `One more ask — ${project.project_name}`;
        subjectLine = `know anyone else who could use this`;
        messageBody = `Glad ${project.project_name} has been working out. If anyone in your network is dealing with something similar — a product needing design, or a build that needs to move fast — I'd genuinely appreciate the introduction.`;
        actionLabel = "I might know someone";
      }

      const sendRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendApiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "Abiodun Adedamola <hello@email.mocreativeconcept.com>",
          reply_to: REPLY_TO,
          to: [client.email],
          subject: emailSubject,
          template: {
            id: "follow-up",
            variables: {
              SUBJECT_LINE: subjectLine,
              MESSAGE_BODY: messageBody,
              ACTION_LINK: "mailto:hello@mocreativeconcept.com?subject=Re%3A%20Your%20ask",
              ACTION_LABEL: actionLabel,
            },
          },
        }),
      });
      const sendJson = await sendRes.json();

      if (sendRes.ok) {
        await supabase.from("projects").update({ referral_tier: targetTier }).eq("id", project.id);
      }

      await supabase.from("agent_logs").insert({
        ...logEntry,
        status: sendRes.ok ? "success" : "failed",
        output_summary: sendRes.ok
          ? `Tier ${targetTier} ask sent to ${client.email} for "${project.project_name}" (${daysSince}d since)`
          : `Tier ${targetTier} send failed for "${project.project_name}"`,
        error_detail: sendRes.ok ? null : JSON.stringify(sendJson),
      });

      results.push({ project: project.project_name, action: `tier ${targetTier} ask sent`, days_since: daysSince, sent: sendRes.ok });
    }

    return new Response(JSON.stringify({ checked_at: now.toISOString(), processed: results.length, results }, null, 2), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});
