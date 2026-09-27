import { createFileRoute } from "@tanstack/react-router";
import { RecordManager, fmtDate, opts, today } from "@/components/app/RecordManager";
import { formatINR } from "@/lib/plans";

export const Route = createFileRoute("/_authenticated/payments")({
  head: () => ({ meta: [{ title: "Payments — LoadLoom" }, { name: "description", content: "Add, edit and delete payments." }, { property: "og:title", content: "Payments — LoadLoom" }, { property: "og:description", content: "Track collections, methods and receipts." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <RecordManager
      table="payments"
      title="Payments"
      singular="Payment"
      select="*, invoices(invoice_no)"
      orderBy={{ column: "paid_on" }}
      fields={[
        { name: "customer_name", label: "Customer", type: "text", required: true },
        { name: "invoice_id", label: "Invoice", type: "ref", ref: { table: "invoices", label: "invoice_no" } },
        { name: "amount", label: "Amount (₹)", type: "number", required: true },
        { name: "method", label: "Method", type: "select", options: opts("UPI", "Cash", "Bank transfer", "Cheque") },
        { name: "reference", label: "Reference / UTR", type: "text" },
        { name: "paid_on", label: "Paid on", type: "date", required: true, default: today },
      ]}
      columns={[
        { label: "Customer", render: (r) => <span className="font-semibold">{r.customer_name}</span> },
        { label: "Invoice", render: (r) => r.invoices?.invoice_no ?? "—" },
        { label: "Method", render: (r) => r.method },
        { label: "Reference", render: (r) => r.reference ?? "—" },
        { label: "Paid on", render: (r) => fmtDate(r.paid_on) },
        { label: "Amount", render: (r) => formatINR(r.amount), className: "text-right tabular-nums" },
      ]}
      mobileTitle={(r) => <>{r.customer_name} · {formatINR(r.amount)}</>}
      mobileMeta={(r) => `${r.method} · ${fmtDate(r.paid_on)}${r.invoices?.invoice_no ? ` · ${r.invoices.invoice_no}` : ""}`}
    />
  ),
});
