import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const Input = z.object({
  task: z.enum(["order", "slip", "summary", "followup"]),
  text: z.string().max(8000).optional(),
  image: z.string().max(8_000_000).optional(),
});

const PROMPTS: Record<z.infer<typeof Input>["task"], string> = {
  order:
    'You convert an Indian construction-material dispatcher\'s spoken or typed note into an order. Reply ONLY with JSON: {"customer_name":string,"site":string,"material":string,"quantity":number,"unit":"tonnes"|"brass"|"cft"|"bags"|"nos"|"trips","rate":number,"delivery_date":"YYYY-MM-DD"|null,"notes":string}. Use 0 or "" when unknown.',
  slip:
    'You read weighbridge slips. Reply ONLY with JSON: {"slip_no":string,"vehicle":string,"material":string,"gross_kg":number,"tare_kg":number,"net_kg":number,"date":string,"party":string}. Use 0 or "" when unreadable.',
  summary:
    "You write a short end-of-day operations summary for a construction-material supplier owner in simple English, 5-8 bullet points, using Indian Rupee formatting. Highlight risks (overdue payments, unassigned orders) and one suggested action.",
  followup:
    "You draft a polite, firm WhatsApp payment follow-up message from a construction-material supplier to a customer. Keep it under 80 words, include the amount due. Reply with only the message.",
};

export const runAiTool = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data, context }) => {
    const { data: sub } = await context.supabase
      .from("subscriptions").select("plan,status").eq("user_id", context.userId).maybeSingle();
    if (!sub || sub.plan !== "fleet" || sub.status === "suspended") {
      return { ok: false as const, error: "AI tools are available on the Fleet plan." };
    }
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) return { ok: false as const, error: "AI is not configured right now." };
    const userContent =
      data.task === "slip" && data.image
        ? [{ type: "text", text: "Read this weighbridge slip." }, { type: "image_url", image_url: { url: data.image } }]
        : data.text ?? "";
    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [{ role: "system", content: PROMPTS[data.task] }, { role: "user", content: userContent }],
        }),
      });
      if (res.status === 429) return { ok: false as const, error: "Too many AI requests. Try again in a minute." };
      if (res.status === 402) return { ok: false as const, error: "AI credits are used up. Please add credits." };
      if (!res.ok) {
        console.error("AI gateway error", res.status, await res.text());
        return { ok: false as const, error: "AI couldn't respond. You can still work normally." };
      }
      const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
      const text = json.choices?.[0]?.message?.content?.trim() ?? "";
      return { ok: true as const, text };
    } catch (e) {
      console.error(e);
      return { ok: false as const, error: "AI couldn't respond. You can still work normally." };
    }
  });
