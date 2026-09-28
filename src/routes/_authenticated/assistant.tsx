import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Mic, Search, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { AppPage } from "@/components/app/PlanGate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { runAiTool } from "@/lib/ai.functions";
import { formatINR } from "@/lib/plans";
import { num, outstandingByCustomer, useOps } from "@/lib/ops-data";

export const Route = createFileRoute("/_authenticated/assistant")({
  staticData: { sitemap: false },
  head: () => ({ meta: [
    { title: "AI Assistant — LoadLoom" }, { name: "description", content: "Voice to order, weighbridge slip reading, daily summary and follow-ups." },
    { property: "og:title", content: "AI Assistant — LoadLoom" }, { property: "og:description", content: "AI tools for dispatch operations." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" },
  ] }),
  component: () => <AppPage eyebrow="Fleet plan" title="AI Assistant" description="Optional helpers — your app works normally without them." feature="ai_tools"><Assistant /></AppPage>,
});

const card = "rounded-md border border-border bg-card p-4 shadow-panel";
const parseJson = (t: string) => { try { return JSON.parse(t.replace(/^```(json)?|```$/gm, "").trim()) as Record<string, unknown>; } catch { return null; } };

function useAi() {
  const fn = useServerFn(runAiTool);
  const [busy, setBusy] = useState(false);
  const run = async (data: { task: "order" | "slip" | "summary" | "followup"; text?: string; image?: string }) => {
    setBusy(true);
    try {
      const r = await fn({ data });
      if (!r.ok) { toast.error(r.error); return null; }
      return r.text;
    } catch { toast.error("AI couldn't respond. Try again."); return null; } finally { setBusy(false); }
  };
  return { run, busy };
}

function Assistant() {
  const { data } = useOps();
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <VoiceOrder />
      <SlipReader />
      <DailySummary data={data} />
      <FollowUp data={data} />
      <SmartSearch data={data} />
    </div>
  );
}

