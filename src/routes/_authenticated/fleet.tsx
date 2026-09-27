import { createFileRoute } from "@tanstack/react-router";
import { AppPage, StatCard } from "@/components/app/PlanGate";
import { StatusBadge } from "@/components/app/RecordManager";
import { Skeleton } from "@/components/ui/skeleton";
import { formatINR } from "@/lib/plans";
import { num, useOps } from "@/lib/ops-data";

export const Route = createFileRoute("/_authenticated/fleet")({
  head: () => ({ meta: [
    { title: "Fleet Intelligence — LoadLoom" }, { name: "description", content: "Trips, revenue and utilisation for every truck and driver." },
    { property: "og:title", content: "Fleet Intelligence — LoadLoom" }, { property: "og:description", content: "Trips, revenue and utilisation per truck." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" },
  ] }),
  component: () => <AppPage eyebrow="Insights" title="Fleet Intelligence" description="Trips, revenue and utilisation per truck (last 30 days)."><Fleet /></AppPage>,
});

function Fleet() {
  const { data, isPending } = useOps();
  if (isPending || !data) return <Skeleton className="h-64 w-full" />;
  const since = Date.now() - 30 * 86400000;
  const trucks = data.vehicles.map((v) => {
    const trips = data.deliveries.filter((d) => d.vehicle_id === v.id);
    const recent = trips.filter((d) => new Date(d.created_at).getTime() >= since);
    const days = new Set(recent.map((d) => String(d.created_at).slice(0, 10))).size;
    const revenue = trips.reduce((s, d) => s + num(d.orders?.amount), 0);
    return { v, trips: trips.length, delivered: trips.filter((d) => d.status === "delivered").length, revenue, util: Math.round((days / 30) * 100) };
  }).sort((a, b) => b.revenue - a.revenue);
  const drivers = [...new Set(data.deliveries.map((d) => d.driver_name).filter(Boolean))].map((name) => ({
    name, trips: data.deliveries.filter((d) => d.driver_name === name).length,
    active: data.deliveries.filter((d) => d.driver_name === name && d.status !== "delivered").length,
  })).sort((a, b) => b.trips - a.trips);
  const cap = data.vehicles.reduce((s, v) => s + num(v.capacity_tonnes), 0);
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Trucks" value={data.vehicles.length} />
        <StatCard label="Total capacity" value={`${cap} t`} />
        <StatCard label="On trip now" value={data.vehicles.filter((v) => v.status === "on_trip").length} tone="accent" />
        <StatCard label="In maintenance" value={data.vehicles.filter((v) => v.status === "maintenance").length} tone="bad" />
      </div>
      <section className="rounded-md border border-border bg-card p-4 shadow-panel">
        <h2 className="font-bold">Truck performance</h2>
        {!trucks.length ? <p className="py-6 text-center text-sm text-muted-foreground">Add trucks to see their performance.</p> : (
          <div className="mt-3 space-y-3">{trucks.map((t) => (
            <div key={t.v.id} className="rounded-md border border-border p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold">{t.v.registration} <span className="text-xs text-muted-foreground">· {t.v.vehicle_type} · {t.v.capacity_tonnes}t</span></p>
                <StatusBadge value={t.v.status} />
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                <p><span className="block text-muted-foreground">Trips</span><b>{t.trips}</b> ({t.delivered} delivered)</p>
                <p><span className="block text-muted-foreground">Revenue</span><b>{formatINR(t.revenue)}</b></p>
                <p><span className="block text-muted-foreground">Utilisation</span><b>{t.util}%</b></p>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full bg-accent" style={{ width: `${Math.min(100, t.util)}%` }} /></div>
            </div>
          ))}</div>
        )}
      </section>
      <section className="rounded-md border border-border bg-card p-4 shadow-panel">
        <h2 className="font-bold">Driver workload</h2>
        {!drivers.length ? <p className="py-6 text-center text-sm text-muted-foreground">No driver trips yet.</p> : (
          <ul className="mt-3 divide-y divide-border">{drivers.map((d) => <li key={d.name} className="flex justify-between py-2 text-sm"><span className="font-medium">{d.name}</span><span className="text-muted-foreground">{d.trips} trips · {d.active} active</span></li>)}</ul>
        )}
      </section>
    </div>
  );
}
