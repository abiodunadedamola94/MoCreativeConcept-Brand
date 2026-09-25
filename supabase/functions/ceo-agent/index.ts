import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { refuseUnlessAgentCall } from "../_shared/agent-guard.ts";

// Agent 01 — CEO Agent (lite: no LLM call, zero marginal cost)
// Formats yesterday's agent activity + revenue + project status into a plain
// rules-based daily brief, sent every morning. No ANTHROPIC_API_KEY needed —
// only RESEND_API_KEY, already set from Agent 16.
//
// Deliberately simpler than a Claude-synthesized brief: exact numbers, plain
// rule-based flags, no narrative writing. Upgradeable later to call Claude
// for actual synthesis once there's budget for it — see the commented block
// at the bottom for where that would slot back in.

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

    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ error: "RESEND_API_KEY secret not set." }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setUTCHours(0, 0, 0, 0);
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setUTCDate(todayStart.getUTCDate() - 1);

    const { data: logs } = await supabase
      .from("agent_logs")
      .select("agent_name, status, output_summary, run_at")
      .gte("run_at", yesterdayStart.toISOString())
      .lt("run_at", todayStart.toISOString())
      .order("run_at", { ascending: true });

    const { data: revenue } = await supabase.from("revenue").select("type, amount_ngn, status, entry_date");
    const { data: projects } = await supabase.from("projects").select("project_name, status");

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
    const inMonth = (d: string) => d >= monthStart && d <= monthEnd;

    const mrr = (revenue ?? [])
      .filter((r) => ["Retainer", "Maintenance"].includes(r.type) && r.status === "Paid" && inMonth(r.entry_date))
      .reduce((sum, r) => sum + Number(r.amount_ngn), 0);
    const outstanding = (revenue ?? [])
      .filter((r) => ["Invoiced", "Overdue"].includes(r.status))
      .reduce((sum, r) => sum + Number(r.amount_ngn), 0);
    const overdueCount = (revenue ?? []).filter((r) => r.status === "Overdue").length;

    const projectStatusCounts: Record<string, number> = {};
    for (const p of projects ?? []) {
      projectStatusCounts[p.status] = (projectStatusCounts[p.status] ?? 0) + 1;
    }

    const failedLogs = (logs ?? []).filter((l) => l.status === "failed");

    // --- Rules-based priority flags, in order of urgency ---
    const priorities: string[] = [];
    if (failedLogs.length > 0) {
      priorities.push(
        `Check ${failedLogs.length} failed agent run(s) from the last 24hrs: ${failedLogs.map((l) => l.agent_name).join(", ")}.`,
      );
    }
    if (overdueCount > 0) {
      priorities.push(`${overdueCount} invoice(s) marked Overdue, totaling ${fmtNgn(outstanding)} — worth a follow-up.`);
    }
    const deliveredCount = projectStatusCounts["Delivered"] ?? 0;
    if (deliveredCount > 0) {
      priorities.push(
        `${deliveredCount} project(s) sitting at Delivered — the Retainer Agent should catch these within 48hrs; worth a spot-check.`,
      );
    }
    if (priorities.length === 0) {
      priorities.push("No flagged items in the last 24hrs — clear runway for deep work or pipeline building.");
    }

    const projectLines = Object.keys(projectStatusCounts).length
      ? Object.entries(projectStatusCounts).map(([status, count]) => `${status}: ${count}`).join("<br>")
      : "No active projects tracked yet.";

    const decisionLine = overdueCount > 0
      ? `<p style="font-family:Georgia,'Times New Roman',serif;font-size:15px;line-height:24px;color:#0A0A0A;margin:0 0 20px 0;">Decide whether to send a formal payment reminder for the ${overdueCount} overdue invoice(s), or wait one more cycle.</p>`
      : "";

    const briefHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body style="margin:0;padding:0;background-color:#EDEDED;"><table width="100%" cellpadding="0" cellspacing="0" style="background-color:#EDEDED;"><tr><td align="center" style="padding:32px 16px;"><table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#DADADA;">
<tr><td bgcolor="#38393C" style="background-color:#38393C;padding:24px 32px;"><span style="font-family:Arial,Helvetica,sans-serif;font-size:18px;font-weight:bold;color:#FFFFFF;">MOCREATIVE CONCEPT</span><br><span style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#B0B0B0;">Daily Brief — ${todayStart.toISOString().slice(0, 10)}</span></td></tr>
<tr><td style="padding:32px;">
<p style="font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:bold;color:#00A5F7;text-transform:uppercase;margin:0 0 8px 0;">Top priorities</p>
<p style="font-family:Georgia,'Times New Roman',serif;font-size:15px;line-height:24px;color:#0A0A0A;margin:0 0 20px 0;">${priorities.map((p) => `• ${p}`).join("<br>")}</p>
<p style="font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:bold;color:#00A5F7;text-transform:uppercase;margin:0 0 8px 0;">Project status</p>
<p style="font-family:Georgia,'Times New Roman',serif;font-size:15px;line-height:24px;color:#0A0A0A;margin:0 0 20px 0;">${projectLines}</p>
<p style="font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:bold;color:#00A5F7;text-transform:uppercase;margin:0 0 8px 0;">Revenue snapshot</p>
<p style="font-family:Georgia,'Times New Roman',serif;font-size:15px;line-height:24px;color:#0A0A0A;margin:0 0 20px 0;">MRR this month: ${fmtNgn(mrr)}<br>Outstanding: ${fmtNgn(outstanding)}</p>
${decisionLine}
</td></tr>
</table></td></tr></table></body></html>`;

    const sendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendApiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "MoCreative CEO Agent <hello@email.mocreativeconcept.com>",
        // the brand inbox forwards to the founder (Cloudflare Email Routing)
        to: ["hello@mocreativeconcept.com"],
        subject: `Daily Brief — ${todayStart.toISOString().slice(0, 10)}`,
        html: briefHtml,
      }),
    });

    const sendJson = await sendRes.json();

    await supabase.from("agent_logs").insert({
      agent_name: "01 — CEO Agent",
      layer: "Layer 0 — Command",
      triggered_by: "scheduled-daily-7am-lagos",
      status: sendRes.ok ? "success" : "failed",
      output_summary: sendRes.ok ? `Daily brief sent (rules-based, no LLM). Resend id: ${sendJson.id}` : "Send failed",
      error_detail: sendRes.ok ? null : JSON.stringify(sendJson),
    });

    return new Response(
      JSON.stringify({ priorities, mrr, outstanding, projectStatusCounts, sent: sendRes.ok, resend_id: sendJson.id ?? null }, null, 2),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

// --- Future upgrade path (not active) ---
// Once there's budget for it, a Claude synthesis step can slot in right
// before briefHtml is built: pass the same computed data (priorities,
// projectStatusCounts, mrr, outstanding) to api.anthropic.com/v1/messages
// and let Claude write a more natural narrative version instead of the
// plain bullet format above. The data pipeline doesn't need to change,
// only the formatting step.
