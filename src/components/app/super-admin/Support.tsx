import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { StatCard } from "@/components/app/PlanGate";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { fmtDate } from "@/components/app/RecordManager";
import { Section } from "./shared";

const KIND = { bug: "Bug", feedback: "Feedback", feature: "Feature request" } as const;
const STATUSES = ["open", "pending", "resolved"] as const;

export function SuperAdminSupport() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<string>("open");
  const [openId, setOpenId] = useState<string | null>(null);
  const [note, setNote] = useState("");

  const tickets = useQuery({
    queryKey: ["sa-tickets"],
    queryFn: async () => (await supabase.from("support_tickets").select("*").order("created_at", { ascending: false })).data ?? [],
  });
  const notes = useQuery({
    queryKey: ["sa-notes", openId],
    enabled: !!openId,
    queryFn: async () => (await supabase.from("ticket_notes").select("*").eq("ticket_id", openId!).order("created_at")).data ?? [],
  });
  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("support_tickets").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sa-tickets"] }),
    onError: (e: Error) => toast.error(e.message),
  });
  const addNote = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("ticket_notes").insert({ ticket_id: openId!, note: note.trim() });
      if (error) throw error;
    },
    onSuccess: () => { setNote(""); qc.invalidateQueries({ queryKey: ["sa-notes", openId] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const all = tickets.data ?? [];
  const count = (s: string) => all.filter((t) => t.status === s).length;
  const resolved = all.filter((t) => t.resolved_at);
  const avgHrs = resolved.length
    ? resolved.reduce((a, t) => a + (new Date(t.resolved_at!).getTime() - new Date(t.created_at).getTime()), 0) / resolved.length / 3600000
    : null;
  const shown = all.filter((t) => filter === "all" || t.status === filter || t.kind === filter);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Open" value={count("open")} tone="accent" />
        <StatCard label="Pending" value={count("pending")} />
        <StatCard label="Resolved" value={count("resolved")} tone="good" />
        <StatCard label="Avg. resolution" value={avgHrs == null ? "—" : avgHrs < 24 ? `${avgHrs.toFixed(1)} h` : `${(avgHrs / 24).toFixed(1)} days`} />
      </div>
      <Section title="Tickets" actions={
        <select aria-label="Filter tickets" className="h-9 rounded-md border border-input bg-background px-2 text-sm" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All</option>
          {STATUSES.map((s) => <option key={s} value={s} className="capitalize">{s[0]!.toUpperCase() + s.slice(1)}</option>)}
          <option value="bug">Bug reports</option><option value="feedback">Feedback</option><option value="feature">Feature requests</option>
        </select>
      }>
        {!shown.length ? <p className="text-sm text-muted-foreground">No tickets here.</p> : (
          <ul className="divide-y divide-border">
            {shown.map((t) => (
              <li key={t.id} className="py-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <button className="min-w-0 text-left" onClick={() => setOpenId(openId === t.id ? null : t.id)}>
                    <p className="font-semibold">{t.subject}</p>
                    <p className="text-xs text-muted-foreground">{KIND[t.kind as keyof typeof KIND]} · {t.email} · {fmtDate(t.created_at)}</p>
                  </button>
                  <div className="flex gap-1">
                    {STATUSES.map((s) => (
                      <Button key={s} size="sm" variant={t.status === s ? "default" : "outline"} className="capitalize" onClick={() => setStatus.mutate({ id: t.id, status: s })}>{s}</Button>
                    ))}
                  </div>
                </div>
                {openId === t.id && (
                  <div className="mt-3 space-y-3 rounded-md bg-muted/40 p-3">
                    <p className="whitespace-pre-wrap text-sm">{t.message}</p>
                    <div>
                      <p className="text-xs font-bold text-muted-foreground">Internal notes (only you see these)</p>
                      {(notes.data ?? []).map((n) => <p key={n.id} className="mt-1 text-sm"><span className="text-xs text-muted-foreground">{fmtDate(n.created_at)}: </span>{n.note}</p>)}
                      <div className="mt-2 flex gap-2">
                        <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note" />
                        <Button disabled={!note.trim() || addNote.isPending} onClick={() => addNote.mutate()}>Add</Button>
                      </div>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}
