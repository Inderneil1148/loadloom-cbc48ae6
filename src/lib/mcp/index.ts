import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listOrders from "./tools/list-orders";
import listCustomers from "./tools/list-customers";
import businessSummary from "./tools/business-summary";

const projectRef = import.meta.env["VITE_SUPABASE_PROJECT_ID"] ?? "project-ref-unset";

export default defineMcp({
  name: "loadloom-v-1",
  title: "LoadLoom V.1",
  version: "0.1.0",
  instructions:
    "Read-only tools for a LoadLoom construction-material business. Use `business_summary` for totals, `list_orders` for recent orders and `list_customers` for customers. Amounts are in INR.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [businessSummary, listOrders, listCustomers],
});
