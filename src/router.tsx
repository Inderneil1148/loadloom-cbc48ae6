import { MutationCache, QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient({
    mutationCache: new MutationCache({
      onError: (error) => {
        // Show a warning for RLS errors but don't redirect away from the dashboard.
        if (typeof window !== "undefined" && error instanceof Error && /row-level security/i.test(error.message)) {
          toast.info("Some features may be limited without an account. Data changes require sign-in.");
        }
      },
    }),
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
