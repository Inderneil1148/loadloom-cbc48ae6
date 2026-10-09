import { useEffect, useRef, useState } from "react";
import logoIcon from "@/assets/loadloom-icon.png";

const SPLASH_KEY = "ll-splash-done";

/**
 * Full-screen branded splash shown once per browser session when the
 * dashboard opens. Plays a logo-in / wordmark / orange-sweep sequence,
 * then dissolves into the dashboard.
 */
export function DashboardSplash() {
  const [phase, setPhase] = useState<"hidden" | "show" | "leaving">("hidden");
  // Decided once; React StrictMode's double effect run re-arms the timers
  // instead of being skipped by the storage check.
  const decided = useRef<boolean | null>(null);

  useEffect(() => {
    if (decided.current === null) {
      try {
        if (sessionStorage.getItem(SPLASH_KEY)) {
          decided.current = false;
        } else {
          sessionStorage.setItem(SPLASH_KEY, "1");
          decided.current = true;
        }
      } catch {
        decided.current = false;
      }
    }
    if (!decided.current) return;
    setPhase("show");
    const t1 = setTimeout(() => setPhase("leaving"), 1750);
    const t2 = setTimeout(() => setPhase("hidden"), 2350);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  if (phase === "hidden") return null;

  return (
    <div
      aria-hidden
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-navy ${
        phase === "leaving" ? "splash-out opacity-0" : "opacity-100"
      }`}
    >
      <img
        src={logoIcon}
        alt=""
        className="splash-icon size-20 rounded-xl shadow-lifted sm:size-24"
      />
      <span className="splash-word mt-5 font-display text-3xl font-extrabold tracking-tight text-navy-foreground sm:text-4xl">
        LoadLoom
      </span>
      <span className="splash-bar mt-3 h-1 w-24 origin-left rounded-full bg-accent" />
      <span className="splash-tagline eyebrow mt-4 text-navy-foreground/70">
        Dispatch Command Centre
      </span>
    </div>
  );
}
