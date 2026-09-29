import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";

export interface AppNotification {
  id: string;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
}

export function useNotifications() {
  const { session } = useSession();
  const qc = useQueryClient();
  const uid = session?.user.id;

  const q = useQuery({
    queryKey: ["notifications", uid],
    enabled: !!uid,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("id, title, body, link, read_at, created_at")
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      return (data ?? []) as AppNotification[];
    },
  });

  // Live: toast + refresh when a new notification arrives (e.g. plan approved).
  useEffect(() => {
    if (!uid) return;
    const channel = supabase
      .channel(`notifications-${uid}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${uid}` }, (payload) => {
        const n = payload.new as AppNotification;
        toast.success(n.title, { description: n.body ?? undefined });
        qc.invalidateQueries({ queryKey: ["notifications", uid] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [uid, qc]);

  const markRead = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from("notifications").update({ read_at: new Date().toISOString() }).in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications", uid] }),
  });

  const items = q.data ?? [];
  return {
    items,
    unread: items.filter((n) => !n.read_at).length,
    loading: q.isPending,
    markRead: (id: string) => markRead.mutate([id]),
    markAllRead: () => {
      const ids = items.filter((n) => !n.read_at).map((n) => n.id);
      if (ids.length) markRead.mutate(ids);
    },
  };
}
