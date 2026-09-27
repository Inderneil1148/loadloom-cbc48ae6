import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { usePlan } from "@/hooks/use-plan";
import { FEATURE_LABEL, FEATURE_MIN, TIER_NAMES, type Feature } from "@/lib/plans";
import { AppHeader } from "./AppHeader";

export function PlanGate({ feature, children }: { feature: Feature; children: ReactNode }) {
  const { can, loading, tier } = usePlan();
  if (loading) return <div className="space-y-3"><Skeleton className="h-24 w-full" /><Skeleton className="h-48 w-full" /></div>;
  if (can(feature)) return <>{children}</>;
  const need = TIER_NAMES[FEATURE_MIN[feature]];
  return (
    <div className="rounded-md border border-border bg-card p-8 text-center shadow-panel">
      <span className="mx-auto grid size-12 place-items-center rounded-full bg-accent/10 text-accent"><Lock className="size-5" /></span>
      <h2 className="mt-4 text-lg font-extrabold">{FEATURE_LABEL[feature]} is on the {need} plan</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        You're on the {TIER_NAMES[tier]} plan. Contact us to upgrade and this screen unlocks straight away.
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <Button asChild variant="action"><Link to="/contact">Contact us to upgrade</Link></Button>
        <Button asChild variant="outline"><Link to="/pricing">Compare plans</Link></Button>
      </div>
    </div>
  );
}

export function AppPage({ eyebrow, title, description, actions, feature, children }: {
  eyebrow: string; title: string; description?: string; actions?: ReactNode; feature?: Feature; children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      <AppHeader />
      <main className="mx-auto max-w-7xl px-4 py-6 lg:ml-60 lg:px-7">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="eyebrow text-accent">{eyebrow}</p>
            <h1 className="mt-1 text-2xl font-extrabold sm:text-3xl">{title}</h1>
            {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
          </div>
          {actions}
        </div>
        <div className="mt-5">{feature ? <PlanGate feature={feature}>{children}</PlanGate> : children}</div>
      </main>
    </div>
  );
}

export function StatCard({ label, value, tone }: { label: string; value: ReactNode; tone?: "accent" | "bad" | "good" }) {
  const c = tone === "accent" ? "text-accent" : tone === "bad" ? "text-destructive" : tone === "good" ? "text-success" : "";
  return (
    <div className="rounded-md border border-border bg-card p-4 shadow-panel">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className={`mt-1 text-xl font-extrabold ${c}`}>{value}</p>
    </div>
  );
}
