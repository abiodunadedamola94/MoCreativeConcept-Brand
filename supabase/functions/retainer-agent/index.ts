import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// Agent 16 — Retainer Agent
// The highest-leverage agent on the roadmap: proposes a monthly retainer to
// every client whose project has sat at status='Delivered' for 48+ hours.
// Idempotent by design — once sent, status moves to 'Retainer Proposed',
// which naturally excludes it from the next run's query.
//
// REQUIRES a secret before this can actually send: RESEND_API_KEY.
// Set via Supabase dashboard (Edge Functions > Secrets) or CLI
// (supabase secrets set RESEND_API_KEY=re_xxx) — this cannot be set
// through this deployment call.
//
// KNOWN RISK, untested as of this build: Resend has a documented bug where
// a template variable placed inside an <a href> (exactly what ACTION_LINK is
// in the follow-up template) can get mangled when sent via the REST API's
// template.variables path, even though it renders fine in Resend's own
// dashboard test-send. Send one real test through this function and check
// the actual received email's button before trusting it in production. If
// broken, the fix is to stop using template.variables for the link and build
// the full HTML in this function instead, sent via the plain `html` field.

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

    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

    const { data: projects, error: projErr } = await supabase
      .from("projects")
      .select("id, project_name, client_id, updated_at")
      .eq("status", "Delivered")
      .lte("updated_at", cutoff);

    if (projErr) throw projErr;

    const results: Record<string, unknown>[] = [];

    for (const project of projects ?? []) {
      const logEntry = {
        agent_name: "16 — Retainer Agent",
        layer: "Layer 3 — MRR Engine",
        triggered_by: "scheduled-48hr-check",
      };

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
        subject: `What's next for ${project.project_name}?`,
        template: {
          id: "follow-up",
          variables: {
            SUBJECT_LINE: `keeping the momentum on ${project.project_name}`,
            MESSAGE_BODY: `${project.project_name} is delivered — really glad we got it there. A lot of clients find the first weeks after launch are exactly when small design and content updates come up, so I wanted to flag: I offer a monthly design retainer for exactly this kind of ongoing work, if it's useful.`,
            ACTION_LINK: "mailto:hello@mocreativeconcept.com?subject=Retainer%20options",
            ACTION_LABEL: "Let's talk retainer options",
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
        .update({ status: "Retainer Proposed", updated_at: new Date().toISOString() })
        .eq("id", project.id);

      await supabase.from("agent_logs").insert({
        ...logEntry,
        status: "success",
        output_summary: `Retainer proposal sent to ${client.email} for "${project.project_name}". Resend id: ${sendJson.id}`,
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
