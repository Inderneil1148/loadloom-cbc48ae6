import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { SiteShell, PageHeader } from "@/components/site/SiteShell";

export const Route = createFileRoute("/features")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: "Features — LoadLoom dispatch and operations" },
      {
        name: "description",
        content:
          "Orders, dispatch board, driver app, delivery proof, weighbridge slips, quotations, invoices, payments, outstanding, reports and analytics.",
      },
      { property: "og:title", content: "Features — LoadLoom dispatch and operations" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      {
        property: "og:description",
        content:
          "Everything a construction-material supplier needs to run daily dispatch, from order entry to payment collection.",
      },
    ],
  }),
  component: Features,
});

const GROUPS = [
  {
    title: "Orders",
    items: [
      "Customer, site and material selection",
      "Quantity, unit, rate and transport charge",
      "Advance, tax, discount and automatic totals",
      "Delivery date, time and payment terms",
      "Search and filters across every field",
    ],
  },
  {
    title: "Dispatch",
    items: [
      "Dispatch board by status",
      "Vehicle and driver assignment",
      "Loading → dispatched → on road → delivered",
      "Priority orders and delay indicators (Fleet)",
      "Loading queue and dispatch capacity (Fleet)",
    ],
  },
  {
    title: "Driver experience",
    items: [
      "Driver login with Today's Trips",
      "Start trip, navigate, arrived, delivered",
      "Large touch targets for one-handed use",
      "Works on the phone the driver already has",
    ],
  },
  {
    title: "Delivery proof",
    items: [
      "Delivery photo",
      "Customer signature",
      "Received quantity and remarks",
      "Delivery OTP",
      "Weighbridge slip upload",
    ],
  },
  {
    title: "Money",
    items: [
      "Quotations with Convert to Order",
      "Printable invoices with due date and balance",
      "Cash, UPI, bank transfer, cheque payments",
      "Automatic balance updates",
      "Outstanding ledger with days overdue",
    ],
  },
  {
    title: "Masters",
    items: [
      "Customers with contacts and sites",
      "Materials with SKU, category, unit and rate",
      "Customer-specific pricing",
      "Vehicles with capacity and status",
      "Drivers with licence and assignment",
    ],
  },
  {
    title: "Reporting",
    items: [
      "Daily dispatch and delivery performance",
      "Material, customer and revenue sales reports",
      "Vehicle utilization and driver trips",
      "Outstanding and payment collection",
      "Print-ready output and CSV export",
    ],
  },
  {
    title: "Control",
    items: [
      "Roles for owner, manager, dispatch, accounts, driver",
      "Organization-level data isolation",
      "Activity timeline and status history",
      "Audit log with user and timestamp",
      "Plan-based feature entitlements",
    ],
  },
];

function Features() {
  return (
    <SiteShell>
      <PageHeader
        eyebrow="Features"
        title="Everything the yard does, in one system"
        lead="LoadLoom covers the full operating day: the enquiry, the load, the proof, the invoice and the money."
      />
      <section className="mx-auto w-full max-w-6xl px-5 py-16">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {GROUPS.map((group) => (
            <div key={group.title}>
              <h2 className="border-b border-border pb-3 text-base font-bold">{group.title}</h2>
              <ul className="mt-4 space-y-2.5">
                {group.items.map((item) => (
                  <li key={item} className="flex gap-2.5 text-sm text-muted-foreground">
                    <span className="mt-1.5 size-1.5 shrink-0 bg-accent" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-14 flex flex-wrap gap-3 border-t border-border pt-10">
          <Button asChild variant="action" size="lg">
            <Link to="/auth" search={{ mode: "signup" }}>
              Start free trial
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to="/pricing">See what each plan includes</Link>
          </Button>
        </div>
      </section>
    </SiteShell>
  );
}
