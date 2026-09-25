import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { refuseUnlessAgentCall } from "../_shared/agent-guard.ts";

// Agent 10 — Contract + Invoice Agent
// Fires the moment a proposal is accepted. In this system that moment is
// defined as: a new row appears in Project Tracker (public.projects) —
// per the operating brain's own convention, Project Tracker is empty until
// the first proposal is signed, so a fresh row at status='Brief' IS the
// acceptance signal. Issues the initial invoice for that project.
//
// SCOPE NOTE (v1, honest gap — not fabricated): the roadmap's original spec
// says "issues services agreement + invoice". Only the invoice half is
// built here. No Resend template exists yet for a services agreement /
// contract, and inventing one without knowing what terms MoCreative Concept
// actually wants in a signed agreement would be worse than not building it.
// Flagged in the Notion Agent Build Roadmap as a follow-up, not silently
// dropped.
//
// This is pure formatting (known fields → a filled invoice), not synthesis
// — no LLM call, no ANTHROPIC_API_KEY dependency, unlike Agent 09.
//
// Payment split defaults to 40% deposit / 30% midway / 30% final — a
// standing default, not read from any per-project field (none exists yet).
// No tax is charged by default (TAX_AMOUNT is always ₦0) until MoCreative
// Concept has a real VAT policy to encode.
//
// PAYMENT_INFO_HTML deliberately does NOT repeat the account details inline;
// it points to INVOICE_LINK (the site's /invoice page, which lists them),
// same as the button.
//
// REQUIRES a secret before this can actually send: RESEND_API_KEY.
// Set via Supabase dashboard (Edge Functions > Secrets) or CLI — this
// cannot be set through deployment.

const NGN = (n: number) => `₦${n.toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;

const INVOICE_LANDING_PAGE = "https://mocreativeconcept.com/invoice";
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
      .select("id, project_name, client_id, value_ngn, start_date, deadline, invoice_issued_at, created_at")
      .eq("status", "Brief")
      .is("invoice_issued_at", null);

    if (projErr) throw projErr;

    const results: Record<string, unknown>[] = [];

    for (const project of projects ?? []) {
      const logEntry = {
        agent_name: "10 — Contract + Invoice Agent",
        layer: "Layer 1 — Acquisition",
        triggered_by: "scheduled-brief-check",
      };

      if (!project.client_id) {
        await supabase.from("agent_logs").insert({
          ...logEntry,
          status: "skipped",
          output_summary: `Project "${project.project_name}" has no linked client_id — cannot invoice.`,
        });
        results.push({ project: project.project_name, status: "skipped", reason: "no client_id" });
        continue;
      }

      if (!project.value_ngn) {
        await supabase.from("agent_logs").insert({
          ...logEntry,
          status: "skipped",
          output_summary: `Project "${project.project_name}" has no value_ngn set — nothing to invoice yet.`,
        });
        results.push({ project: project.project_name, status: "skipped", reason: "no value_ngn" });
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

      const total = Number(project.value_ngn);
      const depositPct = 40;
      const midwayPct = 30;
      const finalPct = 30;

      const lineItemsHtml = `<tr bgcolor="#E2E2E2"><td style="padding:10px 12px; font-family:Arial, Helvetica, sans-serif; font-size:13px; color:#0A0A0A; border-top:1px solid #BEBEBE;">${project.project_name}</td><td align="right" style="padding:10px 12px; font-family:'Courier New', Courier, monospace; font-size:13px; color:#0A0A0A; border-top:1px solid #BEBEBE;">${NGN(total)}</td><td align="center" style="padding:10px 12px; font-family:'Courier New', Courier, monospace; font-size:13px; color:#0A0A0A; border-top:1px solid #BEBEBE;">1</td><td align="right" style="padding:10px 12px; font-family:'Courier New', Courier, monospace; font-size:13px; color:#0A0A0A; border-top:1px solid #BEBEBE;">${NGN(total)}</td></tr>`;

      const invoiceNumber = `INV-${new Date().getFullYear()}-${String(project.id).replace(/-/g, "").slice(0, 6).toUpperCase()}`;
      const timeline = project.start_date && project.deadline
        ? `${project.start_date} to ${project.deadline}`
        : "See proposal for full timeline";

      const emailPayload = {
        from: "Abiodun Adedamola <hello@email.mocreativeconcept.com>",
        reply_to: REPLY_TO,
        to: [client.email],
        subject: `Invoice ${invoiceNumber} — ${client.contact_or_company}`,
        template: {
          id: "invoice",
          variables: {
            CLIENT_NAME: client.contact_or_company ?? "—",
            CLIENT_ADDRESS: "—",
            CLIENT_PHONE: "—",
            INVOICE_NUMBER: invoiceNumber,
            TIMELINE: timeline,
            INVOICE_DATE: new Date().toISOString().slice(0, 10),
            LINE_ITEMS_HTML: lineItemsHtml,
            SUBTOTAL: NGN(total),
            ADDITIONAL_COSTS_HTML: "",
            TAX_LABEL: "Tax",
            TAX_AMOUNT: NGN(0),
            GRAND_TOTAL: NGN(total),
            DEPOSIT_PCT: String(depositPct),
            DEPOSIT_AMOUNT: NGN(Math.round((total * depositPct) / 100)),
            MIDWAY_PCT: String(midwayPct),
            MIDWAY_AMOUNT: NGN(Math.round((total * midwayPct) / 100)),
            FINAL_PCT: String(finalPct),
            FINAL_AMOUNT: NGN(Math.round((total * finalPct) / 100)),
            SUPPORT_NOTE:
              "30 days of post-launch support included at no extra charge — bug fixes and small adjustments covered.",
            PROJECT_POSITIONING:
              "One person, AI-native — product design and build, from brief to shipped code.",
            PAYMENT_INFO_HTML: "See the payment options on the invoice link above.",
            INVOICE_LINK: INVOICE_LANDING_PAGE,
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
          output_summary: `Invoice send failed for "${project.project_name}" to ${client.email}`,
          error_detail: JSON.stringify(sendJson),
        });
        results.push({ project: project.project_name, status: "failed", error: sendJson });
        continue;
      }

      await supabase
        .from("projects")
        .update({ invoice_issued_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq("id", project.id);

      await supabase.from("agent_logs").insert({
        ...logEntry,
        status: "success",
        output_summary: `Invoice ${invoiceNumber} (${NGN(total)}) sent to ${client.email} for "${project.project_name}". Resend id: ${sendJson.id}.`,
      });

      results.push({ project: project.project_name, status: "sent", invoice_number: invoiceNumber, resend_id: sendJson.id });
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
