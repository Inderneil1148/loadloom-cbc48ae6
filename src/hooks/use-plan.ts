import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { hasFeature, type Feature, type Tier } from "@/lib/plans";

export function usePlan() {
  const { session, loading: sessionLoading } = useSession();
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
