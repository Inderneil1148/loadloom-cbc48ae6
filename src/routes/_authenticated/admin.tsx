import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Save, Search } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { usePlan } from "@/hooks/use-plan";
import { AppPage, StatCard } from "@/components/app/PlanGate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fmtDate } from "@/components/app/RecordManager";
import { TIER_NAMES, TIER_ORDER, type Tier } from "@/lib/plans";
import { PLAN_SETTINGS_QUERY_KEY, usePlanSettings, type PlanSetting } from "@/hooks/use-plan-settings";
import { AdminPayments } from "@/components/app/AdminPayments";

export const Route = createFileRoute("/_authenticated/admin")({
  staticData: { sitemap: false },
  head: () => ({ meta: [
    { title: "Admin — LoadLoom" }, { name: "description", content: "Private administration." },
    { property: "og:title", content: "Admin — LoadLoom" }, { property: "og:description", content: "Private administration." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex, nofollow" },
  ] }),
  component: AdminGate,
});

function AdminGate() {
  const { isAdmin, loading } = usePlan();
  if (loading) return <div className="p-8"><Skeleton className="h-40 w-full" /></div>;
  if (!isAdmin) return (
    <div className="grid min-h-screen place-items-center bg-background p-6 text-center">
      <div><h1 className="text-2xl font-extrabold">Page not found</h1><Button asChild variant="outline" className="mt-4"><Link to="/dashboard">Go to dashboard</Link></Button></div>
    </div>
  );
  return <AppPage eyebrow="Private" title="Admin — Accounts & Plans" description="Only you can see this page."><Admin /></AppPage>;
}

const sel = "h-9 rounded-md border border-input bg-background px-2 text-sm";

function Admin() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [planF, setPlanF] = useState("");
  const [statusF, setStatusF] = useState("");
  const { data, isPending, error } = useQuery({
    queryKey: ["admin-subs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("subscriptions").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
  const update = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: { plan?: string; status?: string; requested_plan?: string } }) => {
      const { error } = await supabase.from("subscriptions").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Saved"); qc.invalidateQueries({ queryKey: ["admin-subs"] }); qc.invalidateQueries({ queryKey: ["plan"] }); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Couldn't save"),
  });
  if (isPending) return <Skeleton className="h-64 w-full" />;
  if (error) return <p className="text-sm text-destructive">Couldn't load accounts.</p>;
  const rows = data.filter((r) =>
    (!planF || r.plan === planF) && (!statusF || r.status === statusF) &&
    (!q || `${r.email} ${r.business_name}`.toLowerCase().includes(q.toLowerCase())));
  const pending = data.filter((r) => r.status === "pending").length;
  return (
    <Tabs defaultValue="accounts" className="space-y-5">
      <TabsList className="grid w-full grid-cols-3 sm:w-[28rem]">
        <TabsTrigger value="accounts">Accounts</TabsTrigger>
        <TabsTrigger value="payments">Payments</TabsTrigger>
        <TabsTrigger value="plans">Plan settings</TabsTrigger>
      </TabsList>
      <TabsContent value="payments"><AdminPayments /></TabsContent>
      <TabsContent value="accounts" className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard label="Accounts" value={data.length} />
        <StatCard label="Waiting approval" value={pending} tone={pending ? "bad" : undefined} />
        {(["starter", "growth", "fleet"] as Tier[]).map((t) => <StatCard key={t} label={`${TIER_NAMES[t]} active`} value={data.filter((r) => r.plan === t && r.status === "active").length} tone="accent" />)}
      </div>
      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-0 flex-1"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" placeholder="Search email or business" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <select aria-label="Filter plan" className={sel} value={planF} onChange={(e) => setPlanF(e.target.value)}><option value="">All plans</option>{TIER_ORDER.map((t) => <option key={t} value={t}>{TIER_NAMES[t]}</option>)}</select>
        <select aria-label="Filter status" className={sel} value={statusF} onChange={(e) => setStatusF(e.target.value)}><option value="">All statuses</option><option value="active">Active</option><option value="pending">Pending</option><option value="suspended">Suspended</option></select>
      </div>
      <div className="space-y-3">
        {!rows.length && <p className="rounded-md border border-border bg-card p-8 text-center text-sm text-muted-foreground">No accounts match.</p>}
        {rows.map((r) => (
          <div key={r.id} className="rounded-md border border-border bg-card p-4 shadow-panel">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-semibold">{r.email ?? "—"}</p>
                <p className="text-xs text-muted-foreground">{r.business_name || "No business name"} · joined {fmtDate(r.created_at)}</p>
                <p className="mt-1 text-xs">Requested: <b>{TIER_NAMES[r.requested_plan as Tier]}</b></p>
              </div>
              {r.status === "pending" && (
                <Button size="sm" variant="action" onClick={() => update.mutate({ id: r.id, patch: { plan: r.requested_plan, status: "active" } })}><Check /> Approve {TIER_NAMES[r.requested_plan as Tier]}</Button>
              )}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <label className="text-xs text-muted-foreground">Plan{" "}
                <select aria-label={`Plan for ${r.email}`} className={sel} value={r.plan} onChange={(e) => update.mutate({ id: r.id, patch: { plan: e.target.value, requested_plan: e.target.value, status: "active" } })}>
                  {TIER_ORDER.map((t) => <option key={t} value={t}>{TIER_NAMES[t]}</option>)}
                </select>
              </label>
              <label className="text-xs text-muted-foreground">Status{" "}
                <select aria-label={`Status for ${r.email}`} className={sel} value={r.status} onChange={(e) => update.mutate({ id: r.id, patch: { status: e.target.value } })}>
                  <option value="active">Active</option><option value="pending">Pending</option><option value="suspended">Suspended</option>
                </select>
              </label>
            </div>
          </div>
        ))}
      </div>
      </TabsContent>
      <TabsContent value="plans">
        <PlanSettings />
      </TabsContent>
    </Tabs>
  );
}

