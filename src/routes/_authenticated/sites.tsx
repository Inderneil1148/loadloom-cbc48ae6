import { createFileRoute } from "@tanstack/react-router";
import { RecordManager } from "@/components/app/RecordManager";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

export const Route = createFileRoute("/_authenticated/sites")({
  staticData: { sitemap: false },
  head: () => ({ meta: [
    { title: "Delivery Sites — LoadLoom" }, { name: "description", content: "Manage delivery addresses and site contacts." },
    { property: "og:title", content: "Delivery Sites — LoadLoom" }, { property: "og:description", content: "Manage delivery addresses and site contacts." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" },
  ] }),
  component: () => <RecordManager table="delivery_sites" title="Delivery Destinations & Sites" singular="Site" orderBy={{ column: "name", ascending: true }}
    fields={[
      { name: "name", label: "Site name", type: "text", required: true },
      { name: "address", label: "Address", type: "text" },
      { name: "map_url", label: "Google Maps link", type: "text" },
      { name: "contact_name", label: "Site contact", type: "text" },
      { name: "phone", label: "Phone", type: "text" },
    ]}
    columns={[
      { label: "Site", render: (r) => <span className="font-semibold">{r.name}</span> },
      { label: "Address", render: (r) => r.address ?? "—" },
      { label: "Contact", render: (r) => r.contact_name ?? "—" },
      { label: "Map", render: (r) => <Button asChild variant="outline" size="sm"><a href={safeMapUrl(r.map_url, r.address ?? r.name)} target="_blank" rel="noreferrer"><ExternalLink /> Open in Google Maps</a></Button> },
    ]}
    mobileTitle={(r) => r.name}
    mobileMeta={(r) => <span className="flex flex-wrap items-center gap-2">{r.address ?? "No address"}<Button asChild variant="outline" size="sm"><a href={safeMapUrl(r.map_url, r.address ?? r.name)} target="_blank" rel="noreferrer"><ExternalLink /> Open in Google Maps</a></Button></span>}
  />,
});

function safeMapUrl(value: string | null, query: string) {
  if (value) {
    try { const url = new URL(value); if (url.protocol === "https:" && (url.hostname === "google.com" || url.hostname.endsWith(".google.com") || url.hostname === "maps.app.goo.gl")) return url.href; } catch { /* use address instead */ }
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
