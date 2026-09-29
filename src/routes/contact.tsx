import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SiteShell, PageHeader } from "@/components/site/SiteShell";
import { sendEnquiry } from "@/lib/contact.functions";

export const Route = createFileRoute("/contact")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: "Contact — LoadLoom" },
      {
        name: "description",
        content:
          "Tell us about your yard, your materials and your fleet size, and we will show you how LoadLoom fits.",
      },
      { property: "og:title", content: "Contact — LoadLoom" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      {
        property: "og:description",
        content: "Get in touch about LoadLoom for your construction-material supply business.",
      },
    ],
  }),
  component: Contact,
});

function Contact() {
  const [sending, setSending] = useState(false);

  return (
    <SiteShell>
      <PageHeader
        eyebrow="Contact"
        title="Tell us about your operation"
        lead="Materials, vehicles, daily loads and how you bill today — that is enough for us to be useful."
      />
      <section className="mx-auto w-full max-w-2xl px-5 py-16">
        <form
          className="space-y-5"
          onSubmit={async (e) => {
            e.preventDefault();
            const f = e.currentTarget;
            const fd = new FormData(f);
            setSending(true);
            try {
              await sendEnquiry({ data: {
                name: String(fd.get("name") ?? ""),
                business: String(fd.get("business") ?? ""),
                phone: String(fd.get("phone") ?? ""),
                email: String(fd.get("email") ?? ""),
                message: String(fd.get("message") ?? ""),
              } });
              f.reset();
              toast.success("Thanks — your enquiry has been sent. We'll get back to you soon.");
            } catch {
              toast.error("Couldn't send your enquiry. Please check the details and try again.");
            } finally {
              setSending(false);
            }
          }}
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Your name</Label>
              <Input id="name" name="name" required placeholder="Full name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="business">Business name</Label>
              <Input id="business" name="business" required placeholder="e.g. Shree Sand Suppliers" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" type="tel" required placeholder="10-digit mobile" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required placeholder="you@business.in" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">What do you want to fix first?</Label>
            <Textarea
              id="message"
              name="message"
              rows={5}
              required
              placeholder="Materials you supply, number of vehicles, loads per day, how you invoice today"
            />
          </div>
          <Button type="submit" variant="action" size="lg" disabled={sending}>
            {sending ? "Sending…" : "Send enquiry"}
          </Button>
        </form>
      </section>
    </SiteShell>
  );
}
