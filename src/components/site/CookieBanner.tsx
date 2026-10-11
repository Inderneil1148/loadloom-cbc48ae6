import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CONSENT_EVENT, getConsent, loadOptionalScripts, setConsent, type Consent } from "@/lib/consent";

export function CookieBanner() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const c = getConsent();
    if (c === "all") loadOptionalScripts();
    if (!c) setOpen(true);
    const show = () => setOpen(true);
    window.addEventListener(CONSENT_EVENT, show);
    return () => window.removeEventListener(CONSENT_EVENT, show);
  }, []);

  if (!open) return null;
  const choose = (v: Consent) => {
    setConsent(v);
    setOpen(false);
  };

  return (
    <div
      role="dialog"
      aria-label="Cookie preferences"
      className="fixed inset-x-3 bottom-3 z-[60] mx-auto max-w-xl rounded-xl border border-border bg-card p-4 text-card-foreground shadow-2xl"
    >
      <button
        type="button"
        aria-label="Close and keep essential cookies only"
        onClick={() => choose("essential")}
        className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary"
      >
        <X className="size-4" />
      </button>
      <p className="pr-8 text-sm font-semibold">We use cookies</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Essential cookies keep you signed in. With your permission we also use Google Analytics and
        Google AdSense. See our{" "}
        <Link to="/cookie-policy" className="font-medium text-foreground underline">
          Cookie Policy
        </Link>
        .
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <Button variant="action" size="sm" onClick={() => choose("all")}>Accept all</Button>
        <Button variant="outline" size="sm" onClick={() => choose("essential")}>Essential only</Button>
      </div>
    </div>
  );
}
