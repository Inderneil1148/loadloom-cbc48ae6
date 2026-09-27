import { createFileRoute } from "@tanstack/react-router";
import { RecordManager, StatusBadge, fmtDate, opts, today } from "@/components/app/RecordManager";
import { formatINR } from "@/lib/plans";

export const Route = createFileRoute("/_authenticated/orders")({
  head: () => ({ meta: [{ title: "Orders — LoadLoom" }, { name: "description", content: "Add, edit and delete orders." }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <RecordManager
      table="orders"
      title="Orders"
      singular="Order"
      orderBy={{ column: "order_date" }}
      fields={[
        { name: "order_no", label: "Order no.", type: "text", required: true },
        { name: "customer_name", label: "Customer", type: "text", required: true },
        { name: "site", label: "Site", type: "text" },
        { name: "material", label: "Material", type: "text", required: true },
        { name: "quantity", label: "Quantity", type: "number" },
        { name: "unit", label: "Unit", type: "select", options: opts("tonnes", "brass", "cft", "bags", "nos", "trips") },
        { name: "amount", label: "Amount (₹)", type: "number" },
        { name: "status", label: "Status", type: "select", options: opts("enquiry", "quoted", "confirmed", "assigned", "dispatched", "delivered", "invoiced", "closed", "cancelled") },
        { name: "order_date", label: "Order date", type: "date", required: true, default: today },
      ]}
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
