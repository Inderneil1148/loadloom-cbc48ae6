import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import type { AuthError } from "@supabase/supabase-js";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Building2, Lock, Mail } from "lucide-react";
import logoIcon from "@/assets/loadloom-icon.png";
import { useSession } from "@/hooks/use-session";
import { landingFor } from "@/lib/landing";
import { confirmPendingAccount, createAccount } from "@/lib/auth.functions";

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

function isEmailNotConfirmed(error: AuthError | null) {
  if (!error) return false;
  return error.code === "email_not_confirmed" || /not confirmed/i.test(error.message ?? "");
}

function AuthPage() {
  const { mode, next } = Route.useSearch();
  const navigate = useNavigate();
  const { session, loading } = useSession();
  const [isSignUp, setIsSignUp] = useState(mode === "signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (loading || !session) return;
    if (next) {
      window.location.href = next;
      return;
    }
    landingFor(session).then((to) => navigate({ to, replace: true }));
  }, [loading, session, navigate, next]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    // Emails are matched case-insensitively, so always send the same form.
    const cleanEmail = email.trim().toLowerCase();
    try {
      if (isSignUp) {
        // Account is created already confirmed, then signed in right away: no
        // confirmation email is sent and nothing is left for the user to click.
        const created = await createAccount({
          data: { email: cleanEmail, password, businessName },
        });
        const signIn = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });
        if (signIn.error) {
          if (created.status === "existing") {
            setIsSignUp(false);
            toast.error(
              "That email already has an account. Sign in with its existing password instead.",
            );
            return;
          }
          throw signIn.error;
        }
        if (next) {
          window.location.href = next;
          return;
        }
        navigate({ to: "/choose-plan", replace: true });
        return;
      }

      const attempt = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
      if (!attempt.error) return; // the session effect above sends them on
      if (isEmailNotConfirmed(attempt.error)) {
        // Older account created while confirmation emails were switched on:
        // activate it now instead of leaving the person stuck with no email.
        const activated = await confirmPendingAccount({ data: { email: cleanEmail } }).catch(
          () => null,
        );
        if (activated?.confirmed) {
          const retry = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password,
          });
          if (!retry.error) return;
          throw retry.error;
        }
      }
      throw attempt.error;
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
            <img src={logoIcon} alt="LoadLoom" className="h-11 w-11 rounded-lg shadow-lg shadow-accent/30" />
            <div className="text-left leading-none">
              <p className="text-2xl font-extrabold">LoadLoom</p>
              <p className="mt-1 text-[10px] font-bold tracking-[0.2em] text-accent">DISPATCH OS</p>
            </div>
          </div>
          <h1 className="mt-6 text-xl font-bold">
            {isSignUp ? "Create your business account" : "Sign in to dispatch OS"}
          </h1>
          <p className="mt-1 text-sm text-navy-foreground/60">Every Load. Accounted For.</p>
        </div>

        <div className="mt-8 rounded-2xl border border-navy-foreground/10 bg-navy-foreground/[0.03] p-6 shadow-2xl sm:p-8">
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
            {isSignUp && (
              <>
                <p className="rounded-lg border border-accent/25 bg-accent/10 px-3 py-2 text-xs text-navy-foreground/75">
                  No email confirmation needed — your account is ready as soon as you tap Create
                  account.
                </p>
                <label className="flex items-start gap-2 text-sm text-navy-foreground/80">
                  <input type="checkbox" required className="mt-1 h-4 w-4 accent-[var(--accent)]" />
                  <span>
                    I am 18 or older and agree to the{" "}
                    <a href="/terms" target="_blank" className="underline">
                      Terms
                    </a>{" "}
                    and{" "}
                    <a href="/privacy" target="_blank" className="underline">
                      Privacy Policy
                    </a>
                    .
                  </span>
                </label>
              </>
            )}
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
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}/auth`,
    });
    if (error) toast.error(error.message);
    else toast.success("Password reset link sent. Check your inbox.");
  }
}
