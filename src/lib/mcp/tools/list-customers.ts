import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { errorResult, supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_customers",
  title: "List customers",
  description: "List the signed-in business's customers, optionally searching by name.",
  inputSchema: { search: z.string().optional().describe("Part of the customer name.") },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ search }, ctx) => {
    const sb = supabaseForUser(ctx);
    let q = sb.from("customers").select("name,phone").order("name").limit(100);
    if (search) q = q.ilike("name", `%${search}%`);
    const { data, error } = await q;
    if (error) return errorResult(error.message);
    const customers = (data ?? []).map((c) => ({ name: c.name, phone: c.phone }));
    return { content: [{ type: "text", text: JSON.stringify(customers) }], structuredContent: { customers } };
  },
});
