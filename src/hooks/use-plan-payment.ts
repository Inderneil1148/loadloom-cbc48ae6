import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";

/** Latest plan payment submitted by the signed-in user (or null). */
export function useLatestPlanPayment() {
  const { session } = useSession();
  const uid = session?.user.id;
  return useQuery({
    queryKey: ["plan-payment", uid],
    enabled: !!uid,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plan_payments")
        .select("id, plan, status, admin_note, created_at")
        .eq("user_id", uid!)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export const planPickedKey = (uid: string) => `ll-plan-picked-${uid}`;
