import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { RecordManager } from "@/components/app/RecordManager";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ExternalLink } from "lucide-react";
import { resolveMapLink } from "@/lib/maps.functions";

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
    customForm={({ form, setForm }) => <SiteForm form={form} setForm={setForm} />}
    preparePayload={(payload, form) => ({
      ...payload,
      latitude: form["latitude"] ? Number(form["latitude"]) : null,
      longitude: form["longitude"] ? Number(form["longitude"]) : null,
    })}
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

function SiteForm({ form, setForm }: { form: Record<string, string>; setForm: (form: Record<string, string>) => void }) {
  const [resolving, setResolving] = useState(false);
  const set = (name: string, value: string) => setForm({ ...form, [name]: value });

  async function resolveLink() {
    const link = (form["map_url"] ?? "").trim();
    if (!link) { toast.error("Paste a Google Maps link first"); return; }
    setResolving(true);
    try {
      const result = await resolveMapLink({ data: { url: link } });
      setForm({
        ...form,
        map_url: result.mapUrl,
        address: result.address,
        latitude: String(result.latitude),
        longitude: String(result.longitude),
      });
      toast.success("Location found — address filled in");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't read that link");
    } finally {
      setResolving(false);
    }
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-1.5">
        <Label htmlFor="site-name">Site name *</Label>
        <Input id="site-name" value={form["name"] ?? ""} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Hinjewadi Phase 2" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="site-contact">Site contact</Label>
        <Input id="site-contact" value={form["contact_name"] ?? ""} onChange={(e) => set("contact_name", e.target.value)} placeholder="e.g. Ramesh Patil" />
      </div>
      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor="site-map">Google Maps link</Label>
        <div className="flex gap-2">
          <Input id="site-map" value={form["map_url"] ?? ""} onChange={(e) => set("map_url", e.target.value)} placeholder="Paste a Maps share link" />
          <Button type="button" variant="outline" onClick={() => void resolveLink()} disabled={resolving}>{resolving ? "Finding…" : "Get location"}</Button>
        </div>
        {form["latitude"] && form["longitude"] && (
          <p className="text-xs text-success">Location saved: {Number(form["latitude"]).toFixed(5)}, {Number(form["longitude"]).toFixed(5)}</p>
        )}
      </div>
      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor="site-address">Address</Label>
        <Input id="site-address" value={form["address"] ?? ""} onChange={(e) => set("address", e.target.value)} placeholder="e.g. Survey No. 42, Pune" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="site-phone">Phone</Label>
        <Input id="site-phone" value={form["phone"] ?? ""} onChange={(e) => set("phone", e.target.value)} placeholder="e.g. 98220 12345" />
      </div>
    </div>
  );
}

function safeMapUrl(value: string | null, query: string) {
  if (value) {
    try { const url = new URL(value); if (url.protocol === "https:" && (url.hostname === "google.com" || url.hostname.endsWith(".google.com") || url.hostname === "maps.app.goo.gl")) return url.href; } catch { /* use address instead */ }
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
