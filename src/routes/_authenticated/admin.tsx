import { createFileRoute, redirect } from "@tanstack/react-router";

// Old address: the panel is now called Super Admin.
export const Route = createFileRoute("/_authenticated/admin")({
  staticData: { sitemap: false },
  head: () => ({ meta: [{ title: "Super Admin — LoadLoom" }, { name: "robots", content: "noindex, nofollow" }] }),
  beforeLoad: () => { throw redirect({ to: "/super-admin", replace: true }); },
});
