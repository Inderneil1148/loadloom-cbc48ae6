import type { ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Package, Truck, MapPin, FileText, Wallet, Database, ArrowRight, CircleAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AppHeader } from "@/components/app/AppHeader";
import { supabase } from "@/integrations/supabase/client";
import { formatINR } from "@/lib/plans";
import { fetchDashboard, loadSampleData, type DashboardData } from "@/lib/dashboard-data";

export const Route = createFileRoute("/_authenticated/dashboard")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "Dashboard — LoadLoom" },
      { name: "description", content: "Your LoadLoom operations dashboard." },
      { property: "og:title", content: "Dashboard — LoadLoom" },
      { property: "og:description", content: "Your LoadLoom operations dashboard." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Dashboard,
});

const TONE: Record<string, string> = {
  good: "border-success/30 bg-success/10 text-success",
  warn: "border-warning/30 bg-warning/10 text-warning",
  bad: "border-destructive/30 bg-destructive/10 text-destructive",
  info: "border-accent/30 bg-accent/10 text-accent",
  muted: "border-border bg-muted text-muted-foreground",
};
const STATUS_TONE: Record<string, keyof typeof TONE> = {
  delivered: "good", paid: "good", closed: "good", available: "good",
  on_road: "info", dispatched: "info", on_trip: "info", loading: "info", arrived: "info", assigned: "info",
  confirmed: "warn", scheduled: "warn", sent: "warn", partially_paid: "warn", invoiced: "warn", quoted: "muted",
  overdue: "bad", maintenance: "bad", cancelled: "bad",
};

const STATUS_OPTIONS: Record<StatusTable, string[]> = {
  orders: ["enquiry", "quoted", "confirmed", "assigned", "dispatched", "delivered", "invoiced", "closed", "cancelled"],
  vehicles: ["available", "on_trip", "maintenance"],
  deliveries: ["scheduled", "loading", "dispatched", "on_road", "arrived", "delivered"],
  invoices: ["draft", "sent", "partially_paid", "paid", "overdue"],
};
type StatusTable = "orders" | "vehicles" | "deliveries" | "invoices";


/** Status badge that opens a menu to change the status, saved straight to the record. */
function StatusSelect({ table, id, value }: { table: StatusTable; id: string; value: string }) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (status: string) => {
      const { error } = await (supabase.from(table) as any).update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
    onError: (e) => toast.error(e instanceof Error ? e.message : "Couldn't update status"),
  });
  const options = STATUS_OPTIONS[table].includes(value) ? STATUS_OPTIONS[table] : [value, ...STATUS_OPTIONS[table]];
  return (
    <Select value={value} onValueChange={(v) => mutation.mutate(v)} disabled={mutation.isPending}>
      <SelectTrigger
        aria-label="Change status"
        className={`h-auto w-auto gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize shadow-none focus:ring-1 ${TONE[STATUS_TONE[value] ?? "muted"]}`}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o} value={o} className="capitalize">
            {o.replace(/_/g, " ")}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—";

function Dashboard() {
  const { data, isPending, error } = useQuery({ queryKey: ["dashboard"], queryFn: fetchDashboard });

  const empty =
    data && !data.orders.length && !data.vehicles.length && !data.invoices.length && !data.payments.length;

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      <AppHeader />

      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-5 sm:py-8 lg:ml-60 lg:w-auto lg:px-7">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-md border border-border bg-card p-4 shadow-panel sm:p-5">
          <div className="min-w-0"><p className="eyebrow text-success">Live yard operations</p><h1 className="mt-1 text-2xl font-extrabold sm:text-3xl">Dispatch Command Centre</h1><p className="mt-1 text-xs text-muted-foreground">{new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p></div>
          <Button asChild variant="default" size="sm" className="shrink-0"><Link to="/dispatch"><Truck /> <span className="hidden sm:inline">Open Dispatch Board</span><span className="sm:hidden">Dispatch</span></Link></Button>
        </div>

        {error ? (
          <p className="mt-8 rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            Couldn't load your records. Refresh to try again.
          </p>
        ) : isPending ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-28" />
            ))}
          </div>
        ) : empty ? (
          <div className="mt-8 rounded-md border border-dashed border-border bg-card p-10 text-center">
            <Database className="mx-auto size-8 text-muted-foreground" />
            <h2 className="mt-4 text-xl font-bold">No records yet</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Your orders, trucks, deliveries, invoices and payments will appear here. Add your first
              order to get started.
            </p>
            <Button asChild variant="action" className="mt-6">
              <Link to="/orders" search={{ new: true }}>Add new data</Link>
            </Button>
          </div>
        ) : (
          <DashboardBody data={data!} />
        )}
      </main>
    </div>
  );
}

