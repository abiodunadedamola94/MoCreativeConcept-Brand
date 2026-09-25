import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { refuseUnlessAgentCall } from "../_shared/agent-guard.ts";

// Agent 14 — Client Comms Agent
// Weekly status update to clients on active projects, every Friday. Rules-
// based, no LLM — only RESEND_API_KEY needed, already set. No dedup tracking
// needed: the Friday-only schedule itself prevents multiple sends per week.
//
// KNOWN SIMPLIFICATION: there's no per-project activity log capturing what
// specifically happened this week (no granular "did X, Y, Z" record), so
// this reports factual status + deadline countdown rather than a narrative
// "here's what we shipped" summary. Genuinely useful (clients always know
// where things stand), but not the richer version the original spec implies
// — that would need either real activity logging or an LLM synthesizing
// from richer inputs, neither of which exist yet.

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

    const { data: active, error } = await supabase
      .from("projects")
      .select("id, project_name, client_id, status, deadline, assumptions")
      .in("status", ["Brief", "In Delivery", "QA"]);

    if (error) throw error;

    const results: Record<string, unknown>[] = [];

    for (const project of active ?? []) {
      if (!project.client_id) {
        results.push({ project: project.project_name, action: "skipped — no client_id" });
        continue;
      }
      const { data: client } = await supabase.from("leads").select("email").eq("id", project.client_id).single();
      if (!client?.email) {
        results.push({ project: project.project_name, action: "skipped — no client email" });
        continue;
      }

      let weekSummary = `"${project.project_name}" is currently at the ${project.status} stage.`;
      if (project.assumptions) {
        weekSummary += ` A quick note on what we're tracking: ${project.assumptions}`;
      }

      let nextSteps: string;
      if (project.deadline) {
        const daysLeft = Math.ceil((new Date(project.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        nextSteps = daysLeft >= 0
          ? `We're on track for the ${project.deadline} target — ${daysLeft} day(s) out.`
          : `The original target of ${project.deadline} has passed — I'll follow up separately on the revised timeline if we haven't already talked about it.`;
      } else {
        nextSteps = "No fixed deadline set yet — moving at a steady pace. Let me know if you'd like to lock one in.";
      }

      const sendRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendApiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "Abiodun Adedamola <hello@email.mocreativeconcept.com>",
          reply_to: REPLY_TO,
          to: [client.email],
          subject: `Your weekly update — ${project.project_name}`,
          template: {
            id: "weekly-update",
            variables: { PROJECT_NAME: project.project_name, WEEK_SUMMARY: weekSummary, NEXT_STEPS: nextSteps },
          },
        }),
      });
      const sendJson = await sendRes.json();

      await supabase.from("agent_logs").insert({
        agent_name: "14 — Client Comms Agent",
        layer: "Layer 2 — Delivery",
        triggered_by: "scheduled-weekly-friday",
        status: sendRes.ok ? "success" : "failed",
        output_summary: sendRes.ok ? `Weekly update sent to ${client.email} for "${project.project_name}"` : `Send failed for "${project.project_name}"`,
        error_detail: sendRes.ok ? null : JSON.stringify(sendJson),
      });

      results.push({ project: project.project_name, action: "weekly update sent", sent: sendRes.ok });
    }

    return new Response(JSON.stringify({ checked_at: new Date().toISOString(), processed: results.length, results }, null, 2), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});
