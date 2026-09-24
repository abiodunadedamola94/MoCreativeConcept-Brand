import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// Agent 18 — Churn Prevention Agent
// Watches retained clients (projects.status = 'Retained') for silence,
// escalating in three tiers: 14 days = warm check-in to client, 21 days =
// more direct personal outreach to client, 30 days = escalation alert to
// the founder, not the client. Rules-based, no LLM call (matches Agent 01's
// cost-conscious pattern) — only RESEND_API_KEY needed, already set.
//
// KNOWN SIMPLIFICATION: the original spec's "client communication log" input
// doesn't exist as a table yet. This uses projects.updated_at as a proxy for
// "last recorded activity" — real but imperfect (doesn't see email replies
// outside this system). Documented, not hidden.

// email.mocreativeconcept.com is send-only. The brand inbox receives client
// replies and forwards founder alerts (Cloudflare Email Routing).
const INBOX = "hello@mocreativeconcept.com";

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

    const { data: retained, error } = await supabase
      .from("projects")
      .select("id, project_name, client_id, updated_at, churn_check_tier")
      .eq("status", "Retained");

    if (error) throw error;

    const now = new Date();
    const results: Record<string, unknown>[] = [];

    for (const project of retained ?? []) {
      const daysSilent = Math.floor((now.getTime() - new Date(project.updated_at).getTime()) / (1000 * 60 * 60 * 24));
      const logEntry = { agent_name: "18 — Churn Prevention Agent", layer: "Layer 3 — MRR Engine", triggered_by: "scheduled-daily-check" };

      // Silence broken since last check — reset tier
      if (daysSilent < 14 && project.churn_check_tier > 0) {
        await supabase.from("projects").update({ churn_check_tier: 0 }).eq("id", project.id);
        results.push({ project: project.project_name, action: "tier reset", days_silent: daysSilent });
        continue;
      }

      let targetTier = 0;
      if (daysSilent >= 30) targetTier = 3;
      else if (daysSilent >= 21) targetTier = 2;
      else if (daysSilent >= 14) targetTier = 1;

      if (targetTier === 0 || targetTier <= project.churn_check_tier) {
        results.push({ project: project.project_name, action: "no action needed", days_silent: daysSilent, tier: project.churn_check_tier });
        continue;
      }

      // Tier 3: escalate to founder, not client
      if (targetTier === 3) {
        const escalateRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${resendApiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: "MoCreative Churn Agent <hello@email.mocreativeconcept.com>",
            to: [INBOX],
            subject: `Escalation: ${project.project_name} has gone quiet 30+ days`,
            html: `<p>Retained client project "<strong>${project.project_name}</strong>" has had no recorded activity for ${daysSilent} days. Two automated check-ins have already gone to the client at 14 and 21 days with no visible change. Worth a personal call or message before this quietly churns.</p>`,
          }),
        });
        const escalateJson = await escalateRes.json();
        if (escalateRes.ok) {
          await supabase.from("projects").update({ churn_check_tier: 3 }).eq("id", project.id);
        }
        await supabase.from("agent_logs").insert({
          ...logEntry,
          status: escalateRes.ok ? "success" : "failed",
          output_summary: escalateRes.ok ? `Escalation alert sent to founder for "${project.project_name}" (${daysSilent}d silent)` : "Escalation send failed",
          error_detail: escalateRes.ok ? null : JSON.stringify(escalateJson),
        });
        results.push({ project: project.project_name, action: "escalated to founder", days_silent: daysSilent, sent: escalateRes.ok });
        continue;
      }

      // Tiers 1 & 2: client-facing check-in via Follow-up template
      if (!project.client_id) {
        results.push({ project: project.project_name, action: "skipped — no client_id" });
        continue;
      }
      const { data: client } = await supabase.from("leads").select("email").eq("id", project.client_id).single();
      if (!client?.email) {
        results.push({ project: project.project_name, action: "skipped — no client email" });
        continue;
      }

      const isFirstCheckIn = targetTier === 1;
      const emailPayload = {
        from: "Abiodun Adedamola <hello@email.mocreativeconcept.com>",
        reply_to: INBOX,
        to: [client.email],
        subject: isFirstCheckIn ? `Checking in on ${project.project_name}` : `Still here for ${project.project_name}`,
        template: {
          id: "follow-up",
          variables: {
            SUBJECT_LINE: isFirstCheckIn ? `how's ${project.project_name} going` : `following up again on ${project.project_name}`,
            MESSAGE_BODY: isFirstCheckIn
              ? `It's been a couple of weeks since we last touched base on ${project.project_name} — wanted to check in and see how things are going, and whether there's anything you need from me.`
              : `Reaching out again on ${project.project_name} — haven't heard back in a few weeks and want to make sure nothing's fallen through the cracks on my end. Happy to jump on a quick call if that's easier than email.`,
            ACTION_LINK: "mailto:hello@mocreativeconcept.com?subject=Checking%20in",
            ACTION_LABEL: isFirstCheckIn ? "Let's touch base" : "Let's reconnect",
          },
        },
      };

      const sendRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendApiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify(emailPayload),
      });
      const sendJson = await sendRes.json();

      if (sendRes.ok) {
        await supabase.from("projects").update({ churn_check_tier: targetTier }).eq("id", project.id);
      }

      await supabase.from("agent_logs").insert({
        ...logEntry,
        status: sendRes.ok ? "success" : "failed",
        output_summary: sendRes.ok
          ? `Tier ${targetTier} check-in sent to ${client.email} for "${project.project_name}" (${daysSilent}d silent)`
          : `Tier ${targetTier} send failed for "${project.project_name}"`,
        error_detail: sendRes.ok ? null : JSON.stringify(sendJson),
      });

      results.push({ project: project.project_name, action: `tier ${targetTier} check-in sent`, days_silent: daysSilent, sent: sendRes.ok });
    }

    return new Response(JSON.stringify({ checked_at: now.toISOString(), processed: results.length, results }, null, 2), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});
