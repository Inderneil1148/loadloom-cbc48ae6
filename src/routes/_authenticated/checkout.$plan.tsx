import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import QRCode from "qrcode";
import { ArrowLeft, CheckCircle2, Copy, ImageUp, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSession } from "@/hooks/use-session";
import { usePlanSettings } from "@/hooks/use-plan-settings";
import { submitPlanPayment } from "@/lib/plan-payments.functions";
import { DEMO_EMAIL } from "@/lib/demo";
import { TIER_NAMES, formatINR } from "@/lib/plans";

const PAID = ["starter", "growth", "fleet"] as const;
type Paid = (typeof PAID)[number];

export const Route = createFileRoute("/_authenticated/checkout/$plan")({
  staticData: { sitemap: false },
  head: () => ({ meta: [
    { title: "Pay for your plan — LoadLoom" }, { name: "description", content: "Pay by UPI and upload your payment screenshot." },
    { property: "og:title", content: "Pay for your plan — LoadLoom" }, { property: "og:description", content: "Scan the QR, pay, and upload the screenshot." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" },
  ] }),
  component: Checkout,
});

function Checkout() {
  const { plan: raw } = Route.useParams();
  const plan = (PAID as readonly string[]).includes(raw) ? (raw as Paid) : null;
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { session } = useSession();
  const submit = useServerFn(submitPlanPayment);
  const { data: settings } = usePlanSettings();
  const price = Number(settings?.find((s) => s.plan === plan)?.price ?? 0);
  const [file, setFile] = useState<File | null>(null);
  const [reference, setReference] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [qr, setQr] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user.email === DEMO_EMAIL) navigate({ to: "/pricing" });
  }, [session, navigate]);

  const { data: pay } = useQuery({
    queryKey: ["payment-settings", plan],
    queryFn: async () => {
      // Record the chosen paid plan first — payment details are only readable once a paid plan is requested.
      if (plan) await supabase.rpc("request_plan", { _plan: plan });
      const { data } = await supabase.from("payment_settings").select("upi_id, payee_name, qr_path").maybeSingle();
      let qrUrl: string | null = null;
      if (data?.qr_path) {
        const { data: signed } = await supabase.storage.from("payment-qr").createSignedUrl(data.qr_path, 3600);
        qrUrl = signed?.signedUrl ?? null;
      }
      return { ...data, qrUrl };
    },
  });

  useEffect(() => {
    if (pay?.qrUrl) { setQr(pay.qrUrl); return; }
    if (pay?.upi_id && plan) {
      const uri = `upi://pay?pa=${encodeURIComponent(pay.upi_id)}&pn=${encodeURIComponent(pay.payee_name || "LoadLoom")}&am=${price}&cu=INR&tn=${encodeURIComponent(`LoadLoom ${TIER_NAMES[plan]} plan`)}`;
      QRCode.toDataURL(uri, { width: 480, margin: 1 }).then(setQr).catch(() => setQr(null));
    } else setQr(null);
  }, [pay, price, plan]);

  if (!plan) return <div className="grid min-h-screen place-items-center p-6 text-center"><div><p className="font-bold">Plan not found</p><Button asChild className="mt-4" variant="outline"><Link to="/choose-plan">Choose a plan</Link></Button></div></div>;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !session || !plan) { toast.error("Please add your payment screenshot."); return; }
    if (!file.type.startsWith("image/")) { toast.error("Please upload an image."); return; }
    setBusy(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${session.user.id}/${Date.now()}.${ext}`;
      const up = await supabase.storage.from("payment-proofs").upload(path, file, { contentType: file.type });
      if (up.error) throw up.error;
      await submit({ data: { plan, reference, screenshotPath: path } });
      qc.invalidateQueries({ queryKey: ["plan"] });
      qc.invalidateQueries({ queryKey: ["plan-payment"] });
      setDone(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't submit. Try again.");
    } finally {
      setBusy(false);
    }
  }

  const card = "rounded-xl border border-navy-foreground/10 bg-navy-foreground/[0.04] p-5 sm:p-6";

  return (
    <div className="min-h-screen bg-navy px-4 py-8 text-navy-foreground">
      <div className="mx-auto max-w-lg">
        {done ? (
          <div className={`${card} text-center`}>
            <CheckCircle2 className="mx-auto size-12 text-accent" />
            <h1 className="mt-4 text-2xl font-extrabold">Payment received</h1>
            <p className="mt-2 text-sm text-navy-foreground/70">Thank you. Your <b>{TIER_NAMES[plan]}</b> plan will start working within 24 hours. We've emailed you a confirmation.</p>
            <p className="mt-2 text-sm text-navy-foreground/60">Meanwhile you can use LoadLoom on the Free plan.</p>
            <Button asChild variant="action" size="lg" className="mt-6 w-full"><Link to="/dashboard">Go to dashboard</Link></Button>
          </div>
        ) : (
          <>
            <Link to="/choose-plan" className="inline-flex items-center gap-1 text-sm text-navy-foreground/60 hover:underline"><ArrowLeft className="size-4" /> Change plan</Link>
            <h1 className="mt-4 text-2xl font-extrabold">Pay for {TIER_NAMES[plan]}</h1>
            <p className="mt-1 text-sm text-navy-foreground/60">Scan with any UPI app, pay, then upload the screenshot.</p>

            <div className={`${card} mt-6 text-center`}>
              <p className="text-sm text-navy-foreground/60">Amount to pay</p>
              <p className="font-display text-4xl font-extrabold text-accent">{formatINR(price)}<span className="text-base text-navy-foreground/60"> / month</span></p>
              {qr ? (
                <img src={qr} alt="UPI payment QR code" className="mx-auto mt-5 size-60 rounded-lg bg-white p-2" />
              ) : (
                <p className="mt-5 rounded-lg border border-dashed border-navy-foreground/20 p-6 text-sm text-navy-foreground/60">Payment QR is being set up. Please contact us to pay.</p>
              )}
              {pay?.upi_id && (
                <button type="button" onClick={() => { navigator.clipboard.writeText(pay.upi_id!); toast.success("UPI ID copied"); }} className="mt-4 inline-flex items-center gap-2 rounded-md border border-navy-foreground/15 px-3 py-2 text-sm">
                  UPI: <b>{pay.upi_id}</b> <Copy className="size-4" />
                </button>
              )}
            </div>

            <form onSubmit={onSubmit} className={`${card} mt-4 space-y-4`}>
              <div className="space-y-2">
                <Label htmlFor="shot">Payment screenshot</Label>
                <label htmlFor="shot" className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-navy-foreground/25 p-4 text-sm">
                  <ImageUp className="size-5 text-accent" />
                  <span className="min-w-0 truncate">{file ? file.name : "Tap to add a screenshot"}</span>
                </label>
                <input id="shot" type="file" accept="image/*" className="sr-only" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ref">UTR / reference number (optional)</Label>
                <Input id="ref" maxLength={100} value={reference} onChange={(e) => setReference(e.target.value)} placeholder="e.g. 412345678901" className="border-navy-foreground/15 bg-navy-foreground/5 text-navy-foreground" />
              </div>
              <Button type="submit" variant="action" size="lg" className="w-full" disabled={busy || !file}>
                {busy ? <><Loader2 className="animate-spin" /> Submitting…</> : "Submit payment"}
              </Button>
              <p className="text-center text-xs text-navy-foreground/50">Your plan starts within 24 hours of verification.</p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
