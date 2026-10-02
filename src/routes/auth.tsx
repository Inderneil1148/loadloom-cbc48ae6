import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Building2, Lock, Mail } from "lucide-react";
import { lovable } from "@/integrations/lovable";
import logoIcon from "@/assets/loadloom-icon.png.asset.json";
import { useSession } from "@/hooks/use-session";
import { planPickedKey } from "@/hooks/use-plan-payment";
import { DEMO_EMAIL } from "@/lib/demo";

export const Route = createFileRoute("/auth")({
  staticData: { sitemap: false },
  validateSearch: (search: Record<string, unknown>): { mode?: "signup"; next?: string } => {
    const n = search["next"];
    const next = typeof n === "string" && n.startsWith("/") && !n.startsWith("//") ? n : undefined;
    return { ...(search["mode"] === "signup" ? { mode: "signup" as const } : {}), ...(next ? { next } : {}) };
  },

  head: () => ({
    meta: [
      { title: "Sign in — LoadLoom" },
      {
        name: "description",
        content: "Sign in to LoadLoom or create an account for your construction-material business.",
      },
      { property: "og:title", content: "Sign in — LoadLoom" },
      { property: "og:description", content: "Access your LoadLoom dispatch and operations account." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { mode, next } = Route.useSearch();
  const navigate = useNavigate();
  const { session, loading } = useSession();
  const [isSignUp, setIsSignUp] = useState(mode === "signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [busy, setBusy] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);
  const returnUrl = () => (next ? `${window.location.origin}/auth?next=${encodeURIComponent(next)}` : `${window.location.origin}/auth`);

  useEffect(() => {
    if (loading || !session) return;
    if (next) { window.location.href = next; return; }
    const u = session.user;
    const isNew = Date.now() - new Date(u.created_at).getTime() < 7 * 86400_000;
    const picked = localStorage.getItem(planPickedKey(u.id));
    navigate({ to: isNew && !picked && u.email !== DEMO_EMAIL ? "/choose-plan" : "/dashboard", replace: true });
  }, [loading, session, navigate, next]);

  async function handleOAuth(provider: "google" | "apple") {
    setBusy(true);
    try {
      const result = await lovable.auth.signInWithOAuth(provider, {
        redirect_uri: returnUrl(),
      });
      if (result.error) throw result.error;
      // redirected: browser is leaving for the provider — nothing to do
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong. Try again.");
      setBusy(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: returnUrl(),
            data: { business_name: businessName, requested_plan: "free" },
          },
        });
        if (error) throw error;
        if (!data.session) {
          setCheckEmail(true);
          return;
        }
        if (next) { window.location.href = next; return; }
        navigate({ to: "/choose-plan", replace: true });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (next) { window.location.href = next; return; }
        navigate({ to: "/dashboard", replace: true });
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }

  const field =
    "h-11 border-navy-foreground/15 bg-navy-foreground/5 pl-10 text-navy-foreground placeholder:text-navy-foreground/35";

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy px-4 py-12 text-navy-foreground">
      <div className="w-full max-w-lg">
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center gap-3">
            <img src={logoIcon.url} alt="LoadLoom" className="h-11 w-11 rounded-lg shadow-lg shadow-accent/30" />
            <div className="text-left leading-none">
              <p className="text-2xl font-extrabold">LoadLoom</p>
              <p className="mt-1 text-[10px] font-bold tracking-[0.2em] text-accent">DISPATCH OS</p>
            </div>
          </div>
          <h1 className="mt-6 text-xl font-bold">
            {checkEmail ? "Confirm your email" : isSignUp ? "Create your business account" : "Sign in to dispatch OS"}
          </h1>
          <p className="mt-1 text-sm text-navy-foreground/60">Every Load. Accounted For.</p>
        </div>

        <div className="mt-8 rounded-2xl border border-navy-foreground/10 bg-navy-foreground/[0.03] p-6 shadow-2xl sm:p-8">
          {checkEmail ? (
            <div className="text-center">
              <p className="text-sm text-navy-foreground/70">
                We sent a confirmation link to <span className="font-semibold text-navy-foreground">{email}</span>.
                Open it to activate your account.
              </p>
              <Button
                variant="onNavy"
                className="mt-6 w-full"
                onClick={() => {
                  setCheckEmail(false);
                  setIsSignUp(false);
                }}
              >
                Back to sign in
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                <Button
                  type="button"
                  variant="onNavy"
                  size="lg"
                  className="w-full"
                  disabled={busy}
                  onClick={() => handleOAuth("google")}
                >
                  <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
                    <path fill="#4285F4" d="M23.5 12.27c0-.85-.08-1.66-.22-2.45H12v4.64h6.45a5.52 5.52 0 0 1-2.39 3.62v3h3.87c2.26-2.09 3.57-5.16 3.57-8.81Z" />
                    <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.87-3c-1.07.72-2.44 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.29v3.1A12 12 0 0 0 12 24Z" />
                    <path fill="#FBBC05" d="M5.27 14.28A7.2 7.2 0 0 1 4.89 12c0-.79.14-1.56.38-2.28v-3.1H1.29a12 12 0 0 0 0 10.76l3.98-3.1Z" />
                    <path fill="#EA4335" d="M12 4.76c1.76 0 3.34.61 4.58 1.8l3.44-3.44A11.97 11.97 0 0 0 12 0 12 12 0 0 0 1.29 6.62l3.98 3.1C6.22 6.87 8.87 4.76 12 4.76Z" />
                  </svg>
                  Continue with Google
                </Button>
                <Button
                  type="button"
                  variant="onNavy"
                  size="lg"
                  className="w-full"
                  disabled={busy}
                  onClick={() => handleOAuth("apple")}
                >
                  <svg viewBox="0 0 24 24" className="size-5 fill-current" aria-hidden="true">
                    <path d="M17.05 12.54c-.03-2.89 2.36-4.27 2.47-4.34-1.35-1.97-3.44-2.24-4.18-2.27-1.78-.18-3.47 1.05-4.37 1.05-.9 0-2.29-1.02-3.77-1-1.94.03-3.72 1.13-4.72 2.86-2.01 3.49-.51 8.66 1.45 11.5.96 1.39 2.1 2.95 3.6 2.89 1.45-.06 2-.94 3.75-.94s2.25.94 3.78.91c1.56-.03 2.55-1.41 3.5-2.81 1.1-1.61 1.55-3.17 1.58-3.25-.04-.02-3.03-1.16-3.09-4.6ZM14.15 4.06c.8-.97 1.34-2.31 1.19-3.66-1.15.05-2.55.77-3.38 1.74-.74.86-1.39 2.23-1.22 3.55 1.29.1 2.6-.65 3.41-1.63Z" />
                  </svg>
                  Continue with Apple
                </Button>
              </div>
              {isSignUp && (
                <p className="mt-3 text-center text-xs text-navy-foreground/50">
                  You'll choose your plan on the next step.
                </p>
              )}
              <div className="my-5 flex items-center gap-3 text-xs text-navy-foreground/45">
                <span className="h-px flex-1 bg-navy-foreground/10" />
                or continue with email
                <span className="h-px flex-1 bg-navy-foreground/10" />
              </div>
              <form className="space-y-4" onSubmit={handleSubmit}>
                {isSignUp && (
                  <div className="space-y-2">
                    <Label htmlFor="business">Business name</Label>
                    <div className="relative">
                      <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-foreground/40" />
                      <Input
                        id="business"
                        required
                        className={field}
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        placeholder="e.g. Shree Sand Suppliers"
                      />
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-foreground/40" />
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      required
                      className={field}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="operations@yourcompany.com"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    {!isSignUp && (
                      <button type="button" onClick={handleForgot} className="text-xs text-accent hover:underline">
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-foreground/40" />
                    <Input
                      id="password"
                      type="password"
                      autoComplete={isSignUp ? "new-password" : "current-password"}
                      required
                      minLength={8}
                      className={field}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                  </div>
                </div>
                <Button type="submit" variant="action" size="lg" className="w-full shadow-lg shadow-accent/25" disabled={busy}>
                  {busy ? "Please wait…" : isSignUp ? "Create account" : "Sign in to Operations"}
                  {!busy && <ArrowRight />}
                </Button>
              </form>

              <p className="mt-6 border-t border-navy-foreground/10 pt-5 text-center text-sm text-navy-foreground/60">
                {isSignUp ? "Already have an account?" : "New business to LoadLoom?"}{" "}
                <button
                  type="button"
                  className="font-semibold text-accent hover:underline"
                  onClick={() => setIsSignUp((v) => !v)}
                >
                  {isSignUp ? "Sign in" : "Create an account"}
                </button>
              </p>
            </>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-navy-foreground/45">
          <Link to="/" className="hover:underline">
            Back to website
          </Link>
        </p>
      </div>
    </div>
  );

  async function handleForgot() {
    if (!email) {
      toast.error("Enter your email address first.");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth`,
    });
    if (error) toast.error(error.message);
    else toast.success("Password reset link sent. Check your inbox.");
  }
}
