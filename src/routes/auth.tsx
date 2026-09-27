import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/site/Logo";
import { useSession } from "@/hooks/use-session";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>) => ({
    mode: search.mode === "signup" ? ("signup" as const) : ("signin" as const),
  }),
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

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-navy p-12 text-navy-foreground lg:flex">
        <Logo tone="light" />
        <div>
          <p className="eyebrow text-accent">Construction Material Dispatch &amp; Operations OS</p>
          <h1 className="mt-4 text-4xl font-extrabold leading-tight">
            Every Load.
            <br />
            Accounted For.
          </h1>
          <p className="mt-4 max-w-sm text-navy-foreground/65">
            Orders, trucks, deliveries, proof, invoices and payments — from one system your whole team
            can use.
          </p>
        </div>
        <p className="text-xs text-navy-foreground/45">
          From order to delivery, without the WhatsApp chaos.
        </p>
      </div>

      <div className="flex items-center justify-center bg-background px-5 py-14">
        <div className="w-full max-w-sm">
          <div className="lg:hidden">
            <Logo />
          </div>

          {checkEmail ? (
            <div className="mt-8">
              <h2 className="text-2xl font-bold">Confirm your email</h2>
              <p className="mt-3 text-sm text-muted-foreground">
                We sent a confirmation link to <span className="font-semibold">{email}</span>. Open it
                to activate your LoadLoom account.
              </p>
              <Button
                variant="outline"
                className="mt-6"
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
              <h2 className="mt-8 text-2xl font-bold lg:mt-0">
                {isSignUp ? "Create your account" : "Sign in to LoadLoom"}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {isSignUp
                  ? "Set up your business and start putting loads on record."
                  : "Welcome back. Pick up where the yard left off."}
              </p>

              <Button
                variant="outline"
                size="lg"
                className="mt-7 w-full"
                onClick={handleGoogle}
                disabled={busy}
              >
                Continue with Google
              </Button>

              <div className="my-6 flex items-center gap-3">
                <span className="h-px flex-1 bg-border" />
                <span className="text-xs text-muted-foreground">or use email</span>
                <span className="h-px flex-1 bg-border" />
              </div>

              <form className="space-y-4" onSubmit={handleSubmit}>
                {isSignUp && (
                  <div className="space-y-2">
                    <Label htmlFor="business">Business name</Label>
                    <Input
                      id="business"
                      required
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="e.g. Shree Sand Suppliers"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@business.in"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete={isSignUp ? "new-password" : "current-password"}
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                  />
                </div>
                <Button type="submit" variant="action" size="lg" className="w-full" disabled={busy}>
                  {busy ? "Please wait…" : isSignUp ? "Create account" : "Sign in"}
                </Button>
              </form>

              <p className="mt-6 text-sm text-muted-foreground">
                {isSignUp ? "Already have an account?" : "New to LoadLoom?"}{" "}
                <button
                  type="button"
                  className="font-semibold text-foreground underline underline-offset-4"
                  onClick={() => setIsSignUp((v) => !v)}
                >
                  {isSignUp ? "Sign in" : "Create an account"}
                </button>
              </p>
            </>
          )}

          <p className="mt-10 text-xs text-muted-foreground">
            <Link to="/" className="underline underline-offset-4">
              Back to loadloom.com
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
