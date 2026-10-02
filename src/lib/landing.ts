import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { DEMO_EMAIL } from "@/lib/demo";

/** Where a signed-in user should land: paid/pending-paid → dashboard, free → plan picker. */
export async function landingFor(session: Session): Promise<"/dashboard" | "/choose-plan"> {
  if (session.user.email === DEMO_EMAIL) return "/dashboard";
  const uid = session.user.id;
  const [{ data: sub }, { data: pay }] = await Promise.all([
    supabase.from("subscriptions").select("plan, status").eq("user_id", uid).maybeSingle(),
    supabase.from("plan_payments").select("status").eq("user_id", uid).eq("status", "pending").limit(1).maybeSingle(),
  ]);
  if (sub && sub.plan !== "free") return "/dashboard";
  if (pay) return "/dashboard";
  return "/choose-plan";
}
