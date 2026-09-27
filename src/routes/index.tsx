import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ClipboardList,
  Truck,
  CheckCircle2,
  FileText,
  IndianRupee,
  ShieldCheck,
  Gauge,
  MessageSquareOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteShell } from "@/components/site/SiteShell";
import { WORKFLOW, PLANS, formatINR } from "@/lib/plans";
import heroFleet from "@/assets/hero-fleet.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LoadLoom — Every Load. Accounted For." },
      {
        name: "description",
        content:
          "Dispatch and operations software for sand, M-Sand, aggregate and brick suppliers. Orders, trucks, deliveries, invoices and payments in one place.",
      },
      { property: "og:title", content: "LoadLoom — Every Load. Accounted For." },
      {
        property: "og:description",
        content:
          "From order to delivery, without the WhatsApp chaos. Built for bulk construction-material suppliers in India.",
      },
    ],
  }),
  component: Home,
});

const PILLARS = [
  {
    icon: ClipboardList,
    title: "Orders that calculate themselves",
    body: "Customer, site, material, quantity, rate, transport, advance, tax and discount — the total is always right.",
  },
  {
    icon: Truck,
    title: "A dispatch board, not a group chat",
    body: "Assign vehicle and driver, then track loading, dispatched, on road and delivered as controlled steps.",
  },
  {
    icon: CheckCircle2,
    title: "Proof for every delivery",
    body: "Delivery photo, customer signature, received quantity, OTP and the weighbridge slip, attached to the trip.",
  },
  {
    icon: FileText,
    title: "Invoices from real deliveries",
    body: "Printable invoices built from delivered loads, with due dates, balance and status you can trust.",
  },
  {
    icon: IndianRupee,
    title: "Payments and outstanding",
    body: "Cash, UPI, bank transfer or cheque. Balances update themselves and overdue days are never a guess.",
  },
  {
    icon: Gauge,
    title: "Visibility for the owner",
    body: "Loads dispatched, revenue, pending deliveries and money owed to you — on one screen, every day.",
  },
];

function Home() {
  return (
    <SiteShell>
      <section className="relative overflow-hidden bg-navy text-navy-foreground">
        <img
          src={heroFleet}
          alt="Tipper trucks loaded with sand and aggregate at a quarry yard"
          width={1600}
          height={1008}
          className="absolute inset-0 h-full w-full object-cover opacity-25"
        />
        <div className="absolute inset-0 bg-navy/70" />
        <div className="relative mx-auto w-full max-w-6xl px-5 py-20 md:py-28">
          <p className="eyebrow text-accent">Construction Material Dispatch &amp; Operations OS</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-extrabold leading-[1.05] md:text-6xl">
            Every Load.
            <br />
            Accounted For.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-navy-foreground/75">
            From order to delivery, without the WhatsApp chaos. LoadLoom runs orders, vehicles,
            dispatches, deliveries, invoices and payments for bulk material suppliers.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild variant="action" size="xl">
              <Link to="/auth" search={{ mode: "signup" }}>
                Start free trial
              </Link>
            </Button>
            <Button asChild variant="onNavy" size="xl">
              <Link to="/demo">See the demo</Link>
            </Button>
          </div>
          <dl className="mt-14 grid max-w-3xl grid-cols-2 gap-x-6 gap-y-6 border-t border-navy-foreground/15 pt-8 sm:grid-cols-4">
            {[
              ["Sand · M-Sand", "Material ready"],
              ["Aggregate · Jelly", "Unit aware"],
              ["Bricks · Stone", "Load based"],
              ["INR · Tonne · Brass", "India first"],
            ].map(([value, label]) => (
              <div key={value}>
                <dt className="text-sm font-semibold">{value}</dt>
                <dd className="mt-1 text-xs text-navy-foreground/55">{label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="border-b border-border bg-concrete/60">
        <div className="mx-auto w-full max-w-6xl px-5 py-14">
          <div className="flex items-start gap-4">
            <MessageSquareOff className="mt-1 size-6 shrink-0 text-accent" />
            <div>
              <h2 className="text-2xl font-bold md:text-3xl">
                Loads go out. Then nobody can say what happened.
              </h2>
              <p className="mt-3 max-w-2xl text-muted-foreground">
                Orders sit in WhatsApp. Rates are in a notebook. The driver called someone about the
                slip. The invoice is made from memory, and the payment follow-up never happens.
                LoadLoom replaces that with one controlled workflow.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 py-16 md:py-20">
        <p className="eyebrow text-accent">The workflow</p>
        <h2 className="mt-3 text-2xl font-bold md:text-4xl">One path, start to closed</h2>
        <ol className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {WORKFLOW.map((step, i) => (
            <li
              key={step}
              className="flex items-center gap-3 rounded-md border border-border bg-card px-4 py-3 shadow-panel"
            >
              <span className="font-display text-xs font-bold text-accent">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="text-sm font-medium">{step}</span>
            </li>
          ))}
        </ol>
        <p className="mt-6 text-sm text-muted-foreground">
          Statuses move forward through controlled transitions — nobody types a status by hand.
        </p>
      </section>

      <section className="border-y border-border bg-card">
        <div className="mx-auto w-full max-w-6xl px-5 py-16 md:py-20">
          <p className="eyebrow text-accent">What you get</p>
          <h2 className="mt-3 text-2xl font-bold md:text-4xl">Built for dispatch, not for demos</h2>
          <div className="mt-10 grid gap-x-10 gap-y-9 md:grid-cols-2 lg:grid-cols-3">
            {PILLARS.map(({ icon: Icon, title, body }) => (
              <div key={title}>
                <Icon className="size-6 text-accent" />
                <h3 className="mt-4 text-base font-bold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 py-16 md:py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow text-accent">Plans</p>
            <h2 className="mt-3 text-2xl font-bold md:text-4xl">Three plans, one system</h2>
          </div>
          <Button asChild variant="outline">
            <Link to="/pricing">Compare plans</Link>
          </Button>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {PLANS.map((plan) => (
            <div key={plan.id} className="rounded-md border border-border bg-card p-6 shadow-panel">
              <p className="eyebrow text-muted-foreground">{plan.positioning}</p>
              <h3 className="mt-2 text-xl font-bold">{plan.name}</h3>
              <p className="mt-3 font-display text-2xl font-extrabold">
                {formatINR(plan.price)}
                <span className="text-sm font-medium text-muted-foreground">/month</span>
              </p>
              <p className="mt-3 text-sm text-muted-foreground">{plan.promise}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-border bg-navy text-navy-foreground">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 py-16 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold md:text-3xl">Put your yard on LoadLoom</h2>
            <p className="mt-2 flex items-center gap-2 text-sm text-navy-foreground/65">
              <ShieldCheck className="size-4 text-accent" />
              Your business data stays isolated to your organization.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="action" size="xl">
              <Link to="/auth" search={{ mode: "signup" }}>
                Create your account
              </Link>
            </Button>
            <Button asChild variant="onNavy" size="xl">
              <Link to="/contact">Talk to us</Link>
            </Button>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
