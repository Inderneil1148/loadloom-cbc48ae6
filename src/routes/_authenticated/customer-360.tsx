import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { MessageCircle, Phone } from "lucide-react";
import { AppPage, StatCard } from "@/components/app/PlanGate";
import { StatusBadge, fmtDate } from "@/components/app/RecordManager";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatINR } from "@/lib/plans";
import { num, useOps } from "@/lib/ops-data";

export const Route = createFileRoute("/_authenticated/customer-360")({
  staticData: { sitemap: false },
  validateSearch: (s: Record<string, unknown>): { id?: string } => (typeof s["id"] === "string" ? { id: s["id"] } : {}),
  head: () => ({ meta: [
    { title: "Customer 360 — LoadLoom" }, { name: "description", content: "Orders, invoices and payments for one customer." },
    { property: "og:title", content: "Customer 360 — LoadLoom" }, { property: "og:description", content: "Complete customer account view." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" },
  ] }),
  component: () => <AppPage eyebrow="Commercial" title="Customer 360" description="Every order, invoice and payment for one customer."><C360 /></AppPage>,
});

function C360() {
  const { id } = Route.useSearch();
  const navigate = useNavigate();
  const { data, isPending } = useOps();
  if (isPending || !data) return <Skeleton className="h-64 w-full" />;
  if (!data.customers.length) return <p className="rounded-md border border-border bg-card p-8 text-center text-sm text-muted-foreground">Add a customer first on the Customers page.</p>;
  const c = data.customers.find((x) => x.id === id) ?? data.customers[0]!;
  const match = (r: { customer_id?: string | null; customer_name?: string }) => r.customer_id === c.id || r.customer_name === c.name;
  const orders = data.orders.filter(match);
  const invoices = data.invoices.filter((i) => i.customer_name === c.name);
  const payments = data.payments.filter((p) => p.customer_name === c.name);
  const billed = invoices.reduce((s, i) => s + num(i.amount), 0);
  const paid = payments.reduce((s, p) => s + num(p.amount), 0);
  const phone = String(c.phone ?? "").replace(/\D/g, "");
  return (
    <div className="space-y-5">
      <select aria-label="Choose customer" className="h-10 w-full max-w-sm rounded-md border border-input bg-card px-3 text-sm" value={c.id}
        onChange={(e) => navigate({ to: "/customer-360", search: { id: e.target.value } })}>
        {data.customers.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
      </select>
      <div className="rounded-md border border-border bg-card p-4 shadow-panel">
        <p className="text-lg font-extrabold">{c.name}</p>
        <p className="text-sm text-muted-foreground">{[c.contact_name, c.phone, c.email, c.address].filter(Boolean).join(" · ") || "No contact details"}</p>
        {phone && <div className="mt-3 flex gap-2">
          <Button asChild variant="outline" size="sm"><a href={`tel:${phone}`}><Phone /> Call</a></Button>
          <Button asChild variant="outline" size="sm"><a href={`https://wa.me/${phone}`} target="_blank" rel="noreferrer"><MessageCircle /> WhatsApp</a></Button>
        </div>}
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Orders" value={orders.length} />
        <StatCard label="Order value" value={formatINR(orders.reduce((s, o) => s + num(o.amount), 0))} />
        <StatCard label="Paid" value={formatINR(paid)} tone="good" />
        <StatCard label="Outstanding" value={formatINR(Math.max(0, billed - paid))} tone="bad" />
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        <List title="Orders" items={orders.map((o) => ({ id: o.id, a: `${o.order_no} · ${o.material}`, b: formatINR(num(o.amount)), s: o.status, d: o.order_date }))} />
        <List title="Invoices" items={invoices.map((i) => ({ id: i.id, a: i.invoice_no, b: formatINR(num(i.amount)), s: i.status, d: i.due_date }))} />
        <List title="Payments" items={payments.map((p) => ({ id: p.id, a: `${p.method}${p.reference ? ` · ${p.reference}` : ""}`, b: formatINR(num(p.amount)), d: p.paid_on }))} />
      </div>
    </div>
  );
}

function List({ title, items }: { title: string; items: { id: string; a: string; b: string; s?: string; d: string }[] }) {
  return (
    <section className="rounded-md border border-border bg-card p-4 shadow-panel">
      <h2 className="font-bold">{title} <span className="text-xs text-muted-foreground">({items.length})</span></h2>
      {!items.length ? <p className="py-4 text-sm text-muted-foreground">None yet.</p> : (
        <ul className="mt-2 divide-y divide-border">{items.map((x) => (
          <li key={x.id} className="py-2 text-sm">
            <div className="flex justify-between gap-2"><span className="min-w-0 truncate font-medium">{x.a}</span><span className="shrink-0 font-semibold">{x.b}</span></div>
            <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">{fmtDate(x.d)}{x.s && <StatusBadge value={x.s} />}</div>
          </li>))}</ul>
      )}
    </section>
  );
}
