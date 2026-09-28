import { createFileRoute } from "@tanstack/react-router";
import { RecordManager, StatusBadge, fmtDate, opts } from "@/components/app/RecordManager";
import { formatINR } from "@/lib/plans";

const in15 = () => new Date(Date.now() + 15 * 864e5).toISOString().slice(0, 10);

export const Route = createFileRoute("/_authenticated/invoices")({
  staticData: { sitemap: false },
  head: () => ({ meta: [{ title: "Invoices — LoadLoom" }, { name: "description", content: "Add, edit and delete invoices." }, { property: "og:title", content: "Invoices — LoadLoom" }, { property: "og:description", content: "Manage customer invoices and due dates." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <RecordManager
      table="invoices"
      title="Invoices"
      singular="Invoice"
      select="*, orders(order_no)"
      orderBy={{ column: "due_date", ascending: true }}
      fields={[
        { name: "invoice_no", label: "Invoice no.", type: "text", required: true },
        { name: "customer_name", label: "Customer", type: "text", required: true },
        { name: "order_id", label: "Order", type: "ref", ref: { table: "orders", label: "order_no" } },
        { name: "amount", label: "Amount (₹)", type: "number" },
        { name: "due_date", label: "Due date", type: "date", required: true, default: in15 },
        { name: "status", label: "Status", type: "select", options: opts("sent", "draft", "partially_paid", "paid", "overdue") },
      ]}
      columns={[
        { label: "Invoice", render: (r) => <span className="font-semibold">{r.invoice_no}</span> },
        { label: "Customer", render: (r) => r.customer_name },
        { label: "Order", render: (r) => r.orders?.order_no ?? "—" },
        { label: "Amount", render: (r) => formatINR(r.amount), className: "text-right tabular-nums" },
        { label: "Due", render: (r) => fmtDate(r.due_date) },
        { label: "Status", render: (r) => <StatusBadge value={r.status} /> },
      ]}
      mobileTitle={(r) => <span className="flex flex-wrap items-center gap-2">{r.invoice_no} <StatusBadge value={r.status} /></span>}
      mobileMeta={(r) => `${r.customer_name} · ${formatINR(r.amount)} · due ${fmtDate(r.due_date)}`}
    />
  ),
});
