import { createFileRoute, Outlet } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  staticData: { sitemap: "exclude-subtree" },
  ssr: false,
  beforeLoad: async () => {
    // Auth bypass: allow all users through without sign-in.
    // Try to get the current user if available, but never block access.
    const { data } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));
    return { user: data.user ?? null };
  },
  component: () => <Outlet />,
});
