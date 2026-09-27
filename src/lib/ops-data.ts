/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export async function fetchOps() {
  const [orders, invoices, payments, deliveries, vehicles, drivers, customers] = await Promise.all([
    supabase.from("orders").select("*").order("order_date", { ascending: false }),
    supabase.from("invoices").select("*"),
    supabase.from("payments").select("*"),
    supabase.from("deliveries").select("*, orders(order_no, customer_name, site, material, amount, delivery_date), vehicles(registration)"),
    supabase.from("vehicles").select("*").order("registration"),
    supabase.from("drivers").select("*").order("name"),
    supabase.from("customers").select("*").order("name"),
  ]);
  for (const r of [orders, invoices, payments, deliveries, vehicles, drivers, customers]) if (r.error) throw r.error;
  return {
    orders: (orders.data ?? []) as any[],
    invoices: (invoices.data ?? []) as any[],
    payments: (payments.data ?? []) as any[],
    deliveries: (deliveries.data ?? []) as any[],
    vehicles: (vehicles.data ?? []) as any[],
    drivers: (drivers.data ?? []) as any[],
    customers: (customers.data ?? []) as any[],
  };
}
export type OpsData = Awaited<ReturnType<typeof fetchOps>>;
export const useOps = () => useQuery({ queryKey: ["records", "ops"], queryFn: fetchOps });

export const sumBy = <T,>(rows: T[], key: (r: T) => string, val: (r: T) => number) => {
  const m = new Map<string, number>();
  for (const r of rows) m.set(key(r), (m.get(key(r)) ?? 0) + val(r));
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
};
export const num = (v: unknown) => Number(v ?? 0) || 0;
export const monthKey = (d: string) => d.slice(0, 7);
export const lastMonths = (n: number) => {
  const out: string[] = [];
  const d = new Date();
  d.setDate(1);
  for (let i = n - 1; i >= 0; i--) {
    const x = new Date(d.getFullYear(), d.getMonth() - i, 1);
    out.push(`${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}`);
  }
  return out;
};
export const monthLabel = (k: string) =>
  new Date(`${k}-01`).toLocaleDateString("en-IN", { month: "short", year: "2-digit" });

export function outstandingByCustomer(d: OpsData) {
  const billed = new Map(sumBy(d.invoices, (i) => i.customer_name, (i) => num(i.amount)));
  const paid = new Map(sumBy(d.payments, (p) => p.customer_name, (p) => num(p.amount)));
  return [...new Set([...billed.keys(), ...paid.keys()])]
    .map((c) => ({ customer: c, billed: billed.get(c) ?? 0, paid: paid.get(c) ?? 0, due: (billed.get(c) ?? 0) - (paid.get(c) ?? 0) }))
    .sort((a, b) => b.due - a.due);
}

export function agingBuckets(d: OpsData) {
  const b = { "Not due": 0, "1–15 days": 0, "16–30 days": 0, "31–60 days": 0, "60+ days": 0 };
  const now = Date.now();
  for (const i of d.invoices) {
    if (i.status === "paid") continue;
    const late = Math.floor((now - new Date(i.due_date).getTime()) / 86400000);
    const k = late <= 0 ? "Not due" : late <= 15 ? "1–15 days" : late <= 30 ? "16–30 days" : late <= 60 ? "31–60 days" : "60+ days";
    b[k] += num(i.amount);
  }
  return Object.entries(b);
}

export function downloadCsv(name: string, header: string[], rows: (string | number)[][]) {
  const csv = [header, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `${name}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
