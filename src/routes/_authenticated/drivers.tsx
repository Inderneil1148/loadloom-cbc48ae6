import { createFileRoute } from "@tanstack/react-router";
import { RecordManager, StatusBadge, opts } from "@/components/app/RecordManager";
import { Button } from "@/components/ui/button";
import { Phone } from "lucide-react";

export const Route = createFileRoute("/_authenticated/drivers")({
  head: () => ({ meta: [
    { title: "Drivers — LoadLoom" }, { name: "description", content: "Manage drivers and their vehicle assignments." },
    { property: "og:title", content: "Drivers — LoadLoom" }, { property: "og:description", content: "Manage drivers and their vehicle assignments." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" },
  ] }),
  component: () => <RecordManager table="drivers" title="Commercial Drivers" singular="Driver" select="*, vehicles(registration)" orderBy={{ column: "name", ascending: true }}
    fields={[
      { name: "name", label: "Driver name", type: "text", required: true },
      { name: "phone", label: "Phone", type: "text" },
      { name: "licence_number", label: "Licence number", type: "text" },
      { name: "vehicle_id", label: "Assigned truck", type: "ref", ref: { table: "vehicles", label: "registration" } },
      { name: "status", label: "Status", type: "select", options: opts("available", "on_trip", "off_duty") },
    ]}
    columns={[
      { label: "Driver", render: (r) => <span className="font-semibold">{r.name}</span> },
      { label: "Truck", render: (r) => r.vehicles?.registration ?? "—" },
      { label: "Licence", render: (r) => r.licence_number ?? "—" },
      { label: "Status", render: (r) => <StatusBadge value={r.status} /> },
      { label: "Contact", render: (r) => r.phone ? <Button asChild variant="outline" size="sm"><a href={`tel:${String(r.phone).replace(/[^\d+]/g, "")}`}><Phone /> Call Driver</a></Button> : "—" },
    ]}
    mobileTitle={(r) => <span className="flex flex-wrap items-center gap-2">{r.name} <StatusBadge value={r.status} /></span>}
    mobileMeta={(r) => <span className="flex flex-wrap items-center gap-2">{r.vehicles?.registration ?? "No truck"}{r.phone && <Button asChild variant="outline" size="sm"><a href={`tel:${String(r.phone).replace(/[^\d+]/g, "")}`}><Phone /> Call Driver</a></Button>}</span>}
  />,
});