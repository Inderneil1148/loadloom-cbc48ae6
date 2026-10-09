import logoIcon from "@/assets/loadloom-icon.png";
import { Link } from "@tanstack/react-router";

export function Logo({ tone = "dark" }: { tone?: "dark" | "light" }) {
  return (
    <Link to="/" className="group inline-flex items-center gap-2.5">
      <img src={logoIcon} alt="" className="h-8 w-8 rounded-sm" />
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
