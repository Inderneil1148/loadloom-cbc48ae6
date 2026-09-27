import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Building2, Lock, Mail } from "lucide-react";
import { useSession } from "@/hooks/use-session";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): { mode?: "signup" } =>
    search["mode"] === "signup" ? { mode: "signup" } : {},

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
  const { mode } = Route.useSearch();
  const navigate = useNavigate();
  const { session, loading } = useSession();
  const [isSignUp, setIsSignUp] = useState(mode === "signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [busy, setBusy] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);

  useEffect(() => {
    if (!loading && session) navigate({ to: "/dashboard", replace: true });
  }, [loading, session, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { business_name: businessName },
          },
        });
        if (error) throw error;
        if (!data.session) {
          setCheckEmail(true);
          return;
        }
        navigate({ to: "/dashboard", replace: true });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/dashboard", replace: true });
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setBusy(false);
      toast.error("Google sign-in didn't complete. Try again.");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/dashboard", replace: true });
  }

  const field =
    "h-11 border-navy-foreground/15 bg-navy-foreground/5 pl-10 text-navy-foreground placeholder:text-navy-foreground/35";

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy px-4 py-12 text-navy-foreground">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-lg bg-accent text-lg font-extrabold text-accent-foreground shadow-lg shadow-accent/30">
              LL
            </span>
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
              <Button
                type="button"
                variant="onNavy"
                size="lg"
                className="w-full"
                onClick={handleGoogle}
                disabled={busy}
              >
                <GoogleIcon /> Continue with Google
              </Button>

              <div className="my-6 flex items-center gap-3">
                <span className="h-px flex-1 bg-navy-foreground/10" />
                <span className="text-xs text-navy-foreground/50">Or use email</span>
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

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
    </svg>
  );
}
