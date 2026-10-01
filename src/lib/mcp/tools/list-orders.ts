import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { errorResult, supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_orders",
  title: "List orders",
  description: "List the signed-in business's most recent orders, optionally filtered by status.",
  inputSchema: {
    status: z.string().optional().describe("Order status filter, e.g. confirmed, dispatched, delivered."),
    limit: z.number().int().min(1).max(100).default(20).describe("Max orders to return."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ status, limit }, ctx) => {
    const sb = supabaseForUser(ctx);
    let q = sb
      .from("orders")
      .select("order_no,customer_name,site,material,quantity,unit,amount,status,order_date,delivery_date")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (status) q = q.eq("status", status);
    const { data, error } = await q;
    if (error) return errorResult(error.message);
    const orders = (data ?? []).map((o) => ({
      order_no: o.order_no, customer_name: o.customer_name, site: o.site, material: o.material,
      quantity: Number(o.quantity), unit: o.unit, amount: Number(o.amount), status: o.status,
      order_date: o.order_date, delivery_date: o.delivery_date,
    }));
    return { content: [{ type: "text", text: JSON.stringify(orders) }], structuredContent: { orders } };
  },
});
