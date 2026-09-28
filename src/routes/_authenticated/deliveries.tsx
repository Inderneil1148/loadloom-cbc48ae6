import { createFileRoute } from "@tanstack/react-router";
import { RecordManager, StatusBadge, fmtDate, opts } from "@/components/app/RecordManager";

export const Route = createFileRoute("/_authenticated/deliveries")({
  staticData: { sitemap: false },
  head: () => ({ meta: [{ title: "Deliveries — LoadLoom" }, { name: "description", content: "Add, edit and delete deliveries." }, { property: "og:title", content: "Deliveries — LoadLoom" }, { property: "og:description", content: "Track loads from assignment to delivery." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <RecordManager
      table="deliveries"
      title="Deliveries"
      singular="Delivery"
      select="*, orders(order_no, customer_name), vehicles(registration)"
      orderBy={{ column: "created_at" }}
      fields={[
        { name: "order_id", label: "Order", type: "ref", ref: { table: "orders", label: "order_no" } },
        { name: "vehicle_id", label: "Truck", type: "ref", ref: { table: "vehicles", label: "registration" } },
        { name: "driver_name", label: "Driver", type: "text" },
        { name: "status", label: "Status", type: "select", options: opts("scheduled", "loading", "dispatched", "on_road", "arrived", "delivered") },
        { name: "dispatched_at", label: "Dispatched at", type: "datetime" },
        { name: "delivered_at", label: "Delivered at", type: "datetime" },
      ]}
      columns={[
        { label: "Order", render: (r) => <span className="font-semibold">{r.orders?.order_no ?? "—"}</span> },
        { label: "Customer", render: (r) => r.orders?.customer_name ?? "—" },
        { label: "Truck", render: (r) => r.vehicles?.registration ?? "—" },
        { label: "Driver", render: (r) => r.driver_name ?? "—" },
        { label: "Status", render: (r) => <StatusBadge value={r.status} /> },
        { label: "Dispatched", render: (r) => fmtDate(r.dispatched_at) },
        { label: "Delivered", render: (r) => fmtDate(r.delivered_at) },
      ]}
      mobileTitle={(r) => <span className="flex flex-wrap items-center gap-2">{r.orders?.order_no ?? "No order"} <StatusBadge value={r.status} /></span>}
      mobileMeta={(r) => `${r.vehicles?.registration ?? "No truck"} · ${r.driver_name ?? "No driver"}`}
    />
  ),
});
