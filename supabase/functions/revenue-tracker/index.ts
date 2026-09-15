import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// Agent 26 — Revenue Tracker
// Computes live MRR + revenue breakdown from the `revenue` table.
// Mirrors the Notion MRR & Revenue Tracker database (source of truth for humans);
// this function is the machine-facing computation layer per the three-layer
// architecture (Notion = dashboard, Supabase = automation backend, Resend = comms).

Deno.serve(async (req: Request) => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .slice(0, 10);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      .toISOString()
      .slice(0, 10);

    const { data: revenue, error } = await supabase
      .from("revenue")
      .select("type, amount_ngn, status, entry_date");

    if (error) throw error;

    const inMonth = (d: string) => d >= monthStart && d <= monthEnd;

    const sumWhere = (pred: (r: any) => boolean) =>
      revenue.filter(pred).reduce((sum, r) => sum + Number(r.amount_ngn), 0);

    const mrr = sumWhere(
      (r) =>
        ["Retainer", "Maintenance"].includes(r.type) &&
        r.status === "Paid" &&
        inMonth(r.entry_date),
    );

    const projectFeeThisMonth = sumWhere(
      (r) => r.type === "Project Fee" && r.status === "Paid" && inMonth(r.entry_date),
    );

    const digitalProductThisMonth = sumWhere(
      (r) => r.type === "Digital Product" && r.status === "Paid" && inMonth(r.entry_date),
    );

    const outstanding = sumWhere((r) => ["Invoiced", "Overdue"].includes(r.status));

    const overdueCount = revenue.filter((r) => r.status === "Overdue").length;

    const result = {
      generated_at: now.toISOString(),
      period: { start: monthStart, end: monthEnd },
      mrr_ngn: mrr,
      project_fee_this_month_ngn: projectFeeThisMonth,
      digital_product_this_month_ngn: digitalProductThisMonth,
      total_revenue_this_month_ngn: mrr + projectFeeThisMonth + digitalProductThisMonth,
      outstanding_ngn: outstanding,
      overdue_invoice_count: overdueCount,
    };

    return new Response(JSON.stringify(result, null, 2), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
