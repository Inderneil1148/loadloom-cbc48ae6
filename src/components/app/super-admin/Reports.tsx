import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { StatCard } from "@/components/app/PlanGate";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { TIER_NAMES, type Tier } from "@/lib/plans";
import { ComingSoon, CsvButton, Section, inr } from "./shared";

type Pt = { d: string; n: number };
type Report = {
  signups_daily: Pt[]; signups_weekly: Pt[]; signups_monthly: Pt[];
  total_users: number; dau: number; wau: number; mau: number;
  revenue_monthly: Pt[]; revenue_total: number;
  plans: { plan: string; n: number }[];
  suspended: number; cancellations: number;
  orders_total: number; orders_monthly: Pt[];
  usage: { email: string | null; business_name: string | null; plan: string; orders: number; trucks: number; invoices: number; quotations: number }[];
  my_last_sign_in: string | null;
};

export function useSuperAdminReport() {
  return useQuery({
    queryKey: ["super-admin-report"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("super_admin_report");
      if (error) throw error;
      return data as unknown as Report;
    },
  });
}

function Chart({ data, money }: { data: Pt[]; money?: boolean }) {
  if (!data.length) return <p className="py-8 text-center text-sm text-muted-foreground">No data yet.</p>;
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer>
        <BarChart data={data.map((p) => ({ ...p, n: Number(p.n) }))}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
          <XAxis dataKey="d" tick={{ fontSize: 11 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={money ? 60 : 30} />
          <Tooltip formatter={(v: number) => (money ? inr(v) : v)} />
          <Bar dataKey="n" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SuperAdminReports() {
  const { data, isLoading, error } = useSuperAdminReport();
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("daily");
  if (isLoading) return <Skeleton className="h-96 w-full" />;
  if (error || !data) return <p className="text-sm text-destructive">Could not load reports.</p>;
  const signups = data[`signups_${period}`];
  const usage = data.usage.map((u) => ({ business: u.business_name ?? "", email: u.email ?? "", plan: u.plan, orders: u.orders, trucks: u.trucks, invoices: u.invoices, quotations: u.quotations }));

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Businesses" value={data.total_users} />
        <StatCard label="Active today" value={data.dau} tone="good" />
        <StatCard label="Active this week" value={data.wau} />
        <StatCard label="Active this month" value={data.mau} />
        <StatCard label="Revenue (approved)" value={inr(data.revenue_total)} tone="accent" />
        <StatCard label="Orders on platform" value={data.orders_total} />
        <StatCard label="Suspended accounts" value={data.suspended} tone="bad" />
        <StatCard label="Deletion requests" value={data.cancellations} tone="bad" />
      </div>

      <Section title="Business sign-ups" actions={
        <div className="flex flex-wrap gap-1">
          {(["daily", "weekly", "monthly"] as const).map((p) => (
            <Button key={p} size="sm" variant={p === period ? "default" : "outline"} onClick={() => setPeriod(p)} className="capitalize">{p}</Button>
          ))}
          <CsvButton name={`signups-${period}`} rows={signups.map((p) => ({ period: p.d, signups: p.n }))} />
        </div>
      }>
        <Chart data={signups} />
      </Section>

      <div className="grid gap-5 lg:grid-cols-2">
        <Section title="Subscription revenue by month" actions={<CsvButton name="revenue" rows={data.revenue_monthly.map((p) => ({ month: p.d, revenue: p.n }))} />}>
          <Chart data={data.revenue_monthly} money />
        </Section>
        <Section title="Orders by month" actions={<CsvButton name="orders" rows={data.orders_monthly.map((p) => ({ month: p.d, orders: p.n }))} />}>
          <Chart data={data.orders_monthly} />
        </Section>
      </div>

      <Section title="Customers per plan" actions={<CsvButton name="plans" rows={data.plans.map((p) => ({ plan: p.plan, customers: p.n }))} />}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {data.plans.map((p) => <StatCard key={p.plan} label={TIER_NAMES[p.plan as Tier] ?? p.plan} value={p.n} />)}
        </div>
      </Section>

      <Section title="Feature usage by business" actions={<CsvButton name="feature-usage" rows={usage} />}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="text-left text-xs text-muted-foreground">
              <tr><th className="py-2 pr-3">Business</th><th className="pr-3">Plan</th><th className="pr-3 text-right">Orders</th><th className="pr-3 text-right">Trucks</th><th className="pr-3 text-right">Invoices</th><th className="text-right">Quotations</th></tr>
            </thead>
            <tbody>
              {usage.map((u, i) => (
                <tr key={i} className="border-t border-border">
                  <td className="py-2 pr-3"><div className="font-semibold">{u.business || "—"}</div><div className="text-xs text-muted-foreground">{u.email}</div></td>
                  <td className="pr-3">{TIER_NAMES[u.plan as Tier] ?? u.plan}</td>
                  <td className="pr-3 text-right">{u.orders}</td><td className="pr-3 text-right">{u.trucks}</td>
                  <td className="pr-3 text-right">{u.invoices}</td><td className="text-right">{u.quotations}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <div className="grid gap-3 sm:grid-cols-2">
        <ComingSoon title="Trial-to-paid conversion" note="LoadLoom has no free trials yet. This will appear once trials exist." />
        <ComingSoon title="API usage" note="Per-business API usage is not tracked yet." />
      </div>
    </div>
  );
}
