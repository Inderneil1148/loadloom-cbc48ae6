import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const Input = z.object({
  description: z.string().trim().min(5).max(4000),
  page: z.string().max(200).optional(),
  image: z.string().regex(/^data:image\/(png|jpe?g|webp|gif);base64,/).max(8_000_000).optional(),
});

const SYSTEM = `You are LoadLoom's in-app support helper. LoadLoom is a web app for Indian construction-material suppliers (orders, dispatch board, trucks, drivers, deliveries, invoices, payments, plans paid by UPI with admin approval, read-only demo mode).
A user shares what they were doing and possibly an error screenshot. Reply in simple, friendly English (no code, no jargon) using exactly these sections in Markdown:
**What the screenshot shows** (1-2 lines; say "No screenshot" if none)
**Likely causes** (2-4 bullets, most likely first)
**Try these steps** (numbered, practical: refresh, check internet, check required fields, plan limits, demo mode is read-only, sign out/in, etc.)
**If it still happens** (one line: use Contact page and include the screenshot).
Keep it under 220 words. Never ask for passwords.`;

export const diagnoseProblem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data }) => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) return { ok: false as const, error: "The helper isn't set up right now." };
    const content: Array<Record<string, string>> = [
      { type: "input_text", text: `Page: ${data.page || "not given"}\nWhat I was doing: ${data.description}` },
    ];
    if (data.image) content.push({ type: "input_image", image_url: data.image });
    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
        method: "POST",
        headers: { "Lovable-API-Key": key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", "X-Lovable-AIG-SDK": "fetch" },
        body: JSON.stringify({
          model: "openai/gpt-6-astra",
          stream: true,
          store: false,
          reasoning: { effort: "low" },
          instructions: SYSTEM,
          input: [{ role: "user", content }],
        }),
      });
      if (res.status === 429) return { ok: false as const, error: "Too many requests. Please try again in a minute." };
      if (res.status === 402) return { ok: false as const, error: "AI credits are used up. Please contact support." };
      if (res.status === 403) return { ok: false as const, error: "The helper can't answer this request." };
      if (!res.ok || !res.body) {
        console.error("AI gateway error", res.status, await res.text());
        return { ok: false as const, error: "The helper couldn't respond. Please try again later." };
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "", text = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data:")) continue;
          const raw = line.slice(5).trim();
          if (!raw || raw === "[DONE]") continue;
          try {
            const ev = JSON.parse(raw) as { type?: string; delta?: string };
            if (ev.type === "response.output_text.delta" && ev.delta) text += ev.delta;
            if (ev.type === "response.failed" || ev.type === "error") {
              return { ok: false as const, error: "The helper couldn't respond. Please try again later." };
            }
          } catch { /* partial frame */ }
        }
      }
      if (!text.trim()) return { ok: false as const, error: "The helper couldn't answer this one. Please use the Contact page." };
      return { ok: true as const, text: text.trim() };
    } catch (e) {
      console.error(e);
      return { ok: false as const, error: "The helper couldn't respond. Please try again later." };
    }
  });
