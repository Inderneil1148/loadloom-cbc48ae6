import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Reports which connected services have their keys configured (never returns the keys).
export const getIntegrationStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: ok } = await context.supabase.rpc("is_super_admin", { _user_id: context.userId });
    if (!ok) throw new Error("Not allowed");
    const has = (k: string) => !!process.env[k];
    return [
      { name: "Google Maps", ok: has("GOOGLE_MAPS_API_KEY") },
      { name: "Google Analytics", ok: has("GOOGLE_ANALYTICS_MEASUREMENT_ID") },
      { name: "AI assistant", ok: has("LOVABLE_API_KEY") },
      { name: "Email sending", ok: has("LOVABLE_API_KEY") },
    ];
  });
