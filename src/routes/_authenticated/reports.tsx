import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Download } from "lucide-react";
import { AppPage } from "@/components/app/PlanGate";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatINR } from "@/lib/plans";
import { agingBuckets, downloadCsv, monthKey, monthLabel, num, outstandingByCustomer, sumBy, useOps, type OpsData } from "@/lib/ops-data";

export const Route = createFileRoute("/_authenticated/reports")({
  staticData: { sitemap: false },
  head: () => ({ meta: [
    { title: "Reports — LoadLoom" }, { name: "description", content: "Twelve operational and financial reports." },
    { property: "og:title", content: "Reports — LoadLoom" }, { property: "og:description", content: "Twelve operational and financial reports." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" },
  ] }),
  component: () => <AppPage eyebrow="Insights" title="Operational Reports" description="12 reports built from your live records." feature="reports"><Reports /></AppPage>,
});

type Report = { title: string; header: string[]; rows: (d: OpsData) => (string | number)[][]; money?: number[] };
const count = <T,>(rows: T[], key: (r: T) => string) => sumBy(rows, key, () => 1);

const REPORTS: Report[] = [
  { title: "Sales by month", header: ["Month", "Orders", "Sales"], money: [2], rows: (d) => {
    const c = new Map(count(d.orders, (o) => monthKey(o.order_date)));
    return sumBy(d.orders, (o) => monthKey(o.order_date), (o) => num(o.amount)).sort((a, b) => b[0].localeCompare(a[0])).map(([m, v]) => [monthLabel(m), c.get(m) ?? 0, v]);
  } },
  { title: "Sales by customer", header: ["Customer", "Sales"], money: [1], rows: (d) => sumBy(d.orders, (o) => o.customer_name, (o) => num(o.amount)) },
  { title: "Sales by material", header: ["Material", "Quantity", "Sales"], money: [2], rows: (d) => {
    const q = new Map(sumBy(d.orders, (o) => o.material, (o) => num(o.quantity)));
    return sumBy(d.orders, (o) => o.material, (o) => num(o.amount)).map(([m, v]) => [m, q.get(m) ?? 0, v]);
  } },
  { title: "Outstanding by customer", header: ["Customer", "Billed", "Paid", "Due"], money: [1, 2, 3], rows: (d) => outstandingByCustomer(d).map((r) => [r.customer, r.billed, r.paid, r.due]) },
  { title: "Invoice aging", header: ["Age", "Amount"], money: [1], rows: (d) => agingBuckets(d) },
  { title: "Payments by method", header: ["Method", "Collected"], money: [1], rows: (d) => sumBy(d.payments, (p) => p.method, (p) => num(p.amount)) },
  { title: "Truck-wise trips", header: ["Truck", "Trips", "Delivered"], rows: (d) => {
    const del = new Map(count(d.deliveries.filter((x) => x.status === "delivered"), (x) => x.vehicles?.registration ?? "Unassigned"));
    return count(d.deliveries, (x) => x.vehicles?.registration ?? "Unassigned").map(([t, v]) => [t, v, del.get(t) ?? 0]);
  } },
  { title: "Driver-wise trips", header: ["Driver", "Trips"], rows: (d) => count(d.deliveries, (x) => x.driver_name || "Unassigned") },
  { title: "Site-wise deliveries", header: ["Site", "Deliveries"], rows: (d) => count(d.deliveries, (x) => x.orders?.site || "No site") },
  { title: "Order status summary", header: ["Status", "Orders"], rows: (d) => count(d.orders, (o) => o.status) },
  { title: "Delivery status summary", header: ["Status", "Deliveries"], rows: (d) => count(d.deliveries, (x) => x.status) },
  { title: "Daily dispatch (last 14 days)", header: ["Date", "Orders", "Value"], money: [2], rows: (d) => {
    const since = new Date(Date.now() - 14 * 86400000).toISOString().slice(0, 10);
    const rows = d.orders.filter((o) => o.order_date >= since);
    const c = new Map(count(rows, (o) => o.order_date));
    return sumBy(rows, (o) => o.order_date, (o) => num(o.amount)).sort((a, b) => b[0].localeCompare(a[0])).map(([k, v]) => [k, c.get(k) ?? 0, v]);
  } },
];

function Reports() {
  const { data, isPending, error } = useOps();
  const [idx, setIdx] = useState(0);
  if (isPending) return <Skeleton className="h-64 w-full" />;
  if (error || !data) return <p className="text-sm text-destructive">Couldn't load reports. Please refresh.</p>;
  const r = REPORTS[idx]!;
  const rows = r.rows(data);
  const fmt = (v: string | number, i: number) => (r.money?.includes(i) ? formatINR(Number(v)) : String(v).replace(/_/g, " "));
  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {REPORTS.map((x, i) => (
          <button key={x.title} onClick={() => setIdx(i)} className={`shrink-0 rounded-md border px-3 py-2 text-xs font-semibold ${i === idx ? "border-accent bg-accent/10 text-accent" : "border-border bg-card text-muted-foreground"}`}>{i + 1}. {x.title}</button>
        ))}
      </div>
      <section className="overflow-hidden rounded-md border border-border bg-card shadow-panel">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="font-bold">{r.title}</h2>
          <Button variant="outline" size="sm" disabled={!rows.length} onClick={() => downloadCsv(r.title.replace(/\W+/g, "-").toLowerCase(), r.header, rows)}><Download /> CSV</Button>
        </div>
        {!rows.length ? <p className="p-8 text-center text-sm text-muted-foreground">No data yet for this report.</p> : (
          <Table>
            <TableHeader><TableRow>{r.header.map((h, i) => <TableHead key={h} className={i ? "text-right" : ""}>{h}</TableHead>)}</TableRow></TableHeader>
            <TableBody>{rows.map((row, ri) => <TableRow key={ri}>{row.map((c, i) => <TableCell key={i} className={i ? "text-right tabular-nums" : "font-medium capitalize"}>{fmt(c, i)}</TableCell>)}</TableRow>)}</TableBody>
          </Table>
        )}
      </section>
    </div>
  );
}
