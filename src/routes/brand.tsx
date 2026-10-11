import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Mail, Youtube } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteShell } from "@/components/site/SiteShell";
import logoIcon from "@/assets/loadloom-icon.png";

export const Route = createFileRoute("/brand")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: "Brand — LoadLoom" },
      {
        name: "description",
        content:
          "The LoadLoom brand: our logo, tagline, story and how to reach us. Materials in, money tracked.",
      },
      { property: "og:title", content: "Brand — LoadLoom" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      {
        property: "og:description",
        content:
          "The LoadLoom brand: our logo, tagline, story and how to reach us. Materials in, money tracked.",
      },
    ],
  }),
  component: Brand,
});

const SWATCHES = [
  { name: "LoadLoom Red", hex: "#e33825", className: "bg-primary text-primary-foreground" },
  { name: "LoadLoom Yellow", hex: "#ffde5f", className: "bg-secondary text-secondary-foreground" },
  { name: "White", hex: "#ffffff", className: "bg-background text-foreground border border-border" },
  { name: "Black", hex: "#000000", className: "bg-navy text-navy-foreground" },
] as const;

function Brand() {
  return (
    <SiteShell>
      {/* Logo + tagline hero */}
      <section className="border-b border-border bg-navy text-navy-foreground">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center px-5 py-16 text-center md:py-24">
          <img
            src={logoIcon}
            alt="LoadLoom logo"
            className="h-24 w-24 rounded-2xl shadow-lg md:h-32 md:w-32"
          />
          <h1 className="mt-6 font-display text-4xl font-extrabold tracking-tight md:text-6xl">
            Load<span className="text-primary">Loom</span>
          </h1>
          <p className="mt-4 inline-block rounded-full bg-secondary px-4 py-1.5 text-sm font-bold text-secondary-foreground">
            Materials in, money tracked.
          </p>
          <p className="mt-6 max-w-2xl text-base text-navy-foreground/70 md:text-lg">
            The operations and money system for construction-material suppliers — every load, every
            vehicle, every rupee, accounted for.
          </p>
        </div>
      </section>

      {/* About */}
      <section className="mx-auto w-full max-w-3xl px-5 py-16">
        <p className="eyebrow text-primary">About</p>
        <h2 className="mt-3 text-2xl font-extrabold md:text-3xl">Built for the yard, not the office</h2>
        <div className="mt-5 space-y-4 text-base leading-relaxed text-muted-foreground">
          <p>
            LoadLoom is made for people who move sand, aggregate, bricks, cement and stone — and who
            need to know what went out, on which vehicle, to which site, and whether it has been
            paid for.
          </p>
          <p>
            Orders, vehicles, deliveries, invoices and payments live in one place, designed
            mobile-first so it works from the weighbridge, the yard or the road. No spreadsheets, no
            lost slips, no guessing what a customer still owes.
          </p>
          <p>
            LoadLoom is a product of The Social INK, India.
          </p>
        </div>
      </section>

      {/* Brand colors */}
      <section className="border-y border-border bg-muted/40">
        <div className="mx-auto w-full max-w-6xl px-5 py-16">
          <p className="eyebrow text-primary">Brand colors</p>
          <h2 className="mt-3 text-2xl font-extrabold md:text-3xl">Four colors, one system</h2>
          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
            {SWATCHES.map((s) => (
              <div
                key={s.hex}
                className={`flex h-32 flex-col justify-end rounded-xl p-4 ${s.className}`}
              >
                <span className="text-sm font-bold">{s.name}</span>
                <span className="text-xs opacity-70">{s.hex}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="mx-auto w-full max-w-3xl px-5 py-16">
        <p className="eyebrow text-primary">Contact</p>
        <h2 className="mt-3 text-2xl font-extrabold md:text-3xl">Talk to us</h2>
        <p className="mt-4 text-base text-muted-foreground">
          Questions about LoadLoom, your plan, or a walkthrough for your team — we read every
          message.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Button asChild variant="action">
            <a href="mailto:inderneilkanagali@gmail.com">
              <Mail className="size-4" /> Email us
            </a>
          </Button>
          <Button asChild variant="outline">
            <Link to="/contact">
              Enquiry form <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button asChild variant="outline">
            <a href="https://youtu.be/2ZTYQlB2caY" target="_blank" rel="noreferrer">
              <Youtube className="size-4" /> Guided walkthrough
            </a>
          </Button>
        </div>
      </section>
    </SiteShell>
  );
}
