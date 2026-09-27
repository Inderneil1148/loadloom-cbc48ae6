import { Link } from "@tanstack/react-router";

export function Logo({ tone = "dark" }: { tone?: "dark" | "light" }) {
  return (
    <Link to="/" className="group inline-flex items-center gap-2.5">
      <span className="relative flex h-8 w-8 items-center justify-center rounded-sm bg-accent">
        <span className="h-3.5 w-3.5 border-2 border-accent-foreground" />
        <span className="absolute bottom-1 right-1 h-1.5 w-1.5 bg-accent-foreground" />
      </span>
      <span
        className={`font-display text-lg font-extrabold tracking-tight ${
          tone === "light" ? "text-navy-foreground" : "text-foreground"
        }`}
      >
        LoadLoom
      </span>
    </Link>
  );
}