function DashboardBody({ data }: { data: DashboardData }) {
  const today = new Date().toISOString().slice(0, 10);
  const todayOrders = data.orders.filter((o) => o.order_date === today);
  const openOrders = data.orders.filter((o) => !["closed", "cancelled", "delivered", "invoiced"].includes(o.status));
  const activeTrips = data.deliveries.filter((d) => d.status !== "delivered");
  const deliveredToday = data.deliveries.filter((d) => d.delivered_at?.slice(0, 10) === today);
  const trucksOut = data.vehicles.filter((v) => v.status === "on_trip").length;
  const trucksFree = data.vehicles.filter((v) => v.status === "available").length;

  const paidByInvoice = new Map<string, number>();
  for (const p of data.payments)
    if (p.invoice_id) paidByInvoice.set(p.invoice_id, (paidByInvoice.get(p.invoice_id) ?? 0) + Number(p.amount));
  const balance = (i: DashboardData["invoices"][number]) =>
    i.status === "paid" ? 0 : Math.max(0, Number(i.amount) - (paidByInvoice.get(i.id) ?? 0));
  const outstanding = data.invoices.reduce((s, i) => s + balance(i), 0);
  const overdue = data.invoices.filter((i) => balance(i) > 0 && i.due_date < today);
  const collectedMonth = data.payments
    .filter((p) => p.paid_on.slice(0, 7) === today.slice(0, 7))
    .reduce((s, p) => s + Number(p.amount), 0);
  const collectedToday = data.payments
    .filter((p) => p.paid_on === today)
    .reduce((s, p) => s + Number(p.amount), 0);

  return (
    <>
      <div className="mt-5 grid grid-cols-2 gap-2 sm:mt-7 sm:grid-cols-3 sm:gap-3 xl:grid-cols-6">
        <Stat to="/orders" icon={<Package />} label="Open orders" value={openOrders.length} sub={`${todayOrders.length} placed today`} />
        <Stat to="/trucks" icon={<Truck />} label="Trucks out" value={`${trucksOut}/${data.vehicles.length}`} sub={`${trucksFree} available`} />
        <Stat to="/dispatch" icon={<MapPin />} label="Active trips" value={activeTrips.length} sub={`${deliveredToday.length} delivered today`} />
        <Stat to="/invoices" icon={<FileText />} label="Outstanding" value={formatINR(outstanding)} sub={`${overdue.length} overdue`} alert={overdue.length > 0} />
        <Stat to="/payments" icon={<Wallet />} label="Collected this month" value={formatINR(collectedMonth)} sub={`${data.payments.length} payments`} />
        <Stat to="/payments" icon={<Wallet />} label="Today revenue" value={formatINR(collectedToday)} sub="Payments recorded today" />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Link to="/orders" className="flex items-center justify-between rounded-md border border-border bg-card p-4 shadow-panel hover:border-accent"><span className="flex min-w-0 items-center gap-2 text-sm font-semibold"><CircleAlert className="size-4 shrink-0 text-warning" /> Unassigned orders <span className="tabular-nums text-muted-foreground">({data.orders.filter((o) => o.status === "confirmed").length})</span></span><ArrowRight className="size-4 shrink-0 text-muted-foreground" /></Link>
        <Link to="/dispatch" className="flex items-center justify-between rounded-md border border-border bg-card p-4 shadow-panel hover:border-accent"><span className="flex min-w-0 items-center gap-2 text-sm font-semibold"><Truck className="size-4 shrink-0 text-accent" /> Haulage in transit <span className="tabular-nums text-muted-foreground">({data.deliveries.filter((d) => ["dispatched", "on_road", "arrived"].includes(d.status)).length})</span></span><ArrowRight className="size-4 shrink-0 text-muted-foreground" /></Link>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3 [&>*]:min-w-0">
        <Panel title="Recent orders" className="lg:col-span-2">
          <div className="divide-y divide-border sm:hidden">
            {data.orders.slice(0, 8).map((o) => (
              <div key={o.id} className="px-3 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{o.order_no} · {o.customer_name}</p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">{o.site} · {o.material} · {Number(o.quantity)} {o.unit}</p>
                  </div>
                  <div className="shrink-0"><StatusSelect table="orders" id={o.id} value={o.status} /></div>
                </div>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-xs text-muted-foreground">{fmtDate(o.order_date)}</span>
                  <span className="font-semibold tabular-nums">{formatINR(Number(o.amount))}</span>
                </div>
              </div>
            ))}
            {!data.orders.length && <EmptyCard />}
          </div>
          <div className="hidden sm:block">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Order</TableHead><TableHead>Customer</TableHead><TableHead>Material</TableHead>
              <TableHead className="text-right">Amount</TableHead><TableHead>Status</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {data.orders.slice(0, 8).map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-medium">{o.order_no}<div className="text-xs text-muted-foreground">{fmtDate(o.order_date)}</div></TableCell>
                  <TableCell>{o.customer_name}<div className="text-xs text-muted-foreground">{o.site}</div></TableCell>
                  <TableCell>{o.material}<div className="text-xs text-muted-foreground">{Number(o.quantity)} {o.unit}</div></TableCell>
                  <TableCell className="text-right tabular-nums">{formatINR(Number(o.amount))}</TableCell>
                  <TableCell><StatusSelect table="orders" id={o.id} value={o.status} /></TableCell>
                </TableRow>
              ))}
              {!data.orders.length && <EmptyRow cols={5} />}
            </TableBody>
          </Table>
          </div>
        </Panel>

        <Panel title="Trucks">
          <div className="divide-y divide-border sm:hidden">
            {data.vehicles.map((v) => (
              <div key={v.id} className="flex items-center justify-between gap-3 px-3 py-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{v.registration}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{v.vehicle_type} · {Number(v.capacity_tonnes)} t</p>
                </div>
                <StatusSelect table="vehicles" id={v.id} value={v.status} />
              </div>
            ))}
            {!data.vehicles.length && <EmptyCard />}
          </div>
          <div className="hidden sm:block">
          <Table>
            <TableHeader><TableRow><TableHead>Vehicle</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
            <TableBody>
              {data.vehicles.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="font-medium">{v.registration}<div className="text-xs text-muted-foreground">{v.vehicle_type} · {Number(v.capacity_tonnes)} t</div></TableCell>
                  <TableCell><StatusSelect table="vehicles" id={v.id} value={v.status} /></TableCell>
                </TableRow>
              ))}
              {!data.vehicles.length && <EmptyRow cols={2} />}
            </TableBody>
          </Table>
          </div>
        </Panel>
      </div>

      <Panel title="Deliveries" className="mt-6">
        <div className="divide-y divide-border sm:hidden">
          {data.deliveries.slice(0, 8).map((d) => (
            <div key={d.id} className="px-3 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{d.orders?.order_no ?? "—"} · {d.orders?.customer_name}</p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">{d.orders?.site} · {d.vehicles?.registration ?? "—"} · {d.driver_name}</p>
                </div>
                <StatusSelect table="deliveries" id={d.id} value={d.status} />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Dispatched {fmtDate(d.dispatched_at)} · Delivered {fmtDate(d.delivered_at)}
              </p>
            </div>
          ))}
          {!data.deliveries.length && <EmptyCard />}
        </div>
        <div className="hidden sm:block">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Order</TableHead><TableHead>Site</TableHead><TableHead>Truck / driver</TableHead>
            <TableHead>Dispatched</TableHead><TableHead>Delivered</TableHead><TableHead>Status</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {data.deliveries.slice(0, 8).map((d) => (
              <TableRow key={d.id}>
                <TableCell className="font-medium">{d.orders?.order_no ?? "—"}<div className="text-xs text-muted-foreground">{d.orders?.material}</div></TableCell>
                <TableCell>{d.orders?.customer_name}<div className="text-xs text-muted-foreground">{d.orders?.site}</div></TableCell>
                <TableCell>{d.vehicles?.registration ?? "—"}<div className="text-xs text-muted-foreground">{d.driver_name}</div></TableCell>
                <TableCell>{fmtDate(d.dispatched_at)}</TableCell>
                <TableCell>{fmtDate(d.delivered_at)}</TableCell>
                <TableCell><StatusSelect table="deliveries" id={d.id} value={d.status} /></TableCell>
              </TableRow>
            ))}
            {!data.deliveries.length && <EmptyRow cols={6} />}
          </TableBody>
        </Table>
        </div>
      </Panel>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2 [&>*]:min-w-0">
        <Panel title="Invoices">
          <div className="divide-y divide-border sm:hidden">
            {data.invoices.slice(0, 8).map((i) => (
              <div key={i.id} className="px-3 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{i.invoice_no} · {i.customer_name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">Due {fmtDate(i.due_date)}</p>
                  </div>
                  <StatusSelect table="invoices" id={i.id} value={balance(i) > 0 && i.due_date < today ? "overdue" : i.status} />
                </div>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-xs text-muted-foreground">of {formatINR(Number(i.amount))}</span>
                  <span className="font-semibold tabular-nums">{formatINR(balance(i))}</span>
                </div>
              </div>
            ))}
            {!data.invoices.length && <EmptyCard />}
          </div>
          <div className="hidden sm:block">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Invoice</TableHead><TableHead>Due</TableHead>
              <TableHead className="text-right">Balance</TableHead><TableHead>Status</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {data.invoices.slice(0, 8).map((i) => (
                <TableRow key={i.id}>
                  <TableCell className="font-medium">{i.invoice_no}<div className="text-xs text-muted-foreground">{i.customer_name}</div></TableCell>
                  <TableCell>{fmtDate(i.due_date)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatINR(balance(i))}<div className="text-xs text-muted-foreground">of {formatINR(Number(i.amount))}</div></TableCell>
                  <TableCell><StatusSelect table="invoices" id={i.id} value={balance(i) > 0 && i.due_date < today ? "overdue" : i.status} /></TableCell>
                </TableRow>
              ))}
              {!data.invoices.length && <EmptyRow cols={4} />}
            </TableBody>
          </Table>
          </div>
        </Panel>

        <Panel title="Recent payments">
          <div className="divide-y divide-border sm:hidden">
            {data.payments.slice(0, 8).map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-3 px-3 py-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{p.customer_name}</p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">{fmtDate(p.paid_on)} · {p.method}{p.reference ? ` · ${p.reference}` : ""}</p>
                </div>
                <span className="shrink-0 font-semibold tabular-nums text-success">{formatINR(Number(p.amount))}</span>
              </div>
            ))}
            {!data.payments.length && <EmptyCard />}
          </div>
          <div className="hidden sm:block">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Customer</TableHead><TableHead>Date</TableHead><TableHead>Method</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {data.payments.slice(0, 8).map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.customer_name}<div className="text-xs text-muted-foreground">{p.reference}</div></TableCell>
                  <TableCell>{fmtDate(p.paid_on)}</TableCell>
                  <TableCell>{p.method}</TableCell>
                  <TableCell className="text-right tabular-nums text-success">{formatINR(Number(p.amount))}</TableCell>
                </TableRow>
              ))}
              {!data.payments.length && <EmptyRow cols={4} />}
            </TableBody>
          </Table>
          </div>
        </Panel>
      </div>
    </>
  );
}

