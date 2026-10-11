import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const OWNER_TABLES = [
  "payments", "invoices", "deliveries", "quotations", "orders", "drivers",
  "vehicles", "delivery_sites", "customers", "materials", "business_profiles",
] as const;
const USER_TABLES = ["notifications", "plan_payments", "subscriptions"] as const;

export const resolveDeletionRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid(), approve: z.boolean(), note: z.string().max(500).optional() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Not allowed");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: req, error } = await supabaseAdmin.from("deletion_requests").select("*").eq("id", data.id).single();
    if (error || !req) throw new Error("Request not found");
    if (req.status !== "pending") throw new Error("Already handled");

    if (!data.approve) {
      await supabaseAdmin.from("deletion_requests").update({ status: "declined", admin_note: data.note ?? null }).eq("id", data.id);
      await supabaseAdmin.from("notifications").insert({
        user_id: req.user_id,
        title: "Your deletion request was declined",
        body: data.note ? `Reason: ${data.note}` : "Contact support for details.",
        link: "/settings",
      });
      return { ok: true };
    }

    if (req.user_id === context.userId) throw new Error("Admins cannot delete their own account here");
    for (const t of OWNER_TABLES) {
      const { error: e } = await supabaseAdmin.from(t).delete().eq("owner_id", req.user_id);
      if (e) throw new Error(`Failed to delete ${t}: ${e.message}`);
    }
    for (const t of USER_TABLES) {
      const { error: e } = await supabaseAdmin.from(t).delete().eq("user_id", req.user_id);
      if (e) throw new Error(`Failed to delete ${t}: ${e.message}`);
    }
    const { data: files } = await supabaseAdmin.storage.from("payment-proofs").list(req.user_id);
    if (files?.length) await supabaseAdmin.storage.from("payment-proofs").remove(files.map((f) => `${req.user_id}/${f.name}`));
    await supabaseAdmin.from("deletion_requests").update({ status: "completed", admin_note: data.note ?? null }).eq("id", data.id);
    const { error: authErr } = await supabaseAdmin.auth.admin.deleteUser(req.user_id);
    if (authErr) throw new Error(authErr.message);
    return { ok: true };
  });
