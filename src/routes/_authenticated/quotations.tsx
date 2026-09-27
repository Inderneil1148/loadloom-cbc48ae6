import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowRightLeft } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { RecordManager, StatusBadge, fmtDate, opts } from "@/components/app/RecordManager";
import { PlanGate, AppPage } from "@/components/app/PlanGate";
import { Button } from "@/components/ui/button";
import { usePlan } from "@/hooks/use-plan";
import { formatINR } from "@/lib/plans";

export const Route = createFileRoute("/_authenticated/quotations")({
  head: () => ({ meta: [
    { title: "Quotations — LoadLoom" }, { name: "description", content: "Create quotes and convert them into orders." },
    { property: "og:title", content: "Quotations — LoadLoom" }, { property: "og:description", content: "Create quotes and convert them into orders." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" },
  ] }),
  component: QuotationsPage,
});

const code = (p: string) => `${p}-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(1000 + Math.random() * 9000)}`;
const n = (v: unknown) => Number(v ?? 0) || 0;

function QuotationsPage() {
  const { can, loading } = usePlan();
  const qc = useQueryClient();
  if (loading || !can("quotations"))
    return <AppPage eyebrow="Commercial" title="Quotations" feature="quotations"><div /></AppPage>;

  async function convert(q: Record<string, unknown>) {
    const sub = n(q["quantity"]) * n(q["rate"]);
    const { data: order, error } = await supabase.from("orders").insert({
      order_no: code("ORD"), customer_name: String(q["customer_name"]), site: (q["site"] as string) ?? null,
      material: String(q["material"]), quantity: n(q["quantity"]), unit: String(q["unit"] ?? "tonnes"), rate: n(q["rate"]),
      haulage_freight: n(q["haulage_freight"]), gst_percent: n(q["gst_percent"]), amount: n(q["amount"]) || sub, status: "confirmed",
    }).select().single();
    if (error) { toast.error(error.message); return; }
    await supabase.from("quotations").update({ status: "converted", order_id: order.id }).eq("id", String(q["id"]));
    toast.success(`Converted to order ${order.order_no}`);
    qc.invalidateQueries({ queryKey: ["records"] });
    qc.invalidateQueries({ queryKey: ["dashboard"] });
  }

  return (
    <PlanGate feature="quotations">
      <RecordManager table="quotations" title="Quotations" singular="Quotation" orderBy={{ column: "created_at" }}
        fields={[
          { name: "quote_no", label: "Quote no.", type: "text", required: true, default: () => code("QT") },
          { name: "customer_name", label: "Customer", type: "ref", required: true, ref: { table: "customers", label: "name", value: "name" } },
          { name: "site", label: "Site", type: "ref", ref: { table: "delivery_sites", label: "name", value: "name" } },
          { name: "material", label: "Material", type: "ref", required: true, ref: { table: "materials", label: "name", value: "name" } },
          { name: "quantity", label: "Quantity", type: "number", required: true },
          { name: "unit", label: "Unit", type: "select", options: opts("tonnes", "brass", "cft", "bags", "nos", "trips") },
          { name: "rate", label: "Rate (₹)", type: "number" },
          { name: "haulage_freight", label: "Haulage freight (₹)", type: "number" },
          { name: "gst_percent", label: "GST %", type: "select", options: [{ value: "0", label: "0% Exempt" }, { value: "5", label: "5%" }, { value: "12", label: "12%" }, { value: "18", label: "18%" }, { value: "28", label: "28%" }] },
          { name: "valid_until", label: "Valid until", type: "date" },
          { name: "status", label: "Status", type: "select", options: opts("draft", "sent", "accepted", "rejected", "converted") },
        ]}
        preparePayload={(p) => {
          const sub = n(p.quantity) * n(p.rate);
          return { ...p, amount: Math.round(sub + n(p.haulage_freight) + (sub + n(p.haulage_freight)) * n(p.gst_percent) / 100) };
        }}
        actions={(r) => r.status !== "converted" && r.status !== "rejected"
          ? <Button variant="outline" size="sm" onClick={() => convert(r)}><ArrowRightLeft /> Convert to Order</Button> : null}
        columns={[
          { label: "Quote", render: (r) => <span className="font-semibold">{r.quote_no}</span> },
          { label: "Customer", render: (r) => r.customer_name },
          { label: "Material", render: (r) => `${r.material} · ${r.quantity} ${r.unit}` },
          { label: "Amount", render: (r) => formatINR(n(r.amount)) },
          { label: "Valid until", render: (r) => fmtDate(r.valid_until) },
          { label: "Status", render: (r) => <StatusBadge value={r.status} /> },
        ]}
        mobileTitle={(r) => `${r.quote_no} · ${r.customer_name}`}
        mobileMeta={(r) => <span className="flex flex-wrap items-center gap-2">{formatINR(n(r.amount))} <StatusBadge value={r.status} /></span>}
      />
    </PlanGate>
  );
}
