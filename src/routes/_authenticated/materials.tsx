import { createFileRoute } from "@tanstack/react-router";
import { RecordManager, opts } from "@/components/app/RecordManager";
import { formatINR } from "@/lib/plans";

export const Route = createFileRoute("/_authenticated/materials")({
  head: () => ({ meta: [
    { title: "Materials — LoadLoom" },
    { name: "description", content: "Manage materials, units and standard rates." },
    { property: "og:title", content: "Materials — LoadLoom" },
    { property: "og:description", content: "Manage materials, units and standard rates." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex" },
  ] }),
  component: () => <RecordManager table="materials" title="Bulk Material Catalog" singular="Material" orderBy={{ column: "name", ascending: true }}
    fields={[
      { name: "name", label: "Material name", type: "text", required: true },
      { name: "unit", label: "Default unit", type: "select", options: opts("tonnes", "brass", "cft", "bags", "nos", "trips") },
      { name: "rate", label: "Rate per unit (₹)", type: "number" },
    ]}
    columns={[
      { label: "Material", render: (r) => <span className="font-semibold">{r.name}</span> },
      { label: "Unit", render: (r) => r.unit },
      { label: "Standard rate", render: (r) => `${formatINR(r.rate)} / ${r.unit}` },
    ]}
    mobileTitle={(r) => r.name} mobileMeta={(r) => `${formatINR(r.rate)} per ${r.unit}`} />,
});