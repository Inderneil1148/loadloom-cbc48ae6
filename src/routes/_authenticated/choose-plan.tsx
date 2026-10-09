import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Check } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import logoIcon from "@/assets/loadloom-icon.png";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/use-session";
import { usePlan } from "@/hooks/use-plan";
import { planPickedKey } from "@/hooks/use-plan-payment";
import { plansWithSettings, usePlanSettings } from "@/hooks/use-plan-settings";
import { DEMO_EMAIL } from "@/lib/demo";
import { formatINR } from "@/lib/plans";

export const Route = createFileRoute("/_authenticated/choose-plan")({
  staticData: { sitemap: false },
  head: () => ({ meta: [
    { title: "Choose your plan — LoadLoom" }, { name: "description", content: "Pick the LoadLoom plan for your business." },
    { property: "og:title", content: "Choose your plan — LoadLoom" }, { property: "og:description", content: "Free, Starter, Growth or Fleet." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" },
  ] }),
  component: ChoosePlan,
});

function ChoosePlan() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { session } = useSession();
  const { tier } = usePlan();
  const { data: settings } = usePlanSettings();
  const plans = plansWithSettings(settings);
  const isDemo = session?.user.email === DEMO_EMAIL;

  function markPicked() {
    if (session) localStorage.setItem(planPickedKey(session.user.id), "1");
  }

  async function pick(id: string) {
    if (isDemo) return navigate({ to: "/pricing" });
    markPicked();
    if (id === "free") {
      await supabase.rpc("request_plan", { _plan: "free" });
      qc.invalidateQueries({ queryKey: ["plan"] });
      toast.success("You're on the Free plan");
      return navigate({ to: "/dashboard" });
    }
    navigate({ to: "/checkout/$plan", params: { plan: id } });
  }

  return (
    <div className="min-h-screen bg-navy px-4 py-10 text-navy-foreground">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-center gap-3">
          <img src={logoIcon} alt="LoadLoom" className="size-10 rounded-lg" />
          <p className="text-xl font-extrabold">LoadLoom</p>
        </div>
        <h1 className="mt-6 text-center text-2xl font-extrabold sm:text-3xl">Choose your plan</h1>
        <p className="mt-2 text-center text-sm text-navy-foreground/60">Start free or pick a paid plan. You can use Free while your payment is verified.</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {plans.map((p) => {
            const featured = p.id === "growth";
            const current = p.id === tier;
            return (
              <div key={p.id} className={`flex flex-col rounded-xl border p-5 ${featured ? "border-accent bg-accent/10" : "border-navy-foreground/15 bg-navy-foreground/5"}`}>
                <p className="eyebrow text-navy-foreground/60">{p.positioning}</p>
                <h2 className="mt-1 text-xl font-bold">{p.name}</h2>
                <p className="mt-2 font-display text-3xl font-extrabold">{p.price === 0 ? "₹0" : formatINR(p.price)}<span className="text-sm font-medium text-navy-foreground/60">/month</span></p>
                <ul className="mt-4 flex-1 space-y-2 text-sm">
                  {p.highlights.slice(0, 4).map((h) => <li key={h} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-accent" />{h}</li>)}
                </ul>
                <Button className="mt-5 w-full" variant={featured ? "action" : "onNavy"} disabled={current && p.id !== "free"} onClick={() => pick(p.id)}>
                  {current ? (p.id === "free" ? "Continue on Free" : "Current plan") : p.id === "free" ? "Start Free" : `Choose ${p.name}`}
                  <ArrowRight />
                </Button>
              </div>
            );
          })}
        </div>
        <p className="mt-8 text-center text-sm"><Link to="/dashboard" onClick={markPicked} className="text-navy-foreground/60 hover:underline">Skip for now</Link></p>
      </div>
    </div>
  );
}