type StatDestination = "/orders" | "/trucks" | "/dispatch" | "/invoices" | "/payments";

function Stat({ to, icon, label, value, sub, alert }: { to: StatDestination; icon: ReactNode; label: string; value: ReactNode; sub: string; alert?: boolean }) {
  return (
    <Link to={to} aria-label={`Open ${label}`} className="group min-w-0 rounded-md border border-border bg-card p-3 shadow-panel transition-colors hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:p-5">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-1 text-muted-foreground [&_svg]:size-4">
        <span className="eyebrow min-w-0 break-words leading-tight">{label}</span><span className="transition-colors group-hover:text-accent">{icon}</span>
      </div>
      <p className="mt-3 break-words text-xl font-extrabold tabular-nums sm:text-2xl">{value}</p>
      <p className={`mt-1 text-xs ${alert ? "font-semibold text-destructive" : "text-muted-foreground"}`}>{sub}</p>
    </Link>
  );
}

function Panel({ title, children, className = "" }: { title: string; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-md border border-border bg-card shadow-panel ${className}`}>
      <h2 className="border-b border-border px-5 py-3 text-sm font-bold">{title}</h2>
      <div className="px-2 pb-2">{children}</div>
    </section>
  );
}

function EmptyCard() {
  return <p className="px-3 py-6 text-center text-sm text-muted-foreground">Nothing here yet</p>;
}

function EmptyRow({ cols }: { cols: number }) {
  return (
    <TableRow>
      <TableCell colSpan={cols} className="py-6 text-center text-sm text-muted-foreground">Nothing here yet</TableCell>
    </TableRow>
  );
}
