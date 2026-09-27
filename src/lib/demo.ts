import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { useSession } from "@/hooks/use-session";

export const DEMO_EMAIL = "demo@loadloom.app";

export function useDemo() {
  const { session } = useSession();
  const navigate = useNavigate();
  const isDemo = session?.user.email === DEMO_EMAIL;
  /** Returns true (and sends the visitor to sign-up) when a change is attempted in demo mode. */
  const block = () => {
    if (!isDemo) return false;
    toast.info("This is a read-only demo. Pick a plan and create your account to add your own data.");
    navigate({ to: "/pricing" });
    return true;
  };
  return { isDemo, block };
}
