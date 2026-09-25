import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { refuseUnlessAgentCall } from "../_shared/agent-guard.ts";

// Agent 26 — Revenue Tracker
// Computes live MRR + revenue breakdown from the `revenue` table, and writes
// it back to Notion's "Live Revenue Snapshot" database (one stable row,
// updated in place — not a transaction log; that's MRR & Revenue Tracker).
// This closes the Phase 0 "wire Notion ↔ Resend ↔ Supabase together" gap.
// REQUIRES NOTION_API_KEY secret (internal integration token, shared with
// the Live Revenue Snapshot page/database) — not settable from this chat.

const NOTION_SNAPSHOT_PAGE_ID = "3de454c7-01c4-811a-ab21-f1b1def3b562";

Deno.serve(async (req: Request) => {
  const refused = await refuseUnlessAgentCall(req);
  if (refused) return refused;
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const notionApiKey = Deno.env.get("NOTION_API_KEY");
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);

    const { data: revenue, error } = await supabase.from("revenue").select("type, amount_ngn, status, entry_date");
    if (error) throw error;

    const inMonth = (d: string) => d >= monthStart && d <= monthEnd;
    const sumWhere = (pred: (r: any) => boolean) =>
      revenue.filter(pred).reduce((sum, r) => sum + Number(r.amount_ngn), 0);

    const mrr = sumWhere((r) => ["Retainer", "Maintenance"].includes(r.type) && r.status === "Paid" && inMonth(r.entry_date));
    const projectFeeThisMonth = sumWhere((r) => r.type === "Project Fee" && r.status === "Paid" && inMonth(r.entry_date));
    const digitalProductThisMonth = sumWhere((r) => r.type === "Digital Product" && r.status === "Paid" && inMonth(r.entry_date));
    const outstanding = sumWhere((r) => ["Invoiced", "Overdue"].includes(r.status));
    const overdueCount = revenue.filter((r) => r.status === "Overdue").length;

    const result: Record<string, unknown> = {
      generated_at: now.toISOString(),
      period: { start: monthStart, end: monthEnd },
      mrr_ngn: mrr,
      project_fee_this_month_ngn: projectFeeThisMonth,
      digital_product_this_month_ngn: digitalProductThisMonth,
      total_revenue_this_month_ngn: mrr + projectFeeThisMonth + digitalProductThisMonth,
      outstanding_ngn: outstanding,
      overdue_invoice_count: overdueCount,
    };

    // --- Notion write-back ---
    if (!notionApiKey) {
      result.notion_writeback = { skipped: true, reason: "NOTION_API_KEY secret not set" };
    } else {
      const notionRes = await fetch(`https://api.notion.com/v1/pages/${NOTION_SNAPSHOT_PAGE_ID}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${notionApiKey}`,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          properties: {
            "MRR (NGN)": { number: mrr },
            "Outstanding (NGN)": { number: outstanding },
            "Overdue Count": { number: overdueCount },
            "Last Updated": { date: { start: now.toISOString() } },
          },
        }),
      });
      const notionJson = await notionRes.json();
      result.notion_writeback = { success: notionRes.ok, status: notionRes.status, body: notionRes.ok ? undefined : notionJson };

      await supabase.from("agent_logs").insert({
        agent_name: "26 — Revenue Tracker",
        layer: "Layer 5 — Finance",
        triggered_by: "on-demand-or-scheduled",
        status: notionRes.ok ? "success" : "failed",
        output_summary: notionRes.ok
          ? `Notion snapshot updated: MRR ${fmtNgn(mrr)}, Outstanding ${fmtNgn(outstanding)}`
          : "Notion write-back failed",
        error_detail: notionRes.ok ? null : JSON.stringify(notionJson),
      });
    }

    return new Response(JSON.stringify(result, null, 2), { headers: { "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

function fmtNgn(n: number): string {
  return `₦${n.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
