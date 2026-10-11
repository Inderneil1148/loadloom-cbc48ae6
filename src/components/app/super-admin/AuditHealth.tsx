import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { StatCard } from "@/components/app/PlanGate";
import { Skeleton } from "@/components/ui/skeleton";
import { getIntegrationStatus } from "@/lib/super-admin.functions";
import pkg from "../../../../package.json";
import { ComingSoon, CsvButton, Section, fmtBytes } from "./shared";
import { useSuperAdminReport } from "./Reports";

const when = (s: string) => new Date(s).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

export function SuperAdminAudit() {
  const report = useSuperAdminReport();
  const log = useQuery({
    queryKey: ["sa-audit"],
    queryFn: async () => (await supabase.from("admin_audit_log").select("*").order("created_at", { ascending: false }).limit(300)).data ?? [],
  });
  const rows = (log.data ?? []).map((r) => {
    const d = (r.details ?? {}) as Record<string, unknown>;
    const detail = d["to_plan"] ? `${d["from_plan"]} → ${d["to_plan"]}, ${d["from_status"]} → ${d["to_status"]}` : d["plan"] ? `${d["plan"]}${d["amount"] ? ` · ₹${d["amount"]}` : ""}` : (d["upi_id"] as string) ?? (d["role"] as string) ?? "";
    return { time: when(r.created_at), action: r.action, account: (d["email"] as string) ?? "", detail };
  });
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <StatCard label="Your last sign-in" value={report.data?.my_last_sign_in ? when(report.data.my_last_sign_in) : "—"} />
        <StatCard label="Logged actions" value={rows.length} />
      </div>
      <Section title="Activity log" actions={<CsvButton name="audit-log" rows={rows} />}>
        <p className="mb-3 text-xs text-muted-foreground">Recorded automatically. Entries can't be edited or deleted by anyone.</p>
        {log.isLoading ? <Skeleton className="h-40 w-full" /> : !rows.length ? <p className="text-sm text-muted-foreground">No actions recorded yet.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="text-left text-xs text-muted-foreground"><tr><th className="py-2 pr-3">When</th><th className="pr-3">Action</th><th className="pr-3">Account</th><th>Details</th></tr></thead>
              <tbody>{rows.map((r, i) => (
                <tr key={i} className="border-t border-border"><td className="py-2 pr-3 whitespace-nowrap">{r.time}</td><td className="pr-3 font-semibold">{r.action}</td><td className="pr-3">{r.account}</td><td className="text-muted-foreground">{r.detail}</td></tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </Section>
      <div className="grid gap-3 sm:grid-cols-2">
        <ComingSoon title="Failed sign-in tracking" note="Failed sign-in attempts will be listed here." />
        <ComingSoon title="Admin session control" note="Seeing and ending your other signed-in devices is coming in phase 2." />
      </div>
    </div>
  );
}

export function SuperAdminHealth() {
  const integrations = useServerFn(getIntegrationStatus);
  const health = useQuery({
    queryKey: ["sa-health"],
    queryFn: async () => {
      const t = performance.now();
      const { data, error } = await supabase.rpc("super_admin_health");
      if (error) throw error;
      return { ...(data as { db_size: number; storage: { bucket: string; files: number; bytes: number }[] }), ms: Math.round(performance.now() - t) };
    },
    refetchInterval: 60000,
  });
  const ints = useQuery({ queryKey: ["sa-integrations"], queryFn: () => integrations() });
  const Dot = ({ ok }: { ok: boolean }) => ok ? <CheckCircle2 className="size-4 text-success" /> : <XCircle className="size-4 text-destructive" />;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Database" value={health.isLoading ? "Checking…" : health.error ? "Unreachable" : "Online"} tone={health.error ? "bad" : "good"} />
        <StatCard label="Response time" value={health.data ? `${health.data.ms} ms` : "—"} />
        <StatCard label="Database size" value={health.data ? fmtBytes(health.data.db_size) : "—"} />
        <StatCard label="App version" value={pkg.version} />
      </div>
      <Section title="File storage">
        {!health.data ? <Skeleton className="h-20 w-full" /> : (
          <ul className="divide-y divide-border text-sm">{health.data.storage.map((s) => (
            <li key={s.bucket} className="flex justify-between py-2"><span className="font-semibold">{s.bucket}</span><span className="text-muted-foreground">{s.files} files · {fmtBytes(Number(s.bytes))}</span></li>
          ))}</ul>
        )}
      </Section>
      <Section title="Connected services">
        {ints.error ? <p className="text-sm text-destructive">Could not check services.</p> : (
          <ul className="grid gap-2 sm:grid-cols-2">{(ints.data ?? []).map((i) => (
            <li key={i.name} className="flex items-center gap-2 rounded-md border border-border p-2 text-sm"><Dot ok={i.ok} />{i.name}<span className="ml-auto text-xs text-muted-foreground">{i.ok ? "Connected" : "Not set up"}</span></li>
          ))}</ul>
        )}
        <p className="mt-2 text-xs text-muted-foreground">Google Maps lookups only work on your custom domain once your own Maps key is added.</p>
      </Section>
      <div className="grid gap-3 sm:grid-cols-2">
        <ComingSoon title="App error log" note="Errors from the “Fix a problem” page aren't saved yet, so there's nothing to list." />
        <ComingSoon title="Background jobs & backups" note="Job status and backup controls are coming soon." />
      </div>
    </div>
  );
}
