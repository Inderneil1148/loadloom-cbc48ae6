import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Printer } from "lucide-react";
import { RecordManager, fmtDate, opts, today } from "@/components/app/RecordManager";
import { BillPrint, type BillData } from "@/components/app/BillPrint";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/lib/plans";

function PaymentsPage() {
  const [bill, setBill] = useState<BillData | null>(null);
  return (
    <>
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
        actions={(r) => (
          <Button
            size="icon"
            variant="ghost"
            aria-label="Print receipt"
            onClick={() =>
              setBill({
                kind: "payment",
                id: r.id,
                customer: r.customer_name,
                amount: r.amount,
                method: r.method,
                reference: r.reference,
                paidOn: r.paid_on,
                invoiceNo: r.invoices?.invoice_no ?? null,
              })
            }
          >
            <Printer className="size-4" />
          </Button>
        )}
      />
      <BillPrint bill={bill} onClose={() => setBill(null)} />
    </>
  );
}

export const Route = createFileRoute("/_authenticated/payments")({
  staticData: { sitemap: false },
  head: () => ({ meta: [{ title: "Payments — LoadLoom" }, { name: "description", content: "Add, edit, delete and print payments." }, { property: "og:title", content: "Payments — LoadLoom" }, { property: "og:description", content: "Track collections, methods and receipts." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: PaymentsPage,
});