function VoiceOrder() {
  const { run, busy } = useAi();
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const [draft, setDraft] = useState<Record<string, unknown> | null>(null);
  const listen = () => {
    const W = window as unknown as Record<string, unknown>;
    const SR = (W["SpeechRecognition"] ?? W["webkitSpeechRecognition"]) as (new () => { lang: string; onresult: (e: { results: { 0: { transcript: string } }[] }) => void; start: () => void }) | undefined;
    if (!SR) { toast.error("Voice input isn't supported in this browser. Type instead."); return; }
    const r = new SR(); r.lang = "en-IN";
    r.onresult = (e) => setText((t) => `${t} ${e.results[0]![0].transcript}`.trim());
    r.start();
  };
  async function save() {
    if (!draft) return;
    const q = num(draft["quantity"]), rate = num(draft["rate"]);
    const { error } = await supabase.from("orders").insert({
      order_no: `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(1000 + Math.random() * 9000)}`,
      customer_name: String(draft["customer_name"] || "Walk-in"), site: String(draft["site"] || "") || null,
      material: String(draft["material"] || "Material"), quantity: q, unit: String(draft["unit"] || "tonnes"), rate, amount: q * rate,
      delivery_date: (draft["delivery_date"] as string) || null, status: "confirmed",
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Order created"); setDraft(null); setText("");
    qc.invalidateQueries({ queryKey: ["records"] }); qc.invalidateQueries({ queryKey: ["dashboard"] });
  }
  return (
    <section className={card}>
      <h2 className="font-bold">Voice / text to order</h2>
      <Textarea className="mt-3" rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder="e.g. Patil Constructions, Hinjewadi site, 16 tonnes M sand at 1800, deliver tomorrow" />
      <div className="mt-2 flex gap-2">
        <Button variant="outline" onClick={listen}><Mic /> Speak</Button>
        <Button variant="action" disabled={busy || !text.trim()} onClick={async () => { const t = await run({ task: "order", text }); if (t) { const j = parseJson(t); if (j) setDraft(j); else toast.error("Couldn't read that. Try rephrasing."); } }}>{busy ? <Loader2 className="animate-spin" /> : <Sparkles />} Make order</Button>
      </div>
      {draft && <div className="mt-3 rounded-md bg-muted p-3 text-sm">
        {["customer_name", "site", "material", "quantity", "unit", "rate", "delivery_date"].map((k) => (
          <label key={k} className="mb-2 grid grid-cols-[7rem_1fr] items-center gap-2 text-xs capitalize">{k.replace("_", " ")}
            <Input className="h-8" value={String(draft[k] ?? "")} onChange={(e) => setDraft({ ...draft, [k]: e.target.value })} /></label>
        ))}
        <Button variant="action" size="sm" onClick={save}>Save as order</Button>
      </div>}
    </section>
  );
}

function SlipReader() {
  const { run, busy } = useAi();
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  async function onFile(f: File | undefined) {
    if (!f) return;
    if (f.size > 5_000_000) { toast.error("Image must be under 5 MB."); return; }
    const url = await new Promise<string>((res) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.readAsDataURL(f); });
    const t = await run({ task: "slip", image: url });
    if (t) setResult(parseJson(t) ?? { text: t });
  }
  return (
    <section className={card}>
      <h2 className="font-bold">Weighbridge slip reader</h2>
      <p className="mt-1 text-xs text-muted-foreground">Take a photo of the slip; we pull out vehicle, weights and material.</p>
      <label className="mt-3 flex h-24 cursor-pointer items-center justify-center rounded-md border border-dashed border-border text-sm text-muted-foreground">
        {busy ? <Loader2 className="animate-spin" /> : "Tap to upload slip photo"}
        <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} />
      </label>
      {result && <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">{Object.entries(result).map(([k, v]) => <div key={k}><dt className="capitalize text-muted-foreground">{k.replace("_", " ")}</dt><dd className="font-semibold">{String(v || "—")}</dd></div>)}</dl>}
    </section>
  );
}

function DailySummary({ data }: { data: ReturnType<typeof useOps>["data"] }) {
  const { run, busy } = useAi();
  const [out, setOut] = useState("");
  async function go() {
    if (!data) return;
    const today = new Date().toISOString().slice(0, 10);
    const stats = {
      date: today,
      orders_today: data.orders.filter((o) => o.order_date === today).length,
      sales_today: data.orders.filter((o) => o.order_date === today).reduce((s, o) => s + num(o.amount), 0),
      unassigned_orders: data.orders.filter((o) => o.status === "confirmed" && !o.vehicle_id).length,
      trips_live: data.deliveries.filter((d) => ["loading", "dispatched", "on_road", "arrived"].includes(d.status)).length,
      delivered_today: data.deliveries.filter((d) => String(d.delivered_at ?? "").startsWith(today)).length,
      collected_today: data.payments.filter((p) => p.paid_on === today).reduce((s, p) => s + num(p.amount), 0),
      top_outstanding: outstandingByCustomer(data).slice(0, 3),
    };
    const t = await run({ task: "summary", text: JSON.stringify(stats) });
    if (t) setOut(t);
  }
  return (
    <section className={card}>
      <h2 className="font-bold">Daily summary</h2>
      <Button className="mt-3" variant="action" disabled={busy || !data} onClick={go}>{busy ? <Loader2 className="animate-spin" /> : <Sparkles />} Write today's summary</Button>
      {out && <p className="mt-3 whitespace-pre-wrap text-sm">{out}</p>}
    </section>
  );
}

function FollowUp({ data }: { data: ReturnType<typeof useOps>["data"] }) {
  const { run, busy } = useAi();
  const dues = data ? outstandingByCustomer(data).filter((d) => d.due > 0) : [];
  const [cust, setCust] = useState("");
  const [msg, setMsg] = useState("");
  const pick = dues.find((d) => d.customer === cust) ?? dues[0];
  return (
    <section className={card}>
      <h2 className="font-bold">Payment follow-up draft</h2>
      {!dues.length ? <p className="mt-3 text-sm text-muted-foreground">No outstanding payments. 🎉</p> : <>
        <select aria-label="Customer" className="mt-3 h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={pick?.customer} onChange={(e) => setCust(e.target.value)}>
          {dues.map((d) => <option key={d.customer} value={d.customer}>{d.customer} — {formatINR(d.due)}</option>)}
        </select>
        <Button className="mt-2" variant="action" disabled={busy} onClick={async () => { const t = await run({ task: "followup", text: `Customer: ${pick!.customer}. Amount due: ${formatINR(pick!.due)}.` }); if (t) setMsg(t); }}>{busy ? <Loader2 className="animate-spin" /> : <Sparkles />} Draft message</Button>
        {msg && <><Textarea className="mt-3" rows={4} value={msg} onChange={(e) => setMsg(e.target.value)} />
          <Button asChild variant="outline" size="sm" className="mt-2"><a href={`https://wa.me/?text=${encodeURIComponent(msg)}`} target="_blank" rel="noreferrer">Send on WhatsApp</a></Button></>}
      </>}
    </section>
  );
}

function SmartSearch({ data }: { data: ReturnType<typeof useOps>["data"] }) {
  const [q, setQ] = useState("");
  const s = q.trim().toLowerCase();
  const hit = (r: Record<string, unknown>) => Object.values(r).some((v) => typeof v === "string" && v.toLowerCase().includes(s));
  const results = !data || s.length < 2 ? [] : [
    ...data.orders.filter(hit).map((o) => ({ k: `o${o.id}`, t: "Order", l: `${o.order_no} · ${o.customer_name} · ${o.material}` })),
    ...data.customers.filter(hit).map((c) => ({ k: `c${c.id}`, t: "Customer", l: c.name })),
    ...data.vehicles.filter(hit).map((v) => ({ k: `v${v.id}`, t: "Truck", l: v.registration })),
    ...data.invoices.filter(hit).map((i) => ({ k: `i${i.id}`, t: "Invoice", l: `${i.invoice_no} · ${i.customer_name}` })),
  ].slice(0, 20);
  return (
    <section className={`${card} lg:col-span-2`}>
      <h2 className="font-bold">Smart search</h2>
      <div className="relative mt-3"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search orders, customers, trucks, invoices…" /></div>
      {results.length > 0 && <ul className="mt-3 divide-y divide-border">{results.map((r) => <li key={r.k} className="flex gap-2 py-2 text-sm"><span className="w-16 shrink-0 text-xs font-semibold text-accent">{r.t}</span><span className="min-w-0 truncate">{r.l}</span></li>)}</ul>}
    </section>
  );
}
