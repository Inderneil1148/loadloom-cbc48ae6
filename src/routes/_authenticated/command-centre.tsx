import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, Clock } from "lucide-react";
import { AppPage, StatCard } from "@/components/app/PlanGate";
import { StatusBadge, fmtDate } from "@/components/app/RecordManager";
import { Skeleton } from "@/components/ui/skeleton";
import { formatINR } from "@/lib/plans";
import { num, useOps } from "@/lib/ops-data";

export const Route = createFileRoute("/_authenticated/command-centre")({
  staticData: { sitemap: false },
  head: () => ({ meta: [
    { title: "Command Centre — LoadLoom" }, { name: "description", content: "Live priorities, delays and alerts for dispatch." },
    { property: "og:title", content: "Command Centre — LoadLoom" }, { property: "og:description", content: "Live priorities, delays and alerts." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" },
  ] }),
  component: () => <AppPage eyebrow="Fleet plan" title="Dispatch Command Centre" description="Priorities, delays and alerts right now." feature="command_centre"><Centre /></AppPage>,
});

const DELAY_HOURS = 6;

function Centre() {
  const { data, isPending } = useOps();
  if (isPending || !data) return <Skeleton className="h-64 w-full" />;
  const today = new Date().toISOString().slice(0, 10);
  const unassigned = data.orders.filter((o) => o.status === "confirmed" && !o.vehicle_id);
  const delayed = data.deliveries.filter((d) => ["dispatched", "on_road"].includes(d.status) && d.dispatched_at && Date.now() - new Date(d.dispatched_at).getTime() > DELAY_HOURS * 3600000);
  const dueToday = data.orders.filter((o) => o.delivery_date && o.delivery_date <= today && !["delivered", "invoiced", "closed", "cancelled"].includes(o.status));
  const overdue = data.invoices.filter((i) => i.status !== "paid" && i.due_date < today);
  const live = data.deliveries.filter((d) => ["loading", "dispatched", "on_road", "arrived"].includes(d.status));
  const Section = ({ title, items, empty, icon }: { title: string; items: React.ReactNode[]; empty: string; icon?: React.ReactNode }) => (
    <section className="min-w-0 overflow-hidden rounded-md border border-border bg-card p-4 shadow-panel">
      <h2 className="flex items-center gap-2 font-bold">{icon}{title} <span className="text-xs text-muted-foreground">({items.length})</span></h2>
      {items.length ? <ul className="mt-3 divide-y divide-border">{items}</ul> : <p className="py-4 text-sm text-muted-foreground">{empty}</p>}
    </section>
  );
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard label="Unassigned orders" value={unassigned.length} tone="accent" />
        <StatCard label="Live trips" value={live.length} />
        <StatCard label={`Delayed > ${DELAY_HOURS}h`} value={delayed.length} tone="bad" />
        <StatCard label="Due today / late" value={dueToday.length} tone="accent" />
        <StatCard label="Overdue invoices" value={formatINR(overdue.reduce((s, i) => s + num(i.amount), 0))} tone="bad" />
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Section title="Delay alerts" icon={<AlertTriangle className="size-4 text-destructive" />} empty="No delayed trips."
          items={delayed.map((d) => <li key={d.id} className="flex justify-between gap-2 py-2 text-sm"><span className="min-w-0 truncate">{d.orders?.order_no} · {d.vehicles?.registration ?? "No truck"}</span><span className="text-destructive">{Math.round((Date.now() - new Date(d.dispatched_at).getTime()) / 3600000)}h on road</span></li>)} />
        <Section title="Priority: due today or late" icon={<Clock className="size-4 text-accent" />} empty="Nothing due today."
          items={dueToday.map((o) => <li key={o.id} className="flex items-center justify-between gap-2 py-2 text-sm"><span className="min-w-0 truncate">{o.order_no} · {o.customer_name}</span><span className="flex shrink-0 items-center gap-2">{fmtDate(o.delivery_date)} <StatusBadge value={o.status} /></span></li>)} />
        <Section title="Needs a truck" empty="All confirmed orders have trucks."
          items={unassigned.map((o) => <li key={o.id} className="flex justify-between gap-2 py-2 text-sm"><Link to="/orders" className="min-w-0 truncate font-medium hover:underline">{o.order_no} · {o.customer_name}</Link><span className="shrink-0 text-muted-foreground">{o.quantity} {o.unit} {o.material}</span></li>)} />
        <Section title="Live trips" empty="No trucks out right now."
          items={live.map((d) => <li key={d.id} className="flex items-center justify-between gap-2 py-2 text-sm"><span className="min-w-0 truncate">{d.vehicles?.registration ?? "—"} → {d.orders?.site ?? "site"}</span><StatusBadge value={d.status} /></li>)} />
      </div>
    </div>
  );
}
