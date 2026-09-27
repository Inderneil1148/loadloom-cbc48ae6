import type { ReactNode } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LogOut, Package, Truck, MapPin, FileText, Wallet, Database } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Logo } from "@/components/site/Logo";
import { useSession } from "@/hooks/use-session";
import { formatINR } from "@/lib/plans";
import { fetchDashboard, loadSampleData, type DashboardData } from "@/lib/dashboard-data";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — LoadLoom" },
      { name: "description", content: "Your LoadLoom operations dashboard." },
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

function Status({ value }: { value: string }) {
  return (
    <Badge variant="outline" className={`capitalize ${TONE[STATUS_TONE[value] ?? "muted"]}`}>
      {value.replace(/_/g, " ")}
    </Badge>
  );
}

const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—";

function Dashboard() {
  const { session } = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data, isPending, error } = useQuery({ queryKey: ["dashboard"], queryFn: fetchDashboard });
  const sample = useMutation({
    mutationFn: loadSampleData,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Sample records added");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Couldn't add sample records"),
  });

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const empty =
    data && !data.orders.length && !data.vehicles.length && !data.invoices.length && !data.payments.length;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between gap-3 px-4 sm:h-16 sm:px-5">
          <Logo />
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <span className="hidden truncate text-sm text-muted-foreground sm:inline">{session?.user.email}</span>
            <Button variant="outline" size="sm" onClick={signOut} className="shrink-0">
              <LogOut /> <span className="hidden xs:inline sm:inline">Sign out</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-5 sm:py-8">
        <p className="eyebrow text-accent">Operations at a glance</p>
        <h1 className="mt-2 text-2xl font-extrabold sm:text-3xl">Today's yard</h1>

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
              Your orders, trucks, deliveries, invoices and payments will appear here. Load a few sample
              records to see how the dashboard looks.
            </p>
            <Button variant="action" className="mt-6" onClick={() => sample.mutate()} disabled={sample.isPending}>
              {sample.isPending ? "Adding…" : "Load sample data"}
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

  return (
    <>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Stat icon={<Package />} label="Open orders" value={openOrders.length} sub={`${todayOrders.length} placed today`} />
        <Stat icon={<Truck />} label="Trucks out" value={`${trucksOut}/${data.vehicles.length}`} sub={`${trucksFree} available`} />
        <Stat icon={<MapPin />} label="Active trips" value={activeTrips.length} sub={`${deliveredToday.length} delivered today`} />
        <Stat icon={<FileText />} label="Outstanding" value={formatINR(outstanding)} sub={`${overdue.length} overdue`} alert={overdue.length > 0} />
        <Stat icon={<Wallet />} label="Collected this month" value={formatINR(collectedMonth)} sub={`${data.payments.length} payments`} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <Panel title="Recent orders" className="lg:col-span-2">
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
                  <TableCell><Status value={o.status} /></TableCell>
                </TableRow>
              ))}
              {!data.orders.length && <EmptyRow cols={5} />}
            </TableBody>
          </Table>
        </Panel>

        <Panel title="Trucks">
          <Table>
            <TableHeader><TableRow><TableHead>Vehicle</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
            <TableBody>
              {data.vehicles.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="font-medium">{v.registration}<div className="text-xs text-muted-foreground">{v.vehicle_type} · {Number(v.capacity_tonnes)} t</div></TableCell>
                  <TableCell><Status value={v.status} /></TableCell>
                </TableRow>
              ))}
              {!data.vehicles.length && <EmptyRow cols={2} />}
            </TableBody>
          </Table>
        </Panel>
      </div>

      <Panel title="Deliveries" className="mt-6">
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
                <TableCell><Status value={d.status} /></TableCell>
              </TableRow>
            ))}
            {!data.deliveries.length && <EmptyRow cols={6} />}
          </TableBody>
        </Table>
      </Panel>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="Invoices">
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
                  <TableCell><Status value={balance(i) > 0 && i.due_date < today ? "overdue" : i.status} /></TableCell>
                </TableRow>
              ))}
              {!data.invoices.length && <EmptyRow cols={4} />}
            </TableBody>
          </Table>
        </Panel>

        <Panel title="Recent payments">
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
        </Panel>
      </div>
    </>
  );
}

function Stat({ icon, label, value, sub, alert }: { icon: ReactNode; label: string; value: ReactNode; sub: string; alert?: boolean }) {
  return (
    <div className="rounded-md border border-border bg-card p-5 shadow-panel">
      <div className="flex items-center justify-between text-muted-foreground [&_svg]:size-4">
        <span className="eyebrow">{label}</span>{icon}
      </div>
      <p className="mt-3 text-2xl font-extrabold tabular-nums">{value}</p>
      <p className={`mt-1 text-xs ${alert ? "font-semibold text-destructive" : "text-muted-foreground"}`}>{sub}</p>
    </div>
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

function EmptyRow({ cols }: { cols: number }) {
  return (
    <TableRow>
      <TableCell colSpan={cols} className="py-6 text-center text-sm text-muted-foreground">Nothing here yet</TableCell>
    </TableRow>
  );
}
