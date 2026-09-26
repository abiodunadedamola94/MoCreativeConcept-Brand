import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { refuseUnlessAgentCall } from "../_shared/agent-guard.ts";

// Agent 01 — CEO Agent (lite: no LLM call, zero marginal cost)
// Formats the last 24 hours of agent activity + the outreach pipeline +
// revenue + project status into a plain rules-based daily brief, sent every
// morning. No ANTHROPIC_API_KEY needed — only RESEND_API_KEY.
//
// An agent is flagged only while its latest run is a failure: a failure that a
// later successful run already fixed is not news. POST {"dry_run": true} to get
// the brief back as JSON without sending it.
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

    const dryRun = (await req.json().catch(() => ({})))?.dry_run === true;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setUTCHours(0, 0, 0, 0);
    const dayAgo = new Date(now.getTime() - 24 * 3600 * 1000);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
    const lagosToday = new Date(now.getTime() + 3600 * 1000).toISOString().slice(0, 10);

    // A week of runs, so an agent whose last run failed stays flagged until it recovers.
    const { data: logs } = await supabase
      .from("agent_logs")
      .select("agent_name, status, output_summary, run_at")
      .gte("run_at", weekAgo.toISOString())
      .order("run_at", { ascending: true });

    const { data: prospects } = await supabase
      .from("prospects")
      .select("name, status, draft_message, created_at, follow_up_due, bounced_at");

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

    // Latest run per agent; flag only agents whose latest run failed.
    const latest = new Map<string, { status: string; run_at: string }>();
    for (const l of logs ?? []) latest.set(l.agent_name, l);
    const stillFailing = [...latest.entries()].filter(([, l]) => l.status === "failed").map(([name]) => name);
    const runsToday = (logs ?? []).filter((l) => l.run_at >= dayAgo.toISOString());

    // Outreach pipeline.
    const ps = prospects ?? [];
    const newLeads = ps.filter((p) => p.created_at >= dayAgo.toISOString()).length;
    const draftsWaiting = ps.filter((p) => p.status === "New" && p.draft_message).length;
    const approvedUnsent = ps.filter((p) => p.status === "Approved").length;
    const contacted = ps.filter((p) => p.status === "Contacted").length;
    const replied = ps.filter((p) => p.status === "Replied").length;
    const followUps = ps.filter((p) => p.status === "Contacted" && !p.bounced_at && p.follow_up_due && p.follow_up_due <= lagosToday);
    const bounced = ps.filter((p) => p.bounced_at && p.status === "Contacted");

    // --- Rules-based priority flags, in order of urgency ---
    const priorities: string[] = [];
    if (replied > 0) {
      priorities.push(`${replied} prospect(s) replied: answer them first.`);
    }
    if (followUps.length > 0) {
      priorities.push(`${followUps.length} follow-up(s) due today: ${followUps.map((p) => p.name).join(", ")}.`);
    }
    if (stillFailing.length > 0) {
      priorities.push(`Still failing on their latest run: ${stillFailing.join(", ")}. Check the agent logs.`);
    }
    if (bounced.length > 0) {
      priorities.push(`${bounced.length} email(s) bounced, reach them another way: ${bounced.map((p) => p.name).join(", ")}.`);
    }
    if (approvedUnsent > 0) {
      priorities.push(`${approvedUnsent} approved message(s) not sent yet.`);
    }
    if (draftsWaiting > 0) {
      priorities.push(`${draftsWaiting} draft(s) waiting for your review.`);
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
      priorities.push("Nothing flagged — clear runway for deep work or pipeline building.");
    }

    const pipelineLine =
      `New leads (last 24hrs): ${newLeads}<br>Drafts waiting for review: ${draftsWaiting}<br>Contacted: ${contacted} · Replied: ${replied}<br>` +
      `Follow-ups due today: ${followUps.length}<br>Agent runs (last 24hrs): ${runsToday.length}, ${runsToday.filter((l) => l.status === "failed").length} failed`;

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
<p style="font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:bold;color:#00A5F7;text-transform:uppercase;margin:0 0 8px 0;">Pipeline</p>
<p style="font-family:Georgia,'Times New Roman',serif;font-size:15px;line-height:24px;color:#0A0A0A;margin:0 0 20px 0;">${pipelineLine}</p>
<p style="font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:bold;color:#00A5F7;text-transform:uppercase;margin:0 0 8px 0;">Project status</p>
<p style="font-family:Georgia,'Times New Roman',serif;font-size:15px;line-height:24px;color:#0A0A0A;margin:0 0 20px 0;">${projectLines}</p>
<p style="font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:bold;color:#00A5F7;text-transform:uppercase;margin:0 0 8px 0;">Revenue snapshot</p>
<p style="font-family:Georgia,'Times New Roman',serif;font-size:15px;line-height:24px;color:#0A0A0A;margin:0 0 20px 0;">MRR this month: ${fmtNgn(mrr)}<br>Outstanding: ${fmtNgn(outstanding)}</p>
${decisionLine}
</td></tr>
</table></td></tr></table></body></html>`;

    if (dryRun) {
      return new Response(
        JSON.stringify({ dry_run: true, priorities, pipeline: pipelineLine.split("<br>"), stillFailing, mrr, outstanding, projectStatusCounts }, null, 2),
        { headers: { "Content-Type": "application/json" } },
      );
    }

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
