export type PlanId = "starter" | "growth" | "fleet";

export interface Plan {
  id: PlanId;
  name: string;
  positioning: string;
  price: number;
  promise: string;
  audience: string;
  highlights: string[];
  limits: { label: string; value: string }[];
}

export const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    positioning: "Essential Dispatch",
    price: 999,
    promise: "Get your loads under control.",
    audience: "Small suppliers moving away from WhatsApp, notebooks and spreadsheets.",
    highlights: [
      "Orders with rate, transport and automatic totals",
      "Dispatch board: loading, dispatched, on road, delivered",
      "Driver app with Today's Trips and delivery proof",
      "Photo, signature, OTP and weighbridge slip upload",
      "Printable invoices, payments and outstanding",
      "WhatsApp invoice, delivery update and payment reminder",
    ],
    limits: [
      { label: "Users", value: "3" },
      { label: "Vehicles", value: "5" },
      { label: "Drivers", value: "5" },
      { label: "Active customers", value: "100" },
      { label: "Materials", value: "100" },
      { label: "Document storage", value: "2 GB" },
    ],
  },
  {
    id: "growth",
    name: "Growth",
    positioning: "Full Operations",
    price: 2499,
    promise: "Run the entire operation from one place.",
    audience: "Growing businesses with more staff, vehicles and daily dispatches.",
    highlights: [
      "Everything in Starter",
      "Roles for owner, manager, dispatch, accounts and drivers",
      "Quotations with one-click Convert to Order",
      "Customer 360 with orders, invoices, payments and activity",
      "12 operational reports and print-ready exports",
      "Analytics, CSV import/export and full audit history",
    ],
    limits: [
      { label: "Users", value: "10" },
      { label: "Vehicles", value: "25" },
      { label: "Drivers", value: "25" },
      { label: "Active customers", value: "500" },
      { label: "Materials", value: "500" },
      { label: "Document storage", value: "10 GB" },
    ],
  },
  {
    id: "fleet",
    name: "Fleet",
    positioning: "Advanced Operations",
    price: 4999,
    promise: "Get complete operational intelligence.",
    audience: "Larger suppliers and dispatch-heavy businesses.",
    highlights: [
      "Everything in Growth",
      "Dispatch command centre with priority and delay alerts",
      "Fleet intelligence: vehicle and driver workload, capacity",
      "Advanced analytics, outstanding aging, collection trends",
      "Voice to order and AI weighbridge slip extraction",
      "AI daily summary, smart search and follow-up drafts",
    ],
    limits: [
      { label: "Users", value: "50" },
      { label: "Vehicles", value: "100" },
      { label: "Drivers", value: "100" },
      { label: "Active customers", value: "2,000+" },
      { label: "Materials", value: "Unlimited" },
      { label: "Document storage", value: "50 GB" },
    ],
  },
];

export const FREE_PLAN = {
  id: "free" as const,
  name: "Free",
  positioning: "Get Started",
  price: 0,
  promise: "Start managing your daily loads.",
  audience: "For small suppliers trying LoadLoom with essential dispatch tools.",
  highlights: [
    "Orders with automatic totals",
    "Dispatch board, deliveries and invoices",
    "Payments and outstanding tracking",
    "Fleet intelligence overview",
  ],
  limits: [
    { label: "Orders", value: "20 / month" },
    { label: "Vehicles", value: "4" },
    { label: "Active customers", value: "5" },
  ],
};

export const ALL_PLANS = [FREE_PLAN, ...PLANS];

export const WORKFLOW = [
  "Enquiry",
  "Quote",
  "Order confirmed",
  "Truck assigned",
  "Loading",
  "Dispatched",
  "On road",
  "Delivered",
  "Delivery proof",
  "Invoice",
  "Payment",
  "Closed",
];

export const formatINR = (amount: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);

/* ---------- Plan tiers & entitlements ---------- */
export type Tier = "free" | PlanId;
export const TIER_ORDER: Tier[] = ["free", "starter", "growth", "fleet"];
export const TIER_NAMES: Record<Tier, string> = { free: "Free", starter: "Starter", growth: "Growth", fleet: "Fleet" };

export type Feature = "csv_export" | "quotations" | "reports" | "command_centre" | "analytics" | "ai_tools";
export const FEATURE_MIN: Record<Feature, Tier> = {
  csv_export: "starter",
  quotations: "growth",
  reports: "growth",
  command_centre: "fleet",
  analytics: "fleet",
  ai_tools: "fleet",
};
export const FEATURE_LABEL: Record<Feature, string> = {
  csv_export: "CSV export",
  quotations: "Quotations",
  reports: "Reports",
  command_centre: "Dispatch Command Centre",
  analytics: "Advanced analytics",
  ai_tools: "AI tools",
};
export const tierAtLeast = (tier: Tier, min: Tier) => TIER_ORDER.indexOf(tier) >= TIER_ORDER.indexOf(min);
export const hasFeature = (tier: Tier, f: Feature) => tierAtLeast(tier, FEATURE_MIN[f]);

export const LIMITS: Record<Tier, { trucks: number | null; customers: number | null; ordersPerMonth: number | null }> = {
  free: { trucks: 4, customers: 5, ordersPerMonth: 20 },
  starter: { trucks: null, customers: 10, ordersPerMonth: null },
  growth: { trucks: null, customers: null, ordersPerMonth: null },
  fleet: { trucks: null, customers: null, ordersPerMonth: null },
};

export const SIGNUP_TIERS: { id: Tier; name: string; price: number; tagline: string; points: string[] }[] = [
  { id: "free", name: "Free", price: 0, tagline: "Try LoadLoom", points: ["20 orders / month", "Up to 4 trucks, 5 customers", "Dispatch, invoices, payments"] },
  { id: "starter", name: "Starter", price: 999, tagline: "Essential Dispatch", points: ["Unlimited orders & trucks", "10 customers", "CSV export"] },
  { id: "growth", name: "Growth", price: 2499, tagline: "Full Operations", points: ["Quotations → Convert to Order", "Unlimited customers", "12 reports"] },
  { id: "fleet", name: "Fleet", price: 4999, tagline: "Advanced Operations", points: ["Command Centre", "Advanced analytics", "AI tools"] },
];
