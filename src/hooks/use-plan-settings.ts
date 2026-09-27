import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ALL_PLANS, type Tier } from "@/lib/plans";
import type { Database } from "@/integrations/supabase/types";

export type PlanSetting = Database["public"]["Tables"]["plan_settings"]["Row"];

export const PLAN_SETTINGS_QUERY_KEY = ["plan-settings"] as const;

export function usePlanSettings() {
  return useQuery({
    queryKey: PLAN_SETTINGS_QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await supabase.from("plan_settings").select("*").order("price");
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 60_000,
  });
}

function limitText(value: number | null, suffix = "") {
  return value === null ? "Unlimited" : `${value.toLocaleString("en-IN")}${suffix}`;
}

export function plansWithSettings(settings: PlanSetting[] | undefined) {
  return ALL_PLANS.map((plan) => {
    const setting = settings?.find((item) => item.plan === plan.id);
    if (!setting) return plan;
    return {
      ...plan,
      price: setting.price,
      limits: [
        { label: "Orders", value: limitText(setting.orders_limit, setting.orders_limit === null ? "" : " / month") },
        { label: "Vehicles", value: limitText(setting.vehicles_limit) },
        { label: "Active customers", value: limitText(setting.customers_limit) },
        { label: "Materials", value: limitText(setting.materials_limit) },
      ],
    };
  });
}

export function signupTiersWithSettings(settings: PlanSetting[] | undefined) {
  return plansWithSettings(settings).map((plan) => ({
    id: plan.id as Tier,
    name: plan.name,
    price: plan.price,
    points: plan.limits.map((limit) => `${limit.label}: ${limit.value}`),
  }));
}