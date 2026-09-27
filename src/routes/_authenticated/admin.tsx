import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Search } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { usePlan } from "@/hooks/use-plan";
import { AppPage, StatCard } from "@/components/app/PlanGate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { fmtDate } from "@/components/app/RecordManager";
import { TIER_NAMES, TIER_ORDER, type Tier } from "@/lib/plans";

export const Route = createFileRoute("/_authenticated/admin")({
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
    <div className="space-y-5">
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
    </div>
  );
}
