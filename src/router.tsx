import { MutationCache, QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient({
    mutationCache: new MutationCache({
      onError: (error) => {
        // Demo accounts are read-only in the database; send visitors to sign up instead.
        if (typeof window !== "undefined" && error instanceof Error && /row-level security/i.test(error.message)) {
          toast.info("This is a read-only demo. Pick a plan and create your account to add your own data.");
          router.navigate({ to: "/pricing" });
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
