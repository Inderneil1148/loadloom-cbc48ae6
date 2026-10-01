import { defineTool } from "@lovable.dev/mcp-js";
import { errorResult, supabaseForUser } from "../supabase";

export default defineTool({
  name: "business_summary",
  title: "Business summary",
  description: "Get totals for the signed-in business: orders, sales, invoiced, collected and outstanding amounts (INR).",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_args, ctx) => {
    const sb = supabaseForUser(ctx);
    const [o, i, p, v] = await Promise.all([
      sb.from("orders").select("amount,status"),
      sb.from("invoices").select("amount"),
      sb.from("payments").select("amount"),
      sb.from("vehicles").select("id", { count: "exact", head: true }),
    ]);
    const err = o.error ?? i.error ?? p.error ?? v.error;
    if (err) return errorResult(err.message);
    const sum = (rows: { amount: unknown }[] | null) => (rows ?? []).reduce((s, r) => s + Number(r.amount ?? 0), 0);
    const invoiced = sum(i.data), collected = sum(p.data);
    const summary = {
      orders: o.data?.length ?? 0,
      sales: sum(o.data),
      invoiced,
      collected,
      outstanding: invoiced - collected,
      trucks: v.count ?? 0,
    };
    return { content: [{ type: "text", text: JSON.stringify(summary) }], structuredContent: { summary } };
  },
});
