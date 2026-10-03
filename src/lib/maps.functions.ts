import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_maps";

const inputSchema = z.object({
  url: z.string().trim().min(8).max(2000),
});

function isAllowedHost(hostname: string) {
  return (
    hostname === "google.com" ||
    hostname.endsWith(".google.com") ||
    hostname === "maps.app.goo.gl" ||
    hostname === "goo.gl"
  );
}

function coordsFromUrl(url: string): { lat: number; lng: number } | null {
  // Patterns: .../@12.34,56.78,15z  or  !3d12.34!4d56.78
  const at = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (at) return { lat: Number(at[1]), lng: Number(at[2]) };
  const bang = url.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  if (bang) return { lat: Number(bang[1]), lng: Number(bang[2]) };
  const q = url.match(/[?&](?:q|query|ll)=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (q?.[1] && q[2]) return { lat: Number(q[1]), lng: Number(q[2]) };
  return null;
}

function queryFromUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const q = u.searchParams.get("q") ?? u.searchParams.get("query");
    if (q) return q;
    const place = u.pathname.match(/\/maps\/place\/([^/]+)/);
    if (place?.[1]) return decodeURIComponent(place[1]).replace(/\+/g, " ");
  } catch {
    /* ignore */
  }
  return null;
}

export const resolveMapLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => inputSchema.parse(input))
  .handler(async ({ data }) => {
    let parsed: URL;
    try {
      parsed = new URL(data.url);
    } catch {
      throw new Error("That doesn't look like a link. Paste the full Google Maps link.");
    }
    if (parsed.protocol !== "https:" || !isAllowedHost(parsed.hostname)) {
      throw new Error("Please paste a Google Maps link (google.com/maps or maps.app.goo.gl).");
    }

    // Follow short share links to the final place URL.
    let finalUrl = data.url;
    if (parsed.hostname === "maps.app.goo.gl" || parsed.hostname === "goo.gl") {
      const res = await fetch(data.url, { redirect: "follow" });
      finalUrl = res.url || data.url;
    }

    const coords = coordsFromUrl(finalUrl);
    if (coords) {
      // Reverse-geocode for a readable address; fall back to bare coordinates.
      const address = await reverseGeocode(coords.lat, coords.lng);
      return { address: address ?? `${coords.lat}, ${coords.lng}`, latitude: coords.lat, longitude: coords.lng, mapUrl: finalUrl };
    }

    // No coordinates in the link — geocode the place name/address instead.
    const query = queryFromUrl(finalUrl);
    if (!query) {
      throw new Error("Couldn't find a place in that link. Open the place in Google Maps, tap Share, and paste that link.");
    }
    const geo = await geocode(query);
    if (!geo) {
      throw new Error("Couldn't find that place. Check the link and try again.");
    }
    return { address: geo.address, latitude: geo.lat, longitude: geo.lng, mapUrl: finalUrl };
  });

async function gatewayHeaders() {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const mapsKey = process.env["GOOGLE_MAPS_API_KEY"];
  if (!lovableKey || !mapsKey) throw new Error("Google Maps is not connected yet.");
  return {
    Authorization: `Bearer ${lovableKey}`,
    "X-Connection-Api-Key": mapsKey,
  };
}

async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  const headers = await gatewayHeaders();
  const res = await fetch(`${GATEWAY_URL}/maps/api/geocode/json?latlng=${lat},${lng}`, { headers });
  if (!res.ok) return null;
  const json = (await res.json()) as { results?: Array<{ formatted_address?: string }> };
  return json.results?.[0]?.formatted_address ?? null;
}

async function geocode(query: string): Promise<{ address: string; lat: number; lng: number } | null> {
  const headers = await gatewayHeaders();
  const res = await fetch(`${GATEWAY_URL}/maps/api/geocode/json?address=${encodeURIComponent(query)}`, { headers });
  if (!res.ok) return null;
  const json = (await res.json()) as {
    results?: Array<{ formatted_address?: string; geometry?: { location?: { lat: number; lng: number } } }>;
  };
  const first = json.results?.[0];
  const loc = first?.geometry?.location;
  if (!first || !loc) return null;
  return { address: first.formatted_address ?? query, lat: loc.lat, lng: loc.lng };
}
