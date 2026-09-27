import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/site/Logo";
import { useSession } from "@/hooks/use-session";

const NAV = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/orders", label: "Orders" },
  { to: "/trucks", label: "Trucks" },
  { to: "/deliveries", label: "Deliveries" },
  { to: "/invoices", label: "Invoices" },
  { to: "/payments", label: "Payments" },
  { to: "/settings", label: "Settings" },
] as const;

export function AppHeader() {
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
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between gap-3 px-4 sm:h-16 sm:px-5">
        <Logo />
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <span className="hidden truncate text-sm text-muted-foreground md:inline">{session?.user.email}</span>
          <Button variant="outline" size="sm" onClick={signOut} className="shrink-0">
            <LogOut /> <span className="hidden sm:inline">Sign out</span>
          </Button>
        </div>
      </div>
      <nav className="mx-auto flex w-full max-w-7xl gap-1 overflow-x-auto px-2 sm:px-3">
        {NAV.map((n) => (
          <Link
            key={n.to}
            to={n.to}
            className="shrink-0 border-b-2 border-transparent px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground"
            activeProps={{ className: "!border-accent !text-foreground" }}
          >
            {n.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
