import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const KINDS = { bug: "Bug", feedback: "Feedback", feature: "Feature request" } as const;

export function ContactSupport() {
  const qc = useQueryClient();
  const [kind, setKind] = useState<keyof typeof KINDS>("bug");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const mine = useQuery({
    queryKey: ["my-tickets"],
    queryFn: async () => (await supabase.from("support_tickets").select("id, subject, status, created_at").order("created_at", { ascending: false }).limit(10)).data ?? [],
  });
  const send = useMutation({
    mutationFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const { error } = await supabase.from("support_tickets").insert({ kind, subject: subject.trim(), message: message.trim(), email: u.user?.email ?? null });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Thanks — we've got your message."); setSubject(""); setMessage(""); qc.invalidateQueries({ queryKey: ["my-tickets"] }); },
    onError: () => toast.error("Could not send. Please try again."),
  });
  return (
    <div className="mt-5 grid gap-5 lg:grid-cols-2">
      <form className="space-y-3 rounded-md border border-border bg-card p-4 shadow-panel" onSubmit={(e) => { e.preventDefault(); send.mutate(); }}>
        <p className="eyebrow">Contact support</p>
        <div className="space-y-1.5"><Label htmlFor="cs-kind">Type</Label>
          <select id="cs-kind" className="h-10 w-full rounded-md border border-input bg-background px-2 text-sm" value={kind} onChange={(e) => setKind(e.target.value as keyof typeof KINDS)}>
            {Object.entries(KINDS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select></div>
        <div className="space-y-1.5"><Label htmlFor="cs-sub">Subject</Label><Input id="cs-sub" maxLength={200} required value={subject} onChange={(e) => setSubject(e.target.value)} /></div>
        <div className="space-y-1.5"><Label htmlFor="cs-msg">Message</Label><Textarea id="cs-msg" rows={4} maxLength={5000} required value={message} onChange={(e) => setMessage(e.target.value)} /></div>
        <Button type="submit" disabled={send.isPending || !subject.trim() || !message.trim()}>Send to support</Button>
      </form>
      <div className="rounded-md border border-border bg-card p-4 shadow-panel">
        <p className="eyebrow">Your messages</p>
        {!mine.data?.length ? <p className="mt-3 text-sm text-muted-foreground">No messages yet.</p> : (
          <ul className="mt-2 divide-y divide-border text-sm">{mine.data.map((t) => (
            <li key={t.id} className="flex justify-between gap-2 py-2"><span className="truncate">{t.subject}</span><span className="capitalize text-muted-foreground">{t.status}</span></li>
          ))}</ul>
        )}
      </div>
    </div>
  );
}
