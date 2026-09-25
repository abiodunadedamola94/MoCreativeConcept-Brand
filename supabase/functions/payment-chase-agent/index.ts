import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { refuseUnlessAgentCall } from "../_shared/agent-guard.ts";

// Agent 27 — Payment Chase Agent
// Escalating reminders on unpaid invoices: day 7 = gentle reminder, day 14 =
// firmer follow-up, day 30 = formal notice to client + escalation to the
// founder. Rules-based, no LLM (matches Agents 01/18's cost-conscious
// pattern). Same tiered-tracking idempotency pattern as Agent 18: only
// RESEND_API_KEY needed, already set.

// email.mocreativeconcept.com is send-only. The brand inbox receives client
// replies and forwards founder alerts (Cloudflare Email Routing).
const INBOX = "hello@mocreativeconcept.com";

function fmtNgn(n: number): string {
  return `₦${n.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

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

    const { data: unpaid, error } = await supabase
      .from("revenue")
      .select("id, entry, amount_ngn, status, entry_date, due_date, payment_chase_tier, client_id")
      .in("status", ["Invoiced", "Overdue"]);

    if (error) throw error;

    const now = new Date();
    const results: Record<string, unknown>[] = [];

    for (const inv of unpaid ?? []) {
      const referenceDate = new Date(inv.due_date ?? inv.entry_date);
      const daysPastDue = Math.floor((now.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24));
      const logEntry = { agent_name: "27 — Payment Chase Agent", layer: "Layer 5 — Finance", triggered_by: "scheduled-daily-check" };

      // Flip Invoiced -> Overdue once genuinely past due, regardless of tier action
      if (daysPastDue >= 1 && inv.status === "Invoiced") {
        await supabase.from("revenue").update({ status: "Overdue" }).eq("id", inv.id);
      }

      let targetTier = 0;
      if (daysPastDue >= 30) targetTier = 3;
      else if (daysPastDue >= 14) targetTier = 2;
      else if (daysPastDue >= 7) targetTier = 1;

      if (targetTier === 0 || targetTier <= inv.payment_chase_tier) {
        results.push({ entry: inv.entry, action: "no action needed", days_past_due: daysPastDue, tier: inv.payment_chase_tier });
        continue;
      }

      if (!inv.client_id) {
        results.push({ entry: inv.entry, action: "skipped — no client_id" });
        continue;
      }
      const { data: client } = await supabase.from("leads").select("email").eq("id", inv.client_id).single();
      if (!client?.email) {
        results.push({ entry: inv.entry, action: "skipped — no client email" });
        continue;
      }

      const amount = fmtNgn(Number(inv.amount_ngn));
      let subjectLine: string, messageBody: string, actionLabel: string;

      if (targetTier === 1) {
        subjectLine = `quick reminder on ${inv.entry}`;
        messageBody = `Just a gentle reminder that ${inv.entry} (${amount}) is now past due. No stress if it's already in motion on your end — just flagging in case it slipped.`;
        actionLabel = "View invoice details";
      } else if (targetTier === 2) {
        subjectLine = `following up again on ${inv.entry}`;
        messageBody = `Following up again on ${inv.entry} (${amount}) — it's now two weeks past due. Let me know if there's anything blocking payment on your end, or if the invoice needs adjusting.`;
        actionLabel = "Let's sort this out";
      } else {
        subjectLine = `formal notice — ${inv.entry}`;
        messageBody = `${inv.entry} (${amount}) is now 30 days past due. This is a formal notice — please reach out so we can resolve this, or let me know if there's a dispute I'm not aware of.`;
        actionLabel = "Contact me directly";
      }

      const sendRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendApiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "Abiodun Adedamola <hello@email.mocreativeconcept.com>",
          reply_to: INBOX,
          to: [client.email],
          subject: targetTier === 3 ? `Formal notice: ${inv.entry}` : `Payment reminder: ${inv.entry}`,
          template: {
            id: "follow-up",
            variables: {
              SUBJECT_LINE: subjectLine,
              MESSAGE_BODY: messageBody,
              ACTION_LINK: "mailto:hello@mocreativeconcept.com?subject=Re%3A%20Invoice%20payment",
              ACTION_LABEL: actionLabel,
            },
          },
        }),
      });
      const sendJson = await sendRes.json();

      if (sendRes.ok) {
        await supabase.from("revenue").update({ payment_chase_tier: targetTier }).eq("id", inv.id);
      }

      // Tier 3 also alerts the founder
      if (targetTier === 3 && sendRes.ok) {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${resendApiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: "MoCreative Payment Chase Agent <hello@email.mocreativeconcept.com>",
            to: [INBOX],
            subject: `Escalation: ${inv.entry} is 30+ days overdue`,
            html: `<p>"<strong>${inv.entry}</strong>" (${amount}) is now ${daysPastDue} days past due. A formal notice was just sent to the client. Worth deciding whether to escalate further (legal, collections) or write it off.</p>`,
          }),
        });
      }

      await supabase.from("agent_logs").insert({
        ...logEntry,
        status: sendRes.ok ? "success" : "failed",
        output_summary: sendRes.ok
          ? `Tier ${targetTier} chase sent to ${client.email} for "${inv.entry}" (${daysPastDue}d past due)`
          : `Tier ${targetTier} send failed for "${inv.entry}"`,
        error_detail: sendRes.ok ? null : JSON.stringify(sendJson),
      });

      results.push({ entry: inv.entry, action: `tier ${targetTier} chase sent`, days_past_due: daysPastDue, sent: sendRes.ok });
    }

    return new Response(JSON.stringify({ checked_at: now.toISOString(), processed: results.length, results }, null, 2), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});
