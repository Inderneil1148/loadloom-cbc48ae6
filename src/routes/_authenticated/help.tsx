import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ImagePlus, Loader2, Sparkles, X } from "lucide-react";
import { AppPage } from "@/components/app/PlanGate";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { diagnoseProblem } from "@/lib/troubleshoot.functions";

export const Route = createFileRoute("/_authenticated/help")({
  staticData: { sitemap: false },
  head: () => ({ meta: [
    { title: "Fix a problem — LoadLoom" }, { name: "description", content: "Upload an error screenshot and get likely causes and next steps." },
    { property: "og:title", content: "Fix a problem — LoadLoom" }, { property: "og:description", content: "AI help for errors inside LoadLoom." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" },
  ] }),
  component: Help,
});

function Help() {
  const run = useServerFn(diagnoseProblem);
  const [page, setPage] = useState("");
  const [desc, setDesc] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [answer, setAnswer] = useState("");
  const [err, setErr] = useState("");

  const pick = (f?: File) => {
    setErr("");
    if (!f) return;
    if (!f.type.startsWith("image/")) return setErr("Please choose an image file.");
    if (f.size > 5 * 1024 * 1024) return setErr("Screenshot must be under 5 MB.");
    const r = new FileReader();
    r.onload = () => setImage(String(r.result));
    r.readAsDataURL(f);
  };

  const submit = async () => {
    if (desc.trim().length < 5) return setErr("Tell us a little about what you were doing.");
    setBusy(true); setErr(""); setAnswer("");
    try {
      const res = await run({ data: { description: desc, page, image: image ?? undefined } });
      if (res.ok) setAnswer(res.text); else setErr(res.error);
    } catch {
      setErr("Something went wrong. Please try again.");
    } finally { setBusy(false); }
  };

  return (
    <AppPage eyebrow="Support" title="Fix a problem" description="Share a screenshot of the error and what you were doing. We'll suggest likely causes and what to try next.">
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="space-y-4 rounded-md border border-border bg-card p-4 shadow-panel">
          <div className="space-y-1.5"><Label htmlFor="pg">Which page? (optional)</Label><Input id="pg" placeholder="e.g. Orders, Dispatch Board" value={page} onChange={(e) => setPage(e.target.value)} /></div>
          <div className="space-y-1.5"><Label htmlFor="ds">What were you doing?</Label><Textarea id="ds" rows={5} placeholder="e.g. I tapped Confirm & Authorize Dispatch and the screen went blank" value={desc} onChange={(e) => setDesc(e.target.value)} /></div>
          <div className="space-y-1.5">
            <Label>Error screenshot (optional)</Label>
            {image ? (
              <div className="relative">
                <img src={image} alt="Your screenshot" className="max-h-64 w-full rounded-md border border-border object-contain bg-muted" />
                <Button size="icon" variant="outline" className="absolute right-2 top-2" aria-label="Remove screenshot" onClick={() => setImage(null)}><X /></Button>
              </div>
            ) : (
              <label className="flex cursor-pointer flex-col items-center gap-2 rounded-md border border-dashed border-border p-6 text-sm text-muted-foreground hover:bg-muted">
                <ImagePlus className="size-6" /> Tap to add a screenshot
                <input type="file" accept="image/*" className="sr-only" onChange={(e) => pick(e.target.files?.[0])} />
              </label>
            )}
          </div>
          {err && <p className="text-sm text-destructive">{err}</p>}
          <Button variant="action" className="w-full" disabled={busy} onClick={submit}>{busy ? <><Loader2 className="animate-spin" /> Checking…</> : <><Sparkles /> Find the cause</>}</Button>
        </div>
        <div className="rounded-md border border-border bg-card p-4 shadow-panel">
          <p className="eyebrow">Suggestions</p>
          {busy && <p className="mt-3 text-sm text-muted-foreground">Looking at your problem — this can take a few seconds…</p>}
          {!busy && !answer && <p className="mt-3 text-sm text-muted-foreground">Your likely causes and next steps will show here.</p>}
          {answer && <div className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">{renderBold(answer)}</div>}
        </div>
      </div>
    </AppPage>
  );
}

function renderBold(t: string) {
  return t.split(/(\*\*[^*]+\*\*)/g).map((p, i) => p.startsWith("**") ? <strong key={i} className="font-bold">{p.slice(2, -2)}</strong> : p);
}
