import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { resolveDeletionRequest } from "@/lib/account-deletion.functions";

export function AdminDeletionRequests() {
  const qc = useQueryClient();
  const resolve = useServerFn(resolveDeletionRequest);
  const { data = [], isLoading } = useQuery({
    queryKey: ["admin-deletion-requests"],
    queryFn: async () => {
      const { data, error } = await supabase.from("deletion_requests").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const act = useMutation({
    mutationFn: (v: { id: string; approve: boolean }) => resolve({ data: v }),
    onSuccess: (_r, v) => {
      toast.success(v.approve ? "Account and data deleted" : "Request declined");
      qc.invalidateQueries({ queryKey: ["admin-deletion-requests"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (!data.length) return <p className="text-sm text-muted-foreground">No deletion requests.</p>;
  return (
    <ul className="space-y-3">
      {data.map((r) => (
        <li key={r.id} className="rounded-lg border border-border bg-card p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-semibold">{r.email ?? r.user_id}</p>
            <span className="text-xs font-medium uppercase text-muted-foreground">{r.status}</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString("en-IN")}</p>
          {r.reason && <p className="mt-2 text-sm">{r.reason}</p>}
          {r.status === "pending" && (
            <div className="mt-3 flex gap-2">
              <Button
                size="sm"
                variant="destructive"
                disabled={act.isPending}
                onClick={() => {
                  if (confirm(`Permanently delete ${r.email ?? "this account"} and all its data? This cannot be undone.`))
                    act.mutate({ id: r.id, approve: true });
                }}
              >
                Approve &amp; delete
              </Button>
              <Button size="sm" variant="outline" disabled={act.isPending} onClick={() => act.mutate({ id: r.id, approve: false })}>
                Decline
              </Button>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

export function RequestDeletion() {
  const qc = useQueryClient();
  const { data: existing } = useQuery({
    queryKey: ["my-deletion-request"],
    queryFn: async () => {
      const { data } = await supabase.from("deletion_requests").select("*").eq("status", "pending").maybeSingle();
      return data;
    },
  });
  const submit = useMutation({
    mutationFn: async (reason: string) => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      const { error } = await supabase.from("deletion_requests").insert({ user_id: u.user.id, email: u.user.email, reason: reason || null });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Deletion request sent. We'll process it shortly.");
      qc.invalidateQueries({ queryKey: ["my-deletion-request"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Couldn't send request"),
  });

  return (
    <div className="rounded-xl border border-destructive/40 bg-card p-5">
      <h2 className="text-lg font-bold">Delete account</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Permanently remove your account and all business records. Once approved this cannot be undone.
      </p>
      {existing ? (
        <p className="mt-4 text-sm font-medium">Your deletion request is pending review.</p>
      ) : (
        <Button
          className="mt-4"
          variant="destructive"
          disabled={submit.isPending}
          onClick={() => {
            const reason = prompt("Request permanent deletion of your account and data?\n\nOptional: tell us why.");
            if (reason !== null) submit.mutate(reason.trim().slice(0, 500));
          }}
        >
          Request account deletion
        </Button>
      )}
    </div>
  );
}
