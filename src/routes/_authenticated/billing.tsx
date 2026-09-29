import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Clock, FileText, Lock, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppPage } from "@/components/app/PlanGate";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useSession } from "@/hooks/use-session";
import { usePlan } from "@/hooks/use-plan";
import { usePlanSettings } from "@/hooks/use-plan-settings";
import { FEATURE_LABEL, FEATURE_MIN, TIER_NAMES, formatINR, hasFeature, type Feature, type Tier } from "@/lib/plans";

export const Route = createFileRoute("/_authenticated/billing")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "Plan & Billing — LoadLoom" },
      { name: "description", content: "Your LoadLoom plan, payment status, usage and receipts." },
      { property: "og:title", content: "Plan & Billing — LoadLoom" },
      { property: "og:description", content: "Check your plan, payment status, usage limits and download receipts." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: BillingPage,
});

const FEATURES: Feature[] = ["csv_export", "quotations", "reports", "command_centre", "analytics", "ai_tools"];

const fmtDate = (v: string) => new Date(v).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

type PlanPayment = {
  id: string; plan: string; amount: number; reference: string | null; screenshot_path: string;
  status: string; admin_note: string | null; created_at: string; updated_at: string;
};

function UsageBar({ label, used, limit }: { label: string; used: number; limit: number | null }) {
  const pct = limit === null ? 0 : Math.min(100, Math.round((used / Math.max(limit, 1)) * 100));
  const over = limit !== null && used >= limit;
  return (
    <div className="rounded-md border border-border bg-card p-4 shadow-panel">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="shrink-0 text-xs font-semibold">{used} {limit === null ? "used" : `of ${limit}`}</p>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
        <div className={`h-full rounded-full ${over ? "bg-destructive" : "bg-accent"}`} style={{ width: limit === null ? "100%" : `${pct}%` }} />
      </div>
      <p className="mt-1.5 text-[11px] text-muted-foreground">{limit === null ? "Unlimited on your plan" : over ? "Limit reached — upgrade to add more" : `${limit - used} left`}</p>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { c: string; t: string }> = {
    approved: { c: "bg-success/10 text-success", t: "Approved" },
    pending: { c: "bg-accent/10 text-accent", t: "Checking payment" },
    rejected: { c: "bg-destructive/10 text-destructive", t: "Not verified" },
  };
  const s = map[status] ?? { c: "bg-muted text-muted-foreground", t: status };
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${s.c}`}>{s.t}</span>;
}

function BillingPage() {
  const { session } = useSession();
  const uid = session?.user.id;
  const { tier, sub, loading } = usePlan();
  const { data: settings } = usePlanSettings();
  const setting = settings?.find((s) => s.plan === tier);
  const [receipt, setReceipt] = useState<PlanPayment | null>(null);
  const [proofUrl, setProofUrl] = useState<string | null>(null);

  const usage = useQuery({
    queryKey: ["billing-usage", uid],
    enabled: !!uid,
    queryFn: async () => {
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
      const [o, v, c, m] = await Promise.all([
        supabase.from("orders").select("id", { count: "exact", head: true }).gte("created_at", monthStart),
        supabase.from("vehicles").select("id", { count: "exact", head: true }),
        supabase.from("customers").select("id", { count: "exact", head: true }),
        supabase.from("materials").select("id", { count: "exact", head: true }),
      ]);
      return { orders: o.count ?? 0, vehicles: v.count ?? 0, customers: c.count ?? 0, materials: m.count ?? 0 };
    },
  });

  const payments = useQuery({
    queryKey: ["plan-payments-history", uid],
    enabled: !!uid,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plan_payments")
        .select("id, plan, amount, reference, screenshot_path, status, admin_note, created_at, updated_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as PlanPayment[];
    },
  });

  const profile = useQuery({
    queryKey: ["business_profile"],
    queryFn: async () => {
      const { data, error } = await supabase.from("business_profiles").select("*").maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  async function openProof(p: PlanPayment) {
    const { data } = await supabase.storage.from("payment-proofs").createSignedUrl(p.screenshot_path, 300);
    setProofUrl(data?.signedUrl ?? null);
  }

  const pending = payments.data?.find((p) => p.status === "pending");

  return (
    <AppPage
      eyebrow="Your account"
      title="Plan & Billing"
      description="Your plan, payment status, usage and receipts — all in one place."
      actions={<Button asChild variant="action"><Link to="/choose-plan">Change plan</Link></Button>}
    >
      {loading ? (
        <div className="space-y-3"><Skeleton className="h-28 w-full" /><Skeleton className="h-40 w-full" /></div>
      ) : (
        <div className="space-y-6">
          {/* Current plan */}
          <section className="rounded-md border border-border bg-card p-4 shadow-panel sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="eyebrow text-accent">Current plan</p>
                <h2 className="mt-1 text-2xl font-extrabold">{TIER_NAMES[tier]}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {setting ? `${formatINR(setting.price)} per month` : "—"}
                  {sub?.status === "suspended" && " · Paused"}
                </p>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                <p className="font-semibold text-foreground">{sub?.business_name ?? session?.user.email}</p>
                <p>Member since {sub?.created_at ? fmtDate(sub.created_at) : "—"}</p>
              </div>
            </div>

            {pending && (
              <div className="mt-4 flex items-start gap-2 rounded-md bg-accent/10 p-3 text-sm text-accent">
                <Clock className="mt-0.5 size-4 shrink-0" />
                <p>We're checking your {TIER_NAMES[pending.plan as Tier]} payment. It usually starts within 24 hours.</p>
              </div>
            )}
            {!pending && sub && sub.requested_plan !== "free" && sub.requested_plan !== sub.plan && (
              <div className="mt-4 flex flex-wrap items-center gap-2 rounded-md bg-muted p-3 text-sm">
                <p className="flex-1">You picked the {TIER_NAMES[sub.requested_plan as Tier]} plan but haven't paid yet.</p>
                <Button asChild size="sm" variant="action"><Link to="/checkout/$plan" params={{ plan: sub.requested_plan }}>Complete payment</Link></Button>
              </div>
            )}
          </section>

          {/* Usage */}
          <section>
            <h2 className="font-bold">What you've used</h2>
            {usage.isPending ? (
              <Skeleton className="mt-3 h-24 w-full" />
            ) : (
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <UsageBar label="Orders this month" used={usage.data!.orders} limit={setting?.orders_limit ?? null} />
                <UsageBar label="Trucks" used={usage.data!.vehicles} limit={setting?.vehicles_limit ?? null} />
                <UsageBar label="Customers" used={usage.data!.customers} limit={setting?.customers_limit ?? null} />
                <UsageBar label="Materials" used={usage.data!.materials} limit={setting?.materials_limit ?? null} />
              </div>
            )}
          </section>

          {/* Features */}
          <section className="rounded-md border border-border bg-card p-4 shadow-panel sm:p-5">
            <h2 className="font-bold">What's included</h2>
            <ul className="mt-3 space-y-2.5">
              {FEATURES.map((f) => {
                const on = hasFeature(tier, f);
                return (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    {on ? <CheckCircle2 className="size-4 shrink-0 text-success" /> : <Lock className="size-4 shrink-0 text-muted-foreground" />}
                    <span className={on ? "" : "text-muted-foreground"}>{FEATURE_LABEL[f]}</span>
                    {!on && <span className="ml-auto shrink-0 text-[11px] font-semibold text-accent">{TIER_NAMES[FEATURE_MIN[f]]} plan</span>}
                  </li>
                );
              })}
            </ul>
          </section>

          {/* Payments */}
          <section>
            <h2 className="font-bold">Your payments</h2>
            {payments.isPending ? (
              <Skeleton className="mt-3 h-24 w-full" />
            ) : !payments.data?.length ? (
              <p className="mt-3 rounded-md border border-border bg-card p-6 text-center text-sm text-muted-foreground shadow-panel">
                No plan payments yet. You're on the {TIER_NAMES[tier]} plan.
              </p>
            ) : (
              <div className="mt-3 space-y-3">
                {payments.data.map((p) => (
                  <div key={p.id} className="rounded-md border border-border bg-card p-4 shadow-panel">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold">{TIER_NAMES[p.plan as Tier]} plan · {formatINR(Number(p.amount))}</p>
                        <p className="text-xs text-muted-foreground">Sent {fmtDate(p.created_at)}{p.reference ? ` · Ref ${p.reference}` : ""}</p>
                      </div>
                      <StatusPill status={p.status} />
                    </div>
                    {p.status === "rejected" && (
                      <div className="mt-3 flex flex-wrap items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                        <XCircle className="size-4 shrink-0" />
                        <p className="flex-1">{p.admin_note ?? "We couldn't match this payment."}</p>
                        <Button asChild size="sm" variant="outline"><Link to="/checkout/$plan" params={{ plan: p.plan }}>Try again</Link></Button>
                      </div>
                    )}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => openProof(p)}>View screenshot</Button>
                      {p.status === "approved" && (
                        <Button size="sm" variant="outline" onClick={() => setReceipt(p)}><FileText className="size-4" />Receipt</Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* Screenshot viewer */}
      <Dialog open={!!proofUrl} onOpenChange={(o) => !o && setProofUrl(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Your payment screenshot</DialogTitle></DialogHeader>
          {proofUrl && <img src={proofUrl} alt="Payment screenshot" className="max-h-[70vh] w-full rounded-md object-contain" />}
        </DialogContent>
      </Dialog>

      {/* Receipt */}
      <Dialog open={!!receipt} onOpenChange={(o) => !o && setReceipt(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Payment receipt</DialogTitle></DialogHeader>
          {receipt && (
            <div className="space-y-4 text-sm" id="ll-receipt">
              <div>
                <p className="font-display text-lg font-extrabold">LoadLoom</p>
                <p className="text-xs text-muted-foreground">Dispatch OS · The Social INK</p>
              </div>
              <div className="rounded-md border border-border p-3">
                <p className="text-xs text-muted-foreground">Billed to</p>
                <p className="font-semibold">{profile.data?.business_name ?? sub?.business_name ?? session?.user.email}</p>
                {profile.data?.gstin && <p className="text-xs">GSTIN {profile.data.gstin}</p>}
                {profile.data?.address && <p className="text-xs text-muted-foreground">{profile.data.address}{profile.data.city ? `, ${profile.data.city}` : ""}</p>}
              </div>
              <dl className="space-y-2">
                {[
                  ["Receipt no.", receipt.id.slice(0, 8).toUpperCase()],
                  ["Plan", `${TIER_NAMES[receipt.plan as Tier]} — 1 month`],
                  ["Paid on", fmtDate(receipt.updated_at)],
                  ["Payment method", "UPI"],
                  ["Reference", receipt.reference ?? "—"],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-baseline justify-between gap-3">
                    <dt className="shrink-0 text-muted-foreground">{k}</dt>
                    <dd className="whitespace-nowrap text-right font-medium">{v}</dd>
                  </div>
                ))}
                <div className="flex items-baseline justify-between gap-3 border-t border-border pt-2">
                  <dt className="font-semibold">Amount paid</dt>
                  <dd className="text-lg font-extrabold">{formatINR(Number(receipt.amount))}</dd>
                </div>
              </dl>
              <Button className="w-full" variant="action" onClick={() => window.print()}>Print / save as PDF</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppPage>
  );
}
