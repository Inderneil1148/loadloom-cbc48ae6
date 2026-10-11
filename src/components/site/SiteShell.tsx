import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "./Logo";
import { openConsent } from "@/lib/consent";

const NAV = [
  { to: "/features", label: "Features" },
  { to: "/pricing", label: "Pricing" },
  { to: "/demo", label: "Demo" },
  { to: "/download", label: "Download" },
  { to: "/contact", label: "Contact" },
] as const;

function AuthActions({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <Button asChild variant="action" size="sm" onClick={onNavigate}>
      <Link to="/dashboard">Open LoadLoom</Link>
    </Button>
  );
}

export function SiteShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[70] focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:ring-2 focus:ring-ring">
        Skip to content
      </a>
      <header className="sticky top-0 z-50 border-b border-border/80 bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5">
          <Logo />
          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                activeProps={{ className: "text-foreground" }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="hidden items-center gap-2 md:flex">
            <AuthActions />
          </div>
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border md:hidden"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
        {open && (
          <div className="border-t border-border bg-background px-5 pb-5 pt-2 md:hidden">
            <nav className="flex flex-col">
              {NAV.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className="rounded-md px-2 py-3 text-base font-medium text-foreground"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="mt-3 flex flex-col gap-2">
              <AuthActions onNavigate={() => setOpen(false)} />
            </div>
          </div>
        )}
      </header>

      <main id="main" className="flex-1">{children}</main>

      <footer className="border-t border-border bg-navy text-navy-foreground">
        <div className="mx-auto w-full max-w-6xl px-5 py-12">
          <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
            <div className="max-w-xs">
              <Logo tone="light" />
              <p className="mt-3 text-sm text-navy-foreground/65">
                Construction material dispatch and operations OS. Every load. Accounted for.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-8 text-sm sm:grid-cols-3">
              <div className="flex flex-col gap-2">
                <span className="eyebrow text-accent">Product</span>
                <Link to="/features" className="text-navy-foreground/70 hover:text-navy-foreground">
                  Features
                </Link>
                <Link to="/pricing" className="text-navy-foreground/70 hover:text-navy-foreground">
                  Pricing
                </Link>
                <Link to="/demo" className="text-navy-foreground/70 hover:text-navy-foreground">
                  Demo
                </Link>
              </div>
              <div className="flex flex-col gap-2">
                <span className="eyebrow text-accent">Company</span>
                <Link to="/download" className="text-navy-foreground/70 hover:text-navy-foreground">
                  Download the app
                </Link>
                <Link to="/brand" className="text-navy-foreground/70 hover:text-navy-foreground">
                  Brand
                </Link>
                <Link to="/contact" className="text-navy-foreground/70 hover:text-navy-foreground">
                  Contact
                </Link>
                <Link to="/dashboard" className="text-navy-foreground/70 hover:text-navy-foreground">
                  Sign in
                </Link>
              </div>
              <div className="flex flex-col gap-2">
                <span className="eyebrow text-accent">Legal</span>
                <Link to="/privacy" className="text-navy-foreground/70 hover:text-navy-foreground">
                  Privacy
                </Link>
                <Link to="/terms" className="text-navy-foreground/70 hover:text-navy-foreground">
                  Terms
                </Link>
                <Link to="/refund-policy" className="text-navy-foreground/70 hover:text-navy-foreground">
                  Refund Policy
                </Link>
                <Link to="/cookie-policy" className="text-navy-foreground/70 hover:text-navy-foreground">
                  Cookie Policy
                </Link>
                <button type="button" onClick={openConsent} className="text-left text-navy-foreground/70 hover:text-navy-foreground">
                  Cookie settings
                </button>
              </div>
            </div>
          </div>
          <p className="mt-10 border-t border-navy-foreground/10 pt-6 text-xs text-navy-foreground/50">
            © 2026 The Social INK, India · LoadLoom ·{" "}
              <a href="mailto:inderneilkanagali@gmail.com" className="underline">inderneilkanagali@gmail.com</a>
          </p>
        </div>
      </footer>
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  lead,
}: {
  eyebrow: string;
  title: string;
  lead?: string;
}) {
  return (
    <section className="border-b border-border bg-navy text-navy-foreground">
      <div className="mx-auto w-full max-w-6xl px-5 py-14 md:py-20">
        <p className="eyebrow text-accent">{eyebrow}</p>
        <h1 className="mt-3 max-w-3xl text-3xl font-extrabold md:text-5xl">{title}</h1>
        {lead && <p className="mt-4 max-w-2xl text-base text-navy-foreground/70 md:text-lg">{lead}</p>}
      </div>
    </section>
  );
}
