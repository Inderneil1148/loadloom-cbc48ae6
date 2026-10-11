import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * LoadLoom does not send confirmation emails, so accounts are created already
 * confirmed and people are signed straight in with the email + password they typed.
 * These functions use the service-role client because only the admin API can skip
 * the "confirm your email" step.
 */

const emailField = z
  .string()
  .trim()
  .min(3)
  .max(255)
  .email()
  .transform((value) => value.toLowerCase());

const signUpSchema = z.object({
  email: emailField,
  password: z.string().min(8).max(72),
  businessName: z.string().trim().max(150).optional(),
});

export const createAccount = createServerFn({ method: "POST" })
  .inputValidator((input) => signUpSchema.parse(input))
  .handler(async ({ data }) => {
    const supabaseAdmin = await adminClient();

    const created = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      // No confirmation email is sent; the account is usable right away.
      email_confirm: true,
      user_metadata: { business_name: data.businessName ?? "", requested_plan: "free" },
    });
    if (!created.error) return { status: "created" as const };

    // The email already has an account. If it was created back when confirmation
    // emails were on and was never confirmed, activate it now so the password they
    // typed can sign them in. Confirming never changes a password, so this cannot
    // hand an account to someone who does not already know it.
    const existing = await findUserByEmail(supabaseAdmin, data.email);
    if (!existing) throw new Error(created.error.message);
    if (!existing.confirmed) {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(existing.id, {
        email_confirm: true,
      });
      if (error) throw new Error(error.message);
    }
    return { status: "existing" as const };
  });

/**
 * Signs in accounts that were left unconfirmed while confirmation emails were enabled.
 * Only called after Supabase rejects a correct email + password with "email not confirmed".
 */
export const confirmPendingAccount = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ email: emailField }).parse(input))
  .handler(async ({ data }) => {
    const supabaseAdmin = await adminClient();
    const existing = await findUserByEmail(supabaseAdmin, data.email);
    if (!existing || existing.confirmed) return { confirmed: Boolean(existing) };

    const { error } = await supabaseAdmin.auth.admin.updateUserById(existing.id, {
      email_confirm: true,
    });
    if (error) throw new Error(error.message);
    return { confirmed: true };
  });

type SupabaseAdmin = (typeof import("@/integrations/supabase/client.server"))["supabaseAdmin"];

/** Service-role client, with a readable error if the server key is not configured. */
async function adminClient(): Promise<SupabaseAdmin> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    void supabaseAdmin.auth; // touching the proxy surfaces a missing key here, not mid-flow
    return supabaseAdmin;
  } catch (error) {
    console.error("[auth] Supabase service-role client unavailable:", error);
    throw new Error("Account creation is temporarily unavailable. Please try again shortly.");
  }
}

async function findUserByEmail(
  db: SupabaseAdmin,
  email: string,
): Promise<{ id: string; confirmed: boolean } | null> {
  const target = email.toLowerCase();
  const perPage = 1000;
  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage });
    if (error) throw new Error(error.message);
    const users = data?.users ?? [];
    const match = users.find((user) => (user.email ?? "").toLowerCase() === target);
    if (match) return { id: match.id, confirmed: Boolean(match.email_confirmed_at) };
    if (users.length < perPage) return null;
  }
  return null;
}
