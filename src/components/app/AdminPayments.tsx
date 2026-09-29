import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ImageUp, Save, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { fmtDate } from "@/components/app/RecordManager";
import { TIER_NAMES, formatINR, type Tier } from "@/lib/plans";

export function AdminPayments() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<"pending" | "all">("pending");
  const { data, isPending, error } = useQuery({
    queryKey: ["admin-plan-payments"],
    queryFn: async () => {
      const { data, error } = await supabase.from("plan_payments").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      const rows = data ?? [];
      const urls = await Promise.all(rows.map((r) => supabase.storage.from("payment-proofs").createSignedUrl(r.screenshot_path, 3600)));
      return rows.map((r, i) => ({ ...r, url: urls[i]?.data?.signedUrl ?? null }));
    },
  });
  const act = useMutation({
    mutationFn: async ({ row, approve, note }: { row: { id: string; user_id: string; plan: string }; approve: boolean; note?: string }) => {
      const { error } = await supabase.from("plan_payments").update({ status: approve ? "approved" : "rejected", admin_note: note ?? null }).eq("id", row.id);
      if (error) throw error;
      const patch = approve ? { plan: row.plan, requested_plan: row.plan, status: "active" } : { status: "pending" };
      const { error: e2 } = await supabase.from("subscriptions").update(patch).eq("user_id", row.user_id);
      if (e2) throw e2;
    },
    onSuccess: (_, v) => {
      toast.success(v.approve ? "Plan activated" : "Payment rejected");
      qc.invalidateQueries({ queryKey: ["admin-plan-payments"] });
      qc.invalidateQueries({ queryKey: ["admin-subs"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Couldn't save"),
  });

  if (isPending) return <Skeleton className="h-64 w-full" />;
  if (error) return <p className="text-sm text-destructive">Couldn't load payments.</p>;
  const rows = data.filter((r) => filter === "all" || r.status === "pending");

  return (
    <div className="space-y-5">
      <PaymentSettingsCard />
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-bold">Payments to verify</h2>
        <select aria-label="Filter payments" className="h-9 rounded-md border border-input bg-background px-2 text-sm" value={filter} onChange={(e) => setFilter(e.target.value as "pending" | "all")}>
          <option value="pending">Waiting</option><option value="all">All</option>
        </select>
      </div>
      {!rows.length && <p className="rounded-md border border-border bg-card p-8 text-center text-sm text-muted-foreground">No payments here.</p>}
      <div className="grid gap-3 md:grid-cols-2">
        {rows.map((r) => (
          <div key={r.id} className="rounded-md border border-border bg-card p-4 shadow-panel">
            <div className="flex gap-3">
              {r.url ? <a href={r.url} target="_blank" rel="noreferrer"><img src={r.url} alt="Payment screenshot" className="h-28 w-20 shrink-0 rounded border border-border object-cover" /></a> : <div className="h-28 w-20 rounded bg-muted" />}
              <div className="min-w-0 flex-1 text-sm">
                <p className="truncate font-semibold">{r.email ?? "—"}</p>
                <p><b>{TIER_NAMES[r.plan as Tier]}</b> · {formatINR(Number(r.amount))}</p>
                <p className="text-xs text-muted-foreground">Ref: {r.reference || "—"} · {fmtDate(r.created_at)}</p>
                <p className="mt-1 text-xs capitalize">Status: <b>{r.status}</b>{r.admin_note ? ` · ${r.admin_note}` : ""}</p>
              </div>
            </div>
            {r.status === "pending" && (
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="action" className="flex-1" disabled={act.isPending} onClick={() => act.mutate({ row: r, approve: true })}><Check /> Approve</Button>
                <Button size="sm" variant="outline" className="flex-1" disabled={act.isPending} onClick={() => {
                  const note = window.prompt("Reason for rejecting (shown to you only):") ?? undefined;
                  act.mutate({ row: r, approve: false, note });
                }}><X /> Reject</Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function PaymentSettingsCard() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["payment-settings"],
    queryFn: async () => {
      const { data } = await supabase.from("payment_settings").select("upi_id, payee_name, qr_path").maybeSingle();
      let qrUrl: string | null = null;
      if (data?.qr_path) qrUrl = (await supabase.storage.from("payment-qr").createSignedUrl(data.qr_path, 3600)).data?.signedUrl ?? null;
      return { ...data, qrUrl };
    },
  });
  const [upi, setUpi] = useState<string | null>(null);
  const [payee, setPayee] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function save(qrFile?: File) {
    setBusy(true);
    try {
      const patch: { upi_id?: string | null; payee_name?: string | null; qr_path?: string } = {};
      if (upi !== null) patch.upi_id = upi.trim() || null;
      if (payee !== null) patch.payee_name = payee.trim() || null;
      if (qrFile) {
        const path = `qr-${Date.now()}.${qrFile.name.split(".").pop() || "png"}`;
        const up = await supabase.storage.from("payment-qr").upload(path, qrFile, { contentType: qrFile.type });
        if (up.error) throw up.error;
        patch.qr_path = path;
      }
      const { error } = await supabase.from("payment_settings").update(patch).eq("id", true);
      if (error) throw error;
      toast.success("Payment details saved");
      setUpi(null); setPayee(null);
      qc.invalidateQueries({ queryKey: ["payment-settings"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't save");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-md border border-border bg-card p-4 shadow-panel">
      <p className="font-bold">Your payment details</p>
      <p className="text-xs text-muted-foreground">Shown on the payment page. Upload your UPI QR, or just enter your UPI ID and a QR is made for you.</p>
      <div className="mt-4 flex flex-col gap-4 sm:flex-row">
        {data?.qrUrl ? <img src={data.qrUrl} alt="Your QR" className="size-28 rounded border border-border object-contain" /> : <div className="grid size-28 place-items-center rounded border border-dashed border-border text-xs text-muted-foreground">No QR image</div>}
        <div className="grid flex-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5"><Label htmlFor="upi" className="text-xs">UPI ID</Label><Input id="upi" placeholder="yourname@upi" value={upi ?? data?.upi_id ?? ""} onChange={(e) => setUpi(e.target.value)} /></div>
          <div className="space-y-1.5"><Label htmlFor="payee" className="text-xs">Payee name</Label><Input id="payee" placeholder="Business name" value={payee ?? data?.payee_name ?? ""} onChange={(e) => setPayee(e.target.value)} /></div>
          <label className="flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md border border-input text-sm">
            <ImageUp className="size-4" /> Upload QR image
            <input type="file" accept="image/*" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) save(f); }} />
          </label>
          <Button variant="action" disabled={busy || (upi === null && payee === null)} onClick={() => save()}><Save /> Save</Button>
        </div>
      </div>
    </div>
  );
}
