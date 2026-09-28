import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ClipboardList, PackageCheck, Truck } from "lucide-react";
import { AppHeader } from "@/components/app/AppHeader";
import { StatusBadge } from "@/components/app/RecordManager";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/driver-portal")({
  staticData: { sitemap: false },
  head: () => ({ meta: [
    { title: "Driver Portal — LoadLoom" }, { name: "description", content: "See driver assignments and active hauls." },
    { property: "og:title", content: "Driver Portal — LoadLoom" }, { property: "og:description", content: "See driver assignments and active hauls." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" },
  ] }),
  component: DriverPortal,
});

function DriverPortal() {
  const { data, isPending, error } = useQuery({
    queryKey: ["driver-portal"],
    queryFn: async () => {
      const [deliveries, vehicles] = await Promise.all([
        supabase.from("deliveries").select("id, status, driver_name, orders(order_no, customer_name, site, material), vehicles(registration)").order("created_at", { ascending: false }),
        supabase.from("vehicles").select("id, registration, status"),
      ]);
      if (deliveries.error) throw deliveries.error;
      if (vehicles.error) throw vehicles.error;
      return { deliveries: deliveries.data ?? [], vehicles: vehicles.data ?? [] };
    },
  });
  const assigned = data?.deliveries.filter((d) => d.status !== "delivered") ?? [];
  const delivered = data?.deliveries.filter((d) => d.status === "delivered") ?? [];
  const onRoad = assigned.filter((d) => ["dispatched", "on_road", "arrived"].includes(d.status));
  return <div className="min-h-screen bg-background pb-20 lg:pb-0"><AppHeader />
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-5 lg:ml-60 lg:w-auto lg:px-7">
      <div className="rounded-md bg-navy p-5 text-navy-foreground sm:p-7"><p className="eyebrow text-accent">Driver shift console</p><h1 className="mt-2 text-2xl font-extrabold">Driver Portal</h1><p className="mt-1 text-sm text-sidebar-foreground">Assigned dispatches and active hauls in one place.</p></div>
      {error && <p className="mt-5 text-sm text-destructive">Couldn't load driver assignments.</p>}
      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
        {[
          { label: "Assigned loads", value: assigned.length, icon: ClipboardList },
          { label: "Active hauls", value: onRoad.length, icon: Truck },
          { label: "Delivered", value: delivered.length, icon: PackageCheck },
          { label: "Vehicles allocated", value: data?.vehicles.filter((v) => v.status === "on_trip").length ?? 0, icon: Truck },
        ].map(({ label, value, icon: Icon }) => <div key={label} className="rounded-md border border-border bg-card p-4 shadow-panel"><div className="flex items-start justify-between gap-1 text-xs text-muted-foreground"><span>{label}</span><Icon className="size-4 shrink-0" /></div><p className="mt-3 text-2xl font-extrabold tabular-nums">{isPending ? "—" : value}</p></div>)}
      </div>
      <section className="mt-6"><div className="flex items-center justify-between gap-2"><h2 className="text-base font-bold">Assigned dispatch schedule</h2><Button asChild variant="ghost" size="sm"><Link to="/dispatch">Board <ArrowRight /></Link></Button></div>
        <div className="mt-3 divide-y divide-border rounded-md border border-border bg-card shadow-panel">
          {isPending ? <p className="p-5 text-sm text-muted-foreground">Loading assignments…</p> : assigned.length ? assigned.map((d) => <Link to="/deliveries" key={d.id} className="block p-4 hover:bg-muted/50"><div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="truncate font-semibold">{d.orders?.order_no ?? "Unlinked delivery"} · {d.orders?.customer_name ?? "No customer"}</p><p className="mt-1 text-xs text-muted-foreground">{d.orders?.site ?? "No site"} · {d.orders?.material ?? "No material"}</p><p className="mt-1 text-xs text-muted-foreground">{d.driver_name ?? "No driver"} · {d.vehicles?.registration ?? "No vehicle"}</p></div><StatusBadge value={d.status} /></div></Link>) : <p className="p-8 text-center text-sm text-muted-foreground">No dispatches assigned.</p>}
        </div>
      </section>
    </main>
  </div>;
}
