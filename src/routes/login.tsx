import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/login")({
  staticData: { sitemap: false },
  beforeLoad: () => {
    throw redirect({ to: "/dashboard" });
  },
});
