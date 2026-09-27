import { useState } from "react";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Building2, ChevronRight, ClipboardList, CreditCard, FileText, LayoutDashboard, Layers3, LogOut, Menu, Package, Plus, Settings, Truck, Wallet, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/use-session";

const GROUPS = [
  { title: "DISPATCH OPERATIONS", items: [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/dispatch", label: "Dispatch Board", icon: Truck },
    { to: "/orders", label: "Orders & Loads", icon: ClipboardList },
    { to: "/deliveries", label: "Deliveries", icon: Package },
  ] },
  { title: "FLEET & MATERIALS", items: [
    { to: "/trucks", label: "Truck Fleet", icon: Truck },
    { to: "/materials", label: "Materials", icon: Layers3 },
  ] },
  { title: "COMMERCIAL & LEDGER", items: [
    { to: "/invoices", label: "Tax Invoices", icon: FileText },
    { to: "/payments", label: "Payments", icon: CreditCard },
  ] },
  { title: "ACCOUNT", items: [{ to: "/settings", label: "Enterprise Profile", icon: Settings }] },
] as const;

export function AppHeader() {
  const { session } = useSession();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [menuOpen, setMenuOpen] = useState(false);
  const page = GROUPS.map((g) => g.items.find((item) => item.to === location.pathname)?.label).find(Boolean) ?? "Dashboard";

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const nav = (
    <>
      <div className="flex items-center gap-2.5 border-b border-sidebar-border px-4 py-4">
        <span className="grid size-8 shrink-0 place-items-center rounded-sm bg-accent font-display text-xs font-extrabold text-accent-foreground">LL</span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-sm font-extrabold text-sidebar-accent-foreground">LoadLoom</p>
          <p className="text-[9px] font-semibold uppercase text-accent">Dispatch OS</p>
        </div>
        <span className="rounded bg-sidebar-accent px-1.5 py-0.5 text-[10px] text-sidebar-foreground">v1.1</span>
        <Button variant="ghost" size="icon" aria-label="Close menu" className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground lg:hidden" onClick={() => setMenuOpen(false)}><X /></Button>
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-3 py-3">
        <div className="mb-4 flex items-center gap-2 border-b border-sidebar-border px-2 pb-4 text-sidebar-foreground">
          <Building2 className="size-4 shrink-0" />
          <div className="min-w-0"><p className="truncate text-xs font-semibold text-sidebar-accent-foreground">Your operations</p><p className="truncate text-[10px]">LoadLoom workspace</p></div>
        </div>
        {GROUPS.map((group) => (
          <div key={group.title} className="mb-5">
            <p className="mb-1.5 px-2 text-[10px] font-semibold text-sidebar-foreground/60">{group.title}</p>
            {group.items.map(({ to, label, icon: Icon }) => (
              <Link key={to} to={to} onClick={() => setMenuOpen(false)} className="mb-0.5 flex min-h-10 items-center gap-3 rounded-md border-l-2 border-transparent px-2.5 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" activeProps={{ className: "!border-accent !bg-sidebar-accent !text-sidebar-accent-foreground font-semibold" }}><Icon className="size-4 shrink-0" />{label}</Link>
            ))}
          </div>
        ))}
      </div>
      <div className="border-t border-sidebar-border p-3">
        <p className="mb-2 truncate px-2 text-xs text-sidebar-foreground">{session?.user.email}</p>
        <Button variant="ghost" className="w-full justify-between text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" onClick={signOut}>Sign out <LogOut className="size-4" /></Button>
      </div>
    </>
  );

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col bg-sidebar lg:flex">{nav}</aside>
      {menuOpen && <div className="fixed inset-0 z-50 lg:hidden"><div className="absolute inset-0 bg-navy/60" onClick={() => setMenuOpen(false)} /><aside className="relative flex h-full w-[min(18rem,85vw)] flex-col bg-sidebar shadow-lifted">{nav}</aside></div>}
      <header className="sticky top-0 z-30 border-b border-border bg-card lg:ml-60">
        <div className="mx-auto grid h-14 max-w-7xl grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 px-3 sm:px-5">
          <Button variant="ghost" size="icon" aria-label="Open menu" className="lg:hidden" onClick={() => setMenuOpen(true)}><Menu /></Button>
          <div className="hidden min-w-0 items-center gap-2 text-sm sm:flex"><span className="text-muted-foreground">LoadLoom</span><ChevronRight className="size-3 text-muted-foreground" /><span className="truncate font-semibold">{page}</span></div>
          <span className="truncate font-display text-sm font-bold sm:hidden">{page}</span>
          <Button asChild variant="action" size="sm" className="shrink-0"><Link to="/orders" search={{ new: true }}><Plus /> <span className="hidden min-[390px]:inline">New Load</span><span className="min-[390px]:hidden">New</span></Link></Button>
        </div>
      </header>
      <div className="pointer-events-none fixed bottom-3 left-1/2 z-30 flex -translate-x-1/2 gap-1 rounded-md border border-border bg-card p-1 shadow-lifted lg:hidden">
        {[
          { to: "/dashboard", icon: LayoutDashboard, label: "Home" },
          { to: "/orders", icon: ClipboardList, label: "Orders" },
          { to: "/dispatch", icon: Truck, label: "Dispatch" },
          { to: "/payments", icon: Wallet, label: "Payments" },
          { to: "/settings", icon: Settings, label: "Settings" },
        ].map(({ to, icon: Icon, label }) => <Link key={to} to={to} className="pointer-events-auto flex w-14 flex-col items-center gap-0.5 rounded px-1 py-1.5 text-[10px] text-muted-foreground" activeProps={{ className: "!bg-secondary !text-foreground font-semibold" }}><Icon className="size-4" />{label}</Link>)}
      </div>
    </>
  );
}