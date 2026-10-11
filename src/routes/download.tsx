import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Apple, Download, Monitor, Share, Smartphone, Clock } from "lucide-react";
import { toast } from "sonner";
import { SiteShell } from "@/components/site/SiteShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { sendEnquiry } from "@/lib/contact.functions";

const TITLE = "Download LoadLoom — Mac, Windows, Android & iPhone";
const DESC = "Get the LoadLoom app for Mac, Windows PC and Android, or add it to your iPhone home screen. No app store needed.";

export const Route = createFileRoute("/download")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://loadloom.online/download" }],
  }),
  component: DownloadPage,
});

const dl = (f: string) => `/api/public/download/${f}`;

function Card({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col rounded-lg border border-border bg-card p-5 shadow-panel">
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-md bg-secondary text-secondary-foreground">{icon}</span>
        <h2 className="text-lg font-bold">{title}</h2>
      </div>
      <div className="mt-4 flex flex-1 flex-col gap-3 text-sm text-muted-foreground">{children}</div>
    </div>
  );
}

function Steps({ items }: { items: string[] }) {
  return <ol className="list-decimal space-y-1 pl-5">{items.map((s) => <li key={s}>{s}</li>)}</ol>;
}

function DownloadPage() {
  return (
    <SiteShell>
      <section className="border-b border-border bg-navy text-navy-foreground">
        <div className="mx-auto w-full max-w-6xl px-5 py-12 md:py-16">
          <p className="eyebrow text-accent">Get the app</p>
          <h1 className="mt-2 text-3xl font-extrabold md:text-5xl">LoadLoom on every device</h1>
          <p className="mt-3 max-w-2xl text-sm text-navy-foreground/70 md:text-base">
            Download for Mac, Windows or Android, or add it to your iPhone. No app store needed. Sign in with your
            usual account; your data and plan are the same everywhere, and updates arrive automatically.
          </p>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-4 px-5 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <Card icon={<Apple className="size-5" />} title="Mac">
          <Button asChild variant="action"><a href={dl("LoadLoom-mac-apple-silicon.zip")}><Download /> Apple Silicon (M1–M4)</a></Button>
          <Button asChild variant="outline"><a href={dl("LoadLoom-mac-intel.zip")}><Download /> Intel Mac</a></Button>
          <Steps items={["Open the downloaded .zip.", "Drag LoadLoom into Applications.", "First time only: right-click LoadLoom → Open → Open."]} />
          <p className="text-xs">Not sure which Mac? Apple menu → About This Mac. "Chip: Apple M…" means Apple Silicon.</p>
        </Card>
        <Card icon={<Monitor className="size-5" />} title="Windows PC">
          <Button asChild variant="action"><a href={dl("LoadLoom-windows.zip")}><Download /> Windows 10 / 11</a></Button>
          <Steps items={["Right-click the .zip → Extract All.", "Open the folder and run LoadLoom.exe.", "If Windows shows \"protected your PC\": More info → Run anyway."]} />
          <p className="text-xs">Tip: right-click LoadLoom.exe → Pin to taskbar.</p>
        </Card>
        <Card icon={<Smartphone className="size-5" />} title="Android">
          <Button asChild variant="action"><a href={dl("LoadLoom.apk")}><Download /> Download APK</a></Button>
          <Steps items={["Open the downloaded LoadLoom.apk.", "If asked, allow your browser to install unknown apps.", "Tap Install, then Open."]} />
        </Card>
        <Card icon={<Share className="size-5" />} title="iPhone & iPad">
          <Steps items={["Open loadloom.online in Safari.", "Tap the Share button.", "Tap \"Add to Home Screen\", then Add.", "Open LoadLoom from your home screen."]} />
          <p className="text-xs">Apple only allows app files through the App Store, so iPhone uses this full-screen home-screen app.</p>
        </Card>
      </section>

      <DownloadContact />
    </SiteShell>
  );
}

function DownloadContact() {
  const send = useServerFn(sendEnquiry);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    try {
      await send({ data: {
        name: String(f.get("name")), email: String(f.get("email")), phone: String(f.get("phone")),
        business: String(f.get("business") || "Download page query"),
        message: `[Download page] ${String(f.get("message"))}`,
      } });
      setDone(true);
    } catch {
      toast.error("Couldn't send. Please check your details and try again.");
    } finally { setBusy(false); }
  }
  return (
    <section className="border-t border-border bg-muted/40">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-5 py-12 md:grid-cols-2">
        <div>
          <p className="eyebrow text-accent">Need help?</p>
          <h2 className="mt-2 text-2xl font-bold md:text-3xl">Questions about installing?</h2>
          <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground"><Clock className="size-4 text-accent" /> We reply within 24 hours.</p>
        </div>
        {done ? (
          <p className="rounded-lg border border-border bg-card p-6 text-sm font-semibold">Thanks! We've got your message and will reply within 24 hours.</p>
        ) : (
          <form onSubmit={onSubmit} className="grid gap-3 rounded-lg border border-border bg-card p-5 shadow-panel">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5"><Label htmlFor="d-name">Name</Label><Input id="d-name" name="name" required maxLength={100} /></div>
              <div className="space-y-1.5"><Label htmlFor="d-phone">Phone</Label><Input id="d-phone" name="phone" type="tel" required minLength={6} maxLength={20} /></div>
            </div>
            <div className="space-y-1.5"><Label htmlFor="d-email">Email</Label><Input id="d-email" name="email" type="email" required maxLength={255} /></div>
            <div className="space-y-1.5"><Label htmlFor="d-msg">Your question</Label><Textarea id="d-msg" name="message" required maxLength={1900} rows={4} /></div>
            <p className="text-xs text-muted-foreground">We use these details only to reply to you. See our Privacy Policy.</p>
            <Button type="submit" variant="action" disabled={busy}>{busy ? "Sending…" : "Send message"}</Button>
          </form>
        )}
      </div>
    </section>
  );
}
