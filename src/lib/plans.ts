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
