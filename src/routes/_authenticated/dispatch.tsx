import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Plus, Truck } from "lucide-react";
import { AppHeader } from "@/components/app/AppHeader";
import { StatusBadge } from "@/components/app/RecordManager";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const STAGES = [
  { status: "scheduled", label: "Truck Assigned" },
  { status: "loading", label: "Loading" },
  { status: "dispatched", label: "Dispatched" },
  { status: "on_road", label: "On Road" },
  { status: "arrived", label: "Arrived at Site" },
  { status: "delivered", label: "Delivered" },
] as const;

export const Route = createFileRoute("/_authenticated/dispatch")({
  head: () => ({ meta: [
    { title: "Dispatch Board — LoadLoom" },
    { name: "description", content: "Track assigned trucks, loading, transit and completed deliveries." },
    { property: "og:title", content: "Dispatch Board — LoadLoom" },
    { property: "og:description", content: "Track assigned trucks, loading, transit and completed deliveries." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex" },
  ] }),
  component: DispatchBoard,
});

function DispatchBoard() {
  const { data = [], isPending, error } = useQuery({
    queryKey: ["dispatch-board"],
    queryFn: async () => {
      const { data, error } = await supabase.from("deliveries").select("id, status, driver_name, orders(order_no, customer_name, site), vehicles(registration)").order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
  const active = data.filter((d) => d.status !== "delivered").length;
  return <div className="min-h-screen bg-background pb-20 lg:pb-0">
    <AppHeader />
    <main className="mx-auto max-w-7xl px-4 py-6 lg:ml-60 lg:px-7">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <div className="min-w-0"><p className="eyebrow text-success">Live fleet dispatch board</p><h1 className="mt-1 text-2xl font-extrabold">Quarry Haulage &amp; Gate Corridors</h1></div>
        <Button asChild variant="action" size="sm"><Link to="/deliveries"><Plus /> <span className="hidden sm:inline">Delivery</span></Link></Button>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">{active} active loads · {data.length - active} delivered</p>
      {error && <p className="mt-5 text-sm text-destructive">Couldn't load the dispatch board.</p>}
      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {STAGES.map(({ status, label }) => {
          const rows = data.filter((d) => d.status === status);
          return <section key={status} className="rounded-md border border-border bg-card p-3 shadow-panel">
            <div className="flex items-center justify-between border-b border-border pb-2"><h2 className="text-sm font-bold">{label}</h2><span className="text-xs font-semibold tabular-nums text-accent">{rows.length}</span></div>
            {rows.length ? <div className="divide-y divide-border">{rows.map((d) => <Link key={d.id} to="/deliveries" className="block py-3 hover:text-accent"><div className="flex items-center justify-between gap-2"><span className="truncate font-semibold">{d.orders?.order_no ?? "Unlinked delivery"}</span><StatusBadge value={d.status} /></div><p className="mt-1 text-xs text-muted-foreground">{d.orders?.customer_name ?? "No customer"} · {d.vehicles?.registration ?? "No truck"}</p><p className="text-xs text-muted-foreground">{d.driver_name ?? "No driver"} · {d.orders?.site ?? "No site"}</p></Link>)}</div> : <div className="grid h-16 place-items-center text-center text-xs text-muted-foreground sm:h-24">{isPending ? "Loading…" : <span>No loads in this stage</span>}</div>}
          </section>;
        })}
      </div>
    </main>
  </div>;
}