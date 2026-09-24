import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// Agent 15 — Delivery Agent
// The missing link between QA and the retainer pipeline: watches for
// projects that have cleared QA, packages the handoff, sends it, and moves
// status to 'Delivered' — which is exactly the status Agent 16 (Retainer)
// watches for 48 hours later. Before this agent existed, nothing set that
// status automatically.
//
// Reuses the generic 'follow-up' Resend template rather than a dedicated
// one — this is pure formatting (known fields into readable text), not
// synthesis, so no LLM call and no new template needed. Uses the new
// CLOSING_NOTE variable to give the handoff a tone that actually fits a
// finished, successful project, instead of the template's generic default.
//
// REQUIRES a secret before this can actually send: RESEND_API_KEY.
// Set via Supabase dashboard (Edge Functions > Secrets) or CLI — this
// cannot be set through deployment.
//
// Only fires for projects at status='QA' with a non-empty deliverable_link
// — no email is worth sending without something real to hand over.

// email.mocreativeconcept.com is send-only; replies go to the brand inbox
const REPLY_TO = "hello@mocreativeconcept.com";

Deno.serve(async (req: Request) => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    if (!resendApiKey) {
      return new Response(
        JSON.stringify({
          error:
            "RESEND_API_KEY secret not set. Add it in Supabase dashboard > Edge Functions > Secrets before this agent can send anything.",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    const { data: projects, error: projErr } = await supabase
      .from("projects")
      .select("id, project_name, client_id, deliverable_link, updated_at")
      .eq("status", "QA");

    if (projErr) throw projErr;

    const results: Record<string, unknown>[] = [];

    for (const project of projects ?? []) {
      const logEntry = {
        agent_name: "15 — Delivery Agent",
        layer: "Layer 2 — Delivery",
        triggered_by: "scheduled-qa-check",
      };

      if (!project.deliverable_link) {
        await supabase.from("agent_logs").insert({
          ...logEntry,
          status: "skipped",
          output_summary: `Project "${project.project_name}" is at QA but has no deliverable_link set — nothing to hand off yet.`,
        });
        results.push({ project: project.project_name, status: "skipped", reason: "no deliverable_link" });
        continue;
      }

      if (!project.client_id) {
        await supabase.from("agent_logs").insert({
          ...logEntry,
          status: "skipped",
          output_summary: `Project "${project.project_name}" has no linked client_id — cannot send.`,
        });
        results.push({ project: project.project_name, status: "skipped", reason: "no client_id" });
        continue;
      }

      const { data: client, error: clientErr } = await supabase
        .from("leads")
        .select("email, contact_or_company")
        .eq("id", project.client_id)
        .single();

      if (clientErr || !client?.email) {
        await supabase.from("agent_logs").insert({
          ...logEntry,
          status: "skipped",
          output_summary: `Project "${project.project_name}" — linked client has no email on file.`,
        });
        results.push({ project: project.project_name, status: "skipped", reason: "no client email" });
        continue;
      }

      const emailPayload = {
        from: "Abiodun Adedamola <hello@email.mocreativeconcept.com>",
        reply_to: REPLY_TO,
        to: [client.email],
        subject: `${project.project_name} is ready — here's everything`,
        template: {
          id: "follow-up",
          variables: {
            SUBJECT_LINE: `${project.project_name} handoff`,
            MESSAGE_BODY: `${project.project_name} has cleared QA and is ready for handoff. Everything's packaged below — files, documentation, and access to the finished build.`,
            ACTION_LINK: project.deliverable_link,
            ACTION_LABEL: "View Your Deliverables",
            CLOSING_NOTE:
              "That wraps up the build — congratulations on the launch. Reach out anytime if anything needs a look.",
          },
        },
      };

      const sendRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(emailPayload),
      });

      const sendJson = await sendRes.json();

      if (!sendRes.ok) {
        await supabase.from("agent_logs").insert({
          ...logEntry,
          status: "failed",
          output_summary: `Send failed for "${project.project_name}" to ${client.email}`,
          error_detail: JSON.stringify(sendJson),
        });
        results.push({ project: project.project_name, status: "failed", error: sendJson });
        continue;
      }

      await supabase
        .from("projects")
        .update({ status: "Delivered", updated_at: new Date().toISOString() })
        .eq("id", project.id);

      await supabase.from("agent_logs").insert({
        ...logEntry,
        status: "success",
        output_summary: `Handoff sent to ${client.email} for "${project.project_name}". Resend id: ${sendJson.id}. Status moved to Delivered.`,
      });

      results.push({ project: project.project_name, status: "sent", resend_id: sendJson.id });
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
