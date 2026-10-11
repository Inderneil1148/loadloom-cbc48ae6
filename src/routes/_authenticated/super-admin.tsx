import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, LogOut, Save, Search } from "lucide-react";
import { SuperAdminReports } from "@/components/app/super-admin/Reports";
import { SuperAdminAnnouncements } from "@/components/app/super-admin/Announcements";
import { SuperAdminSupport } from "@/components/app/super-admin/Support";
import { SuperAdminAudit, SuperAdminHealth } from "@/components/app/super-admin/AuditHealth";
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
import { AdminAccounts } from "@/components/app/AdminAccounts";
import { AdminPayments } from "@/components/app/AdminPayments";
import { AdminDeletionRequests } from "@/components/app/DeletionRequests";

export const Route = createFileRoute("/_authenticated/super-admin")({
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
  return (
    <Tabs defaultValue="accounts" className="space-y-5">
      <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 sm:w-[36rem]">
        <TabsTrigger value="accounts">Accounts</TabsTrigger>
        <TabsTrigger value="payments">Payments</TabsTrigger>
        <TabsTrigger value="plans">Plan settings</TabsTrigger>
        <TabsTrigger value="deletions">Deletion requests</TabsTrigger>
      </TabsList>
      <TabsContent value="deletions"><AdminDeletionRequests /></TabsContent>
      <TabsContent value="payments"><AdminPayments /></TabsContent>
      <TabsContent value="accounts"><AdminAccounts /></TabsContent>
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
