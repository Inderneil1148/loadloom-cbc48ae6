import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const schema = z.object({
  name: z.string().trim().min(1).max(100),
  business: z.string().trim().min(1).max(150),
  phone: z.string().trim().min(6).max(20),
  email: z.string().trim().email().max(255),
  message: z.string().trim().min(1).max(2000),
});

export const sendEnquiry = createServerFn({ method: "POST" })
  .inputValidator((d) => schema.parse(d))
  .handler(async ({ data }) => {
    const { sendTemplateEmail } = await import("@/lib/email-templates/send-email");
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const res = await sendTemplateEmail("contact-enquiry", "inderneilkanagali@gmail.com", {
      templateData: data,
      idempotencyKey: `contact-enquiry-${id}`,
      replyTo: data.email,
    });
    return { sent: res.sent };
  });
