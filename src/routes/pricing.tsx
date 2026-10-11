import { createFileRoute, Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteShell, PageHeader } from "@/components/site/SiteShell";
import { formatINR, ALL_PLANS } from "@/lib/plans";
import { plansWithSettings, usePlanSettings } from "@/hooks/use-plan-settings";

const pricingJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "LoadLoom",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description:
    "LoadLoom helps construction-material suppliers manage orders, vehicles, dispatches, deliveries, invoices and payments from one system.",
  offers: ALL_PLANS.map((plan) => ({
    "@type": "Offer",
    name: `${plan.name} plan`,
    price: String(plan.price),
    priceCurrency: "INR",
  })),
};

export const Route = createFileRoute("/pricing")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: "Pricing — LoadLoom plans from Free to Fleet" },
      {
        name: "description",
        content:
          "Compare LoadLoom Free, Starter ₹999, Growth ₹2,499 and Fleet ₹4,999 plans for construction-material operations.",
      },
      { property: "og:title", content: "Pricing — LoadLoom plans from Free to Fleet" },
      {
        property: "og:description",
        content: "Four plans for construction-material suppliers: Free, Starter, Growth and Fleet.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    scripts: [
      { type: "application/ld+json", children: JSON.stringify(pricingJsonLd) },
    ],
  }),
  component: Pricing,
});

function Pricing() {
  const { data: settings } = usePlanSettings();
  const plans = plansWithSettings(settings);
  return (
    <SiteShell>
      <PageHeader
        eyebrow="Pricing"
        title="Pick the plan that matches your yard"
        lead="Start free, then move to Starter, Growth or Fleet as your operation expands."
      />
      <section className="mx-auto w-full max-w-6xl px-5 py-16">
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {plans.map((plan) => {
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
                  {plan.price === 0 ? "₹0" : formatINR(plan.price)}
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

                <dl className="mt-6 space-y-2.5 border-t border-border pt-6 text-sm">
                  {plan.limits.map((limit) => (
                    <div key={limit.label} className="flex items-baseline justify-between gap-3">
                      <dt className="shrink-0 text-muted-foreground">{limit.label}</dt>
                      <dd className="whitespace-nowrap text-right font-semibold">{limit.value}</dd>
                    </div>
                  ))}
                </dl>

                <Button asChild variant={featured ? "action" : "outline"} size="lg" className="mt-7">
                  <Link to="/dashboard">
                    {plan.id === "free" ? "Start Free" : `Start with ${plan.name}`}
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
