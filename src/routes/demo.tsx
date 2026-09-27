import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { PlayCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { startDemo } from "@/lib/demo.functions";
import { Button } from "@/components/ui/button";
import { SiteShell, PageHeader } from "@/components/site/SiteShell";
import { WORKFLOW } from "@/lib/plans";

export const Route = createFileRoute("/demo")({
  head: () => ({
    meta: [
      { title: "Demo — See LoadLoom running a dispatch day" },
      {
        name: "description",
        content:
          "Walk through a LoadLoom operating day: order entry, truck assignment, delivery proof, invoice and payment.",
      },
      { property: "og:title", content: "Demo — See LoadLoom running a dispatch day" },
      {
        property: "og:description",
        content: "A guided look at how a supplier moves a load from order to payment in LoadLoom.",
      },
    ],
  }),
  component: Demo,
});

const WALKTHROUGH = [
  {
    step: "Morning",
    title: "Take the order",
    body: "Patil Builders wants 10 loads of M-Sand at the Kothrud site tomorrow. Rate, transport and advance go in once; the total is calculated.",
  },
  {
    step: "Loading",
    title: "Assign truck and driver",
    body: "From the dispatch board, the order gets a vehicle and a driver. The trip appears on the driver's phone under Today's Trips.",
  },
  {
    step: "On road",
    title: "Track the load",
    body: "Loading, dispatched, on road, arrived — each step is a controlled transition, recorded with who did it and when.",
  },
  {
    step: "Site",
    title: "Capture proof",
    body: "Delivery photo, customer signature, received quantity, OTP and the weighbridge slip attach to the trip.",
  },
  {
    step: "Evening",
    title: "Invoice and collect",
    body: "The invoice is built from delivered loads. Payment is recorded as cash, UPI, bank transfer or cheque, and the balance updates itself.",
  },
];

function Demo() {
  return (
    <SiteShell>
      <PageHeader
        eyebrow="Demo"
        title="A day in the yard, on LoadLoom"
        lead="Create an account to walk this through with your own materials, rates and vehicles."
      />
      <section className="mx-auto w-full max-w-4xl px-5 py-16">
        <ol className="space-y-8">
          {WALKTHROUGH.map((item, i) => (
            <li key={item.title} className="flex gap-5">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-sm bg-navy font-display text-sm font-bold text-navy-foreground">
                {i + 1}
              </span>
              <div>
                <p className="eyebrow text-accent">{item.step}</p>
                <h2 className="mt-1 text-lg font-bold">{item.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-14 rounded-md border border-border bg-card p-6 shadow-panel">
          <p className="eyebrow text-muted-foreground">Status path</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {WORKFLOW.map((step) => (
              <span
                key={step}
                className="rounded-sm border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground"
              >
                {step}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Button asChild variant="action" size="lg">
            <Link to="/auth" search={{ mode: "signup" }}>
              Create your account
            </Link>
          </Button>
          <ViewDemoButton />
          <Button asChild variant="outline" size="lg">
            <Link to="/contact">Request a guided walkthrough</Link>
          </Button>
        </div>
      </section>
    </SiteShell>
  );
}

function ViewDemoButton() {
  const navigate = useNavigate();
  const start = useServerFn(startDemo);
  const [busy, setBusy] = useState(false);
  async function go() {
    setBusy(true);
    try {
      const { token } = await start();
      await supabase.auth.signOut();
      const { error } = await supabase.auth.verifyOtp({ token_hash: token, type: "magiclink" });
      if (error) throw error;
      navigate({ to: "/dashboard" });
    } catch {
      toast.error("The demo couldn't open right now. Please try again.");
      setBusy(false);
    }
  }
  return (
    <Button variant="secondary" size="lg" className="bg-navy text-navy-foreground hover:bg-navy/90" onClick={go} disabled={busy}>
      <PlayCircle /> {busy ? "Opening demo…" : "View demo"}
    </Button>
  );
}
