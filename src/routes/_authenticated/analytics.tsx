import { createFileRoute } from "@tanstack/react-router";
import { AppPage, StatCard } from "@/components/app/PlanGate";
import { Skeleton } from "@/components/ui/skeleton";
import { formatINR } from "@/lib/plans";
import { agingBuckets, lastMonths, monthKey, monthLabel, num, sumBy, useOps } from "@/lib/ops-data";

export const Route = createFileRoute("/_authenticated/analytics")({
  staticData: { sitemap: false },
  head: () => ({ meta: [
    { title: "Analytics — LoadLoom" }, { name: "description", content: "Sales and collection trends, top customers and aging." },
    { property: "og:title", content: "Analytics — LoadLoom" }, { property: "og:description", content: "Sales and collection trends." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" },
  ] }),
  component: () => <AppPage eyebrow="Fleet plan" title="Advanced Analytics" description="Six-month trends and customer insights." feature="analytics"><Analytics /></AppPage>,
});

function Bars({ rows }: { rows: [string, number][] }) {
  const max = Math.max(1, ...rows.map((r) => r[1]));
  return <div className="mt-3 space-y-2">{rows.map(([k, v]) => (
    <div key={k} className="grid grid-cols-[4.5rem_1fr_auto] items-center gap-2 text-xs">
      <span className="text-muted-foreground">{k}</span>
      <div className="h-3 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-accent" style={{ width: `${(v / max) * 100}%` }} /></div>
      <span className="tabular-nums font-semibold">{formatINR(v)}</span>
    </div>))}</div>;
}

function Analytics() {
  const { data, isPending } = useOps();
  if (isPending || !data) return <Skeleton className="h-64 w-full" />;
  const months = lastMonths(6);
  const sales = new Map(sumBy(data.orders, (o) => monthKey(o.order_date), (o) => num(o.amount)));
  const coll = new Map(sumBy(data.payments, (p) => monthKey(p.paid_on), (p) => num(p.amount)));
  const billed = data.invoices.reduce((s, i) => s + num(i.amount), 0);
  const paid = data.payments.reduce((s, p) => s + num(p.amount), 0);
  const avg = data.orders.length ? data.orders.reduce((s, o) => s + num(o.amount), 0) / data.orders.length : 0;
  const top = sumBy(data.orders, (o) => o.customer_name, (o) => num(o.amount)).slice(0, 5);
  const topMat = sumBy(data.orders, (o) => o.material, (o) => num(o.amount)).slice(0, 5);
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Avg order value" value={formatINR(avg)} />
        <StatCard label="Collection rate" value={`${billed ? Math.round((paid / billed) * 100) : 0}%`} tone="good" />
        <StatCard label="Outstanding" value={formatINR(Math.max(0, billed - paid))} tone="bad" />
        <StatCard label="This month sales" value={formatINR(sales.get(months[5]!) ?? 0)} tone="accent" />
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-md border border-border bg-card p-4 shadow-panel"><h2 className="font-bold">Sales trend</h2><Bars rows={months.map((m) => [monthLabel(m), sales.get(m) ?? 0])} /></section>
        <section className="rounded-md border border-border bg-card p-4 shadow-panel"><h2 className="font-bold">Collection trend</h2><Bars rows={months.map((m) => [monthLabel(m), coll.get(m) ?? 0])} /></section>
        <section className="rounded-md border border-border bg-card p-4 shadow-panel"><h2 className="font-bold">Top customers</h2>{top.length ? <Bars rows={top.map(([k, v]) => [k.slice(0, 10), v])} /> : <p className="py-4 text-sm text-muted-foreground">No orders yet.</p>}</section>
        <section className="rounded-md border border-border bg-card p-4 shadow-panel"><h2 className="font-bold">Outstanding aging</h2><Bars rows={agingBuckets(data).map(([k, v]) => [k.replace(" days", "d"), v])} /></section>
        <section className="rounded-md border border-border bg-card p-4 shadow-panel lg:col-span-2"><h2 className="font-bold">Top materials</h2>{topMat.length ? <Bars rows={topMat.map(([k, v]) => [k.slice(0, 10), v])} /> : <p className="py-4 text-sm text-muted-foreground">No orders yet.</p>}</section>
      </div>
    </div>
  );
}
