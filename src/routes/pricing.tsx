import { createFileRoute, Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteShell, PageHeader } from "@/components/site/SiteShell";
import { PLANS, formatINR } from "@/lib/plans";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — LoadLoom plans from ₹999/month" },
      {
        name: "description",
        content:
          "Starter ₹999, Growth ₹2,499 and Fleet ₹4,999 per month. Compare users, vehicles, drivers, storage and features.",
      },
      { property: "og:title", content: "Pricing — LoadLoom plans from ₹999/month" },
      {
        property: "og:description",
        content: "Three plans for construction-material suppliers: Starter, Growth and Fleet.",
      },
    ],
  }),
  component: Pricing,
});

function Pricing() {
  return (
    <SiteShell>
      <PageHeader
        eyebrow="Pricing"
        title="Pick the plan that matches your yard"
        lead="One LoadLoom application. Your plan decides how many users, vehicles and drivers you run, and which features unlock."
      />
      <section className="mx-auto w-full max-w-6xl px-5 py-16">
        <div className="grid gap-5 lg:grid-cols-3">
          {PLANS.map((plan) => {
            const featured = plan.id === "growth";
            return (
              <div
                key={plan.id}
                className={`flex flex-col rounded-md border bg-card p-7 ${
                  featured ? "border-accent shadow-lifted" : "border-border shadow-panel"
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="eyebrow text-muted-foreground">{plan.positioning}</p>
                  {featured && (
                    <span className="eyebrow rounded-sm bg-accent px-2 py-1 text-accent-foreground">
                      Most chosen
                    </span>
                  )}
                </div>
                <h2 className="mt-2 text-2xl font-bold">{plan.name}</h2>
                <p className="mt-4 font-display text-4xl font-extrabold">
                  {formatINR(plan.price)}
                  <span className="text-base font-medium text-muted-foreground">/month</span>
                </p>
                <p className="mt-3 text-sm font-semibold">{plan.promise}</p>
                <p className="mt-1 text-sm text-muted-foreground">{plan.audience}</p>

                <ul className="mt-6 space-y-3 border-t border-border pt-6">
                  {plan.highlights.map((item) => (
                    <li key={item} className="flex gap-2.5 text-sm">
                      <Check className="mt-0.5 size-4 shrink-0 text-accent" />
                      {item}
                    </li>
                  ))}
                </ul>

                <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-border pt-6 text-sm">
                  {plan.limits.map((limit) => (
                    <div key={limit.label} className="flex justify-between gap-2">
                      <dt className="text-muted-foreground">{limit.label}</dt>
                      <dd className="font-semibold">{limit.value}</dd>
                    </div>
                  ))}
                </dl>

                <Button asChild variant={featured ? "action" : "outline"} size="lg" className="mt-7">
                  <Link to="/auth" search={{ mode: "signup" }}>
                    Start with {plan.name}
                  </Link>
                </Button>
              </div>
            );
          })}
        </div>
        <p className="mt-10 rounded-md border border-border bg-muted px-5 py-4 text-sm text-muted-foreground">
          Billing integration coming soon. Plans are set up on your organization today; card and UPI
          payment collection is added later.
        </p>
      </section>
    </SiteShell>
  );
}
