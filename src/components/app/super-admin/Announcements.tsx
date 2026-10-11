import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Send, Save, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { fmtDate } from "@/components/app/RecordManager";
import { TIER_NAMES, TIER_ORDER } from "@/lib/plans";
import { ComingSoon, Section } from "./shared";

const sel = "h-10 w-full rounded-md border border-input bg-background px-2 text-sm";
const KINDS = { general: "General", maintenance: "Maintenance", release: "Release notes" } as const;
type Kind = keyof typeof KINDS;

export function SuperAdminAnnouncements() {
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [kind, setKind] = useState<Kind>("general");
  const [audience, setAudience] = useState<"all" | "plan" | "users">("all");
  const [plan, setPlan] = useState<string>("free");
  const [picked, setPicked] = useState<string[]>([]);
  const [search, setSearch] = useState("");

  const users = useQuery({
    queryKey: ["sa-users"],
    queryFn: async () => (await supabase.from("subscriptions").select("user_id, email, business_name").order("email")).data ?? [],
  });
  const templates = useQuery({
    queryKey: ["sa-templates"],
    queryFn: async () => (await supabase.from("announcement_templates").select("*").order("created_at", { ascending: false })).data ?? [],
  });
  const history = useQuery({
    queryKey: ["sa-announcements"],
    queryFn: async () => {
      const [a, r] = await Promise.all([
        supabase.from("announcements").select("*").order("created_at", { ascending: false }).limit(50),
        supabase.rpc("announcement_reads"),
      ]);
      const reads = new Map((r.data ?? []).map((x) => [x.announcement_id, Number(x.read_count)]));
      return (a.data ?? []).map((x) => ({ ...x, reads: reads.get(x.id) ?? 0 }));
    },
  });

  const send = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("send_announcement", {
        _title: title.trim(), _body: body.trim(), _kind: kind, _audience: audience, _plan: plan, _user_ids: picked,
      });
      if (error) throw error;
      return data as number;
    },
    onSuccess: (n) => {
      toast.success(`Sent to ${n} ${n === 1 ? "person" : "people"}`);
      setTitle(""); setBody(""); setPicked([]);
      qc.invalidateQueries({ queryKey: ["sa-announcements"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const saveTpl = useMutation({
    mutationFn: async () => {
      const name = window.prompt("Template name", title);
      if (!name) return;
      const { error } = await supabase.from("announcement_templates").insert({ name, title, body, kind });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sa-templates"] }),
    onError: (e: Error) => toast.error(e.message),
  });
  const delTpl = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("announcement_templates").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sa-templates"] }),
  });

  const list = (users.data ?? []).filter((u) => !search || `${u.email} ${u.business_name}`.toLowerCase().includes(search.toLowerCase()));
  const canSend = title.trim() && (audience !== "users" || picked.length > 0);

  return (
    <div className="space-y-5">
      <Section title="New announcement">
        <form className="grid gap-3" onSubmit={(e) => { e.preventDefault(); if (canSend) send.mutate(); }}>
          {!!templates.data?.length && (
            <div className="grid gap-1">
              <Label htmlFor="tpl">Start from a template</Label>
              <div className="flex flex-wrap gap-2">
                {templates.data.map((t) => (
                  <span key={t.id} className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs">
                    <button type="button" className="font-semibold hover:underline" onClick={() => { setTitle(t.title); setBody(t.body ?? ""); setKind(t.kind as Kind); }}>{t.name}</button>
                    <button type="button" aria-label={`Delete template ${t.name}`} onClick={() => delTpl.mutate(t.id)}><Trash2 className="size-3.5 text-muted-foreground" /></button>
                  </span>
                ))}
              </div>
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1"><Label htmlFor="a-kind">Type</Label>
              <select id="a-kind" className={sel} value={kind} onChange={(e) => setKind(e.target.value as Kind)}>
                {Object.entries(KINDS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select></div>
            <div className="grid gap-1"><Label htmlFor="a-aud">Send to</Label>
              <select id="a-aud" className={sel} value={audience} onChange={(e) => setAudience(e.target.value as typeof audience)}>
                <option value="all">Everyone</option><option value="plan">One plan</option><option value="users">Chosen users</option>
              </select></div>
          </div>
          {audience === "plan" && (
            <div className="grid gap-1"><Label htmlFor="a-plan">Plan</Label>
              <select id="a-plan" className={sel} value={plan} onChange={(e) => setPlan(e.target.value)}>
                {TIER_ORDER.map((t) => <option key={t} value={t}>{TIER_NAMES[t]}</option>)}
              </select></div>
          )}
          {audience === "users" && (
            <div className="grid gap-2">
              <Input placeholder="Search users" value={search} onChange={(e) => setSearch(e.target.value)} />
              <div className="max-h-48 overflow-y-auto rounded-md border border-border p-2">
                {list.map((u) => (
                  <label key={u.user_id} className="flex items-center gap-2 py-1 text-sm">
                    <input type="checkbox" checked={picked.includes(u.user_id)} onChange={(e) => setPicked((p) => e.target.checked ? [...p, u.user_id] : p.filter((x) => x !== u.user_id))} />
                    <span className="truncate">{u.business_name ? `${u.business_name} — ` : ""}{u.email}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">{picked.length} selected</p>
            </div>
          )}
          <div className="grid gap-1"><Label htmlFor="a-title">Title</Label><Input id="a-title" maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} required /></div>
          <div className="grid gap-1"><Label htmlFor="a-body">Message</Label><Textarea id="a-body" maxLength={1000} rows={4} value={body} onChange={(e) => setBody(e.target.value)} /></div>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={!canSend || send.isPending}><Send className="size-4" /> Send in-app</Button>
            <Button type="button" variant="outline" disabled={!title.trim()} onClick={() => saveTpl.mutate()}><Save className="size-4" /> Save as template</Button>
          </div>
        </form>
      </Section>

      <Section title="Sent announcements">
        {!history.data?.length ? <p className="text-sm text-muted-foreground">Nothing sent yet.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="text-left text-xs text-muted-foreground"><tr><th className="py-2 pr-3">Title</th><th className="pr-3">Type</th><th className="pr-3">To</th><th className="pr-3 text-right">Delivered</th><th className="pr-3 text-right">Read</th><th>Sent</th></tr></thead>
              <tbody>
                {history.data.map((a) => (
                  <tr key={a.id} className="border-t border-border">
                    <td className="py-2 pr-3 font-semibold">{a.title}</td><td className="pr-3">{KINDS[a.kind as Kind] ?? a.kind}</td>
                    <td className="pr-3 capitalize">{a.audience}</td><td className="pr-3 text-right">{a.recipient_count}</td>
                    <td className="pr-3 text-right">{a.reads}</td><td>{fmtDate(a.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <ComingSoon title="Email announcements" note="Announcements are delivered in the app's notification bell. Sending them by email is coming soon." />
    </div>
  );
}
