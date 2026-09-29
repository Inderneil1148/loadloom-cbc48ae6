import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const NAMES: Record<string, string> = { starter: "Starter", growth: "Growth", fleet: "Fleet" };

const schema = z.object({
  plan: z.enum(["starter", "growth", "fleet"]),
  reference: z.string().trim().max(100).optional().default(""),
  screenshotPath: z.string().min(3).max(300),
});

export const submitPlanPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => schema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    if (!data.screenshotPath.startsWith(`${userId}/`)) throw new Error("Invalid screenshot");

    const [{ data: setting }, { data: sub }] = await Promise.all([
      supabase.from("plan_settings").select("price").eq("plan", data.plan).maybeSingle(),
      supabase.from("subscriptions").select("email, business_name").eq("user_id", userId).maybeSingle(),
    ]);
    const amount = Number(setting?.price ?? 0);
    const email = sub?.email ?? (context.claims as { email?: string }).email ?? null;

    const { data: row, error } = await supabase
      .from("plan_payments")
      .insert({ user_id: userId, plan: data.plan, amount, reference: data.reference || null, screenshot_path: data.screenshotPath, email })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    const { error: rpcError } = await supabase.rpc("request_plan", { _plan: data.plan });
    if (rpcError) console.error("request_plan failed", rpcError);

    const amountText = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
    const templateData = { planName: NAMES[data.plan], amount: amountText, reference: data.reference, email, business: sub?.business_name };
    try {
      const { sendTemplateEmail } = await import("@/lib/email-templates/send-email");
      if (email) {
        await sendTemplateEmail("payment-received", email, { templateData, idempotencyKey: `payment-received-${row.id}` });
      }
      await sendTemplateEmail("payment-admin-alert", "inderneilkanagali@gmail.com", { templateData, idempotencyKey: `payment-admin-alert-${row.id}` });
    } catch (e) {
      console.error("Payment email failed", e);
    }
    return { ok: true };
  });