type EditablePlan = Pick<PlanSetting, "plan" | "price" | "orders_limit" | "vehicles_limit" | "customers_limit" | "materials_limit">;

function PlanSettings() {
  const qc = useQueryClient();
  const { data, isPending, error } = usePlanSettings();
  const [drafts, setDrafts] = useState<Record<string, EditablePlan>>({});
  const save = useMutation({
    mutationFn: async (row: EditablePlan) => {
      const { error } = await supabase.from("plan_settings").update({
        price: row.price,
        orders_limit: row.orders_limit,
        vehicles_limit: row.vehicles_limit,
        customers_limit: row.customers_limit,
        materials_limit: row.materials_limit,
      }).eq("plan", row.plan);
      if (error) throw error;
    },
    onSuccess: (_, row) => {
      toast.success(`${TIER_NAMES[row.plan as Tier]} plan updated`);
      setDrafts((current) => {
        const next = { ...current };
        delete next[row.plan];
        return next;
      });
      qc.invalidateQueries({ queryKey: PLAN_SETTINGS_QUERY_KEY });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Couldn't update plan"),
  });

  if (isPending) return <Skeleton className="h-72 w-full" />;
  if (error || !data) return <p className="text-sm text-destructive">Couldn't load plan settings.</p>;

  const change = (source: PlanSetting, field: keyof EditablePlan, value: string) => {
    const current = drafts[source.plan] ?? source;
    setDrafts((all) => ({
      ...all,
      [source.plan]: { ...current, [field]: value === "" ? null : Math.max(0, Number(value)) },
    }));
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold">Pricing and usage limits</h2>
        <p className="mt-1 text-sm text-muted-foreground">Leave a limit empty for unlimited. Changes update sign-up, pricing, and account limits.</p>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        {TIER_ORDER.map((tier) => {
          const source = data.find((row) => row.plan === tier);
          if (!source) return null;
          const row = drafts[tier] ?? source;
          return (
            <div key={tier} className="rounded-md border border-border bg-card p-4 shadow-panel">
              <div className="flex items-center justify-between gap-3">
                <div><p className="font-bold">{TIER_NAMES[tier]}</p><p className="text-xs text-muted-foreground">Monthly pricing and limits</p></div>
                <Button size="sm" variant="action" disabled={!drafts[tier] || save.isPending} onClick={() => save.mutate(row)}><Save /> Save</Button>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                <PlanNumber id={`${tier}-price`} label="Price (₹ / month)" value={row.price} onChange={(v) => change(source, "price", v)} required />
                <PlanNumber id={`${tier}-orders`} label="Orders / month" value={row.orders_limit} onChange={(v) => change(source, "orders_limit", v)} />
                <PlanNumber id={`${tier}-vehicles`} label="Vehicles" value={row.vehicles_limit} onChange={(v) => change(source, "vehicles_limit", v)} />
                <PlanNumber id={`${tier}-customers`} label="Active customers" value={row.customers_limit} onChange={(v) => change(source, "customers_limit", v)} />
                <PlanNumber id={`${tier}-materials`} label="Materials" value={row.materials_limit} onChange={(v) => change(source, "materials_limit", v)} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PlanNumber({ id, label, value, onChange, required = false }: { id: string; label: string; value: number | null; onChange: (value: string) => void; required?: boolean }) {
  return <div className="space-y-1.5"><Label htmlFor={id} className="text-xs">{label}</Label><Input id={id} type="number" min="0" required={required} value={value ?? ""} placeholder={required ? "0" : "Unlimited"} onChange={(e) => onChange(e.target.value)} /></div>;
}
