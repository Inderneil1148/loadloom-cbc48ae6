import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

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
  const navigate = useNavigate();

  // Auth bypass: send everyone directly to the dashboard
  useEffect(() => {
    navigate({ to: "/dashboard", replace: true });
  }, [navigate]);

  return null;
}