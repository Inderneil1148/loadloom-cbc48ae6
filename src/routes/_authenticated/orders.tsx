import { createFileRoute } from "@tanstack/react-router";
import { RecordManager, StatusBadge, fmtDate, opts, today } from "@/components/app/RecordManager";
import { formatINR } from "@/lib/plans";
import { OrderDispatchForm } from "@/components/app/OrderDispatchForm";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/orders")({
  head: () => ({ meta: [{ title: "Orders — LoadLoom" }, { name: "description", content: "Add, edit and delete orders." }, { property: "og:title", content: "Orders — LoadLoom" }, { property: "og:description", content: "Manage material loads and customer orders." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <RecordManager
      table="orders"
      title="Orders"
      singular="Order"
      orderBy={{ column: "order_date" }}
      fields={[
        { name: "order_no", label: "Order no.", type: "text", required: true, default: makeOrderNumber },
        { name: "customer_id", label: "Customer", type: "text", required: true },
        { name: "customer_name", label: "Customer", type: "text", required: true },
        { name: "site_id", label: "Site", type: "text", required: true },
        { name: "site", label: "Site", type: "text" },
        { name: "material", label: "Material", type: "ref", required: true, ref: { table: "materials", label: "name", value: "name" } },
        { name: "quantity", label: "Quantity", type: "number", required: true, default: () => "1" },
        { name: "unit", label: "Unit", type: "select", options: opts("tonnes", "brass", "cft", "bags", "nos", "trips") },
        { name: "rate", label: "Unit rate", type: "number", default: () => "0" },
        { name: "haulage_freight", label: "Haulage freight", type: "number", default: () => "0" },
        { name: "gst_percent", label: "GST", type: "number", default: () => "0" },
        { name: "advance_amount", label: "Advance", type: "number", default: () => "0" },
        { name: "delivery_date", label: "Delivery date", type: "date", default: today },
        { name: "target_window", label: "Target window", type: "text", default: () => "08:30" },
        { name: "vehicle_id", label: "Truck", type: "text" },
        { name: "driver_id", label: "Driver", type: "text" },
        { name: "amount", label: "Amount (₹)", type: "number" },
        { name: "status", label: "Status", type: "select", options: opts("confirmed", "assigned", "dispatched", "delivered", "invoiced", "closed", "cancelled") },
        { name: "order_date", label: "Order date", type: "date", required: true, default: today },
      ]}
      customForm={({ form, setForm }) => <OrderDispatchForm values={form} onChange={setForm} />}
      dialogTitle="Create Material Dispatch Order"
      dialogDescription="Book a bulk load, configure haulage charges, and allocate fleet"
      dialogClassName="h-[100dvh] max-h-[100dvh] w-full max-w-none overflow-y-auto rounded-none p-4 sm:h-auto sm:max-h-[94vh] sm:max-w-5xl sm:rounded-lg sm:p-6"
      submitLabel="Confirm & Authorize Dispatch"
      preparePayload={(payload, form) => {
        const quantity = safeNumber(form["quantity"]);
        const rate = safeNumber(form["rate"]);
        const freight = safeNumber(form["haulage_freight"]);
        const gst = (quantity * rate + freight) * (safeNumber(form["gst_percent"]) / 100);
        return { ...payload, amount: quantity * rate + freight + gst };
      }}
      afterSave={syncDelivery}
      columns={[
        { label: "Order", render: (r) => <span className="font-semibold">{r.order_no}</span> },
        { label: "Customer", render: (r) => r.customer_name },
        { label: "Site", render: (r) => r.site ?? "—" },
        { label: "Material", render: (r) => `${r.material} · ${r.quantity} ${r.unit}` },
        { label: "Amount", render: (r) => formatINR(r.amount), className: "text-right tabular-nums" },
        { label: "Status", render: (r) => <StatusBadge value={r.status} /> },
        { label: "Date", render: (r) => fmtDate(r.order_date) },
      ]}
      mobileTitle={(r) => <span className="flex flex-wrap items-center gap-2">{r.order_no} <StatusBadge value={r.status} /></span>}
      mobileMeta={(r) => <>{r.customer_name} · {r.material} {r.quantity} {r.unit}<br />{formatINR(r.amount)} · {fmtDate(r.order_date)}</>}
    />
  ),
});

function safeNumber(value?: string) {
  const parsed = Number(value ?? 0);
  if (!Number.isFinite(parsed) || parsed < 0) throw new Error("Amounts and quantity cannot be negative");
  return parsed;
}

function makeOrderNumber() {
  const now = new Date();
  const date = now.toISOString().slice(2, 10).replace(/-/g, "");
  return `ORD-${date}-${String(now.getTime()).slice(-4)}`;
}

async function syncDelivery(saved: Record<string, unknown>, form: Record<string, string>) {
  const orderId = String(saved["id"] ?? "");
  if (!orderId || (!form["vehicle_id"] && !form["driver_id"])) return;
  const driver = form["driver_id"]
    ? await supabase.from("drivers").select("name").eq("id", form["driver_id"]).maybeSingle()
    : { data: null, error: null };
  if (driver.error) throw driver.error;
  const existing = await supabase.from("deliveries").select("id").eq("order_id", orderId).maybeSingle();
  if (existing.error) throw existing.error;
  const assignment = {
    vehicle_id: form["vehicle_id"] || null,
    driver_name: driver.data?.name ?? null,
    status: "scheduled",
  };
  const result = existing.data
    ? await supabase.from("deliveries").update(assignment).eq("id", existing.data.id)
    : await supabase.from("deliveries").insert({ order_id: orderId, ...assignment });
  if (result.error) throw result.error;
}
