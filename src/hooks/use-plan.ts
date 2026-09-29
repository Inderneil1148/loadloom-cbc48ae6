import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { hasFeature, type Feature, type Tier } from "@/lib/plans";

export function usePlan() {
  const { session, loading: sessionLoading } = useSession();
  const qc = useQueryClient();
  const uid = session?.user.id;
  const q = useQuery({
    queryKey: ["plan", uid],
    enabled: !!uid,
    queryFn: async () => {
      const [s, r] = await Promise.all([
        supabase.from("subscriptions").select("*").eq("user_id", uid!).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", uid!),
      ]);
      if (s.error) throw s.error;
      return { sub: s.data, isAdmin: (r.data ?? []).some((x) => x.role === "admin") };
    },
  });

  // Refresh instantly when the admin approves/changes this user's plan.
  useEffect(() => {
    if (!uid) return;
    const channel = supabase
      .channel(`plan-${uid}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "subscriptions", filter: `user_id=eq.${uid}` }, () => {
        qc.invalidateQueries({ queryKey: ["plan", uid] });
        qc.invalidateQueries({ queryKey: ["plan-payment", uid] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [uid, qc]);

  const sub = q.data?.sub ?? null;
  const tier: Tier = sub && sub.status !== "suspended" ? (sub.plan as Tier) : "free";
  return {
    tier,
    sub,
    isAdmin: !!q.data?.isAdmin,
    loading: sessionLoading || (!!uid && q.isPending),
    can: (f: Feature) => hasFeature(tier, f),
  };
}
