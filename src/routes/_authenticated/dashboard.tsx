import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/site/Logo";
import { useSession } from "@/hooks/use-session";
import { WORKFLOW } from "@/lib/plans";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — LoadLoom" },
      { name: "description", content: "Your LoadLoom operations dashboard." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { session } = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5">
          <Logo />
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {session?.user.email}
            </span>
            <Button variant="outline" size="sm" onClick={signOut}>
              <LogOut /> Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-5 py-12">
        <p className="eyebrow text-accent">Your organization</p>
        <h1 className="mt-3 text-3xl font-extrabold">Welcome to LoadLoom</h1>
        <p className="mt-3 max-w-xl text-muted-foreground">
          Your account is set up and your yard starts empty. Orders, dispatch, trips, customers,
          vehicles, drivers, invoices and payments come next.
        </p>

        <div className="mt-10 rounded-md border border-border bg-card p-6 shadow-panel">
          <p className="eyebrow text-muted-foreground">Operating workflow</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {WORKFLOW.map((step) => (
              <span
                key={step}
                className="rounded-sm border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground"
              >
                {step}
              </span>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
