# Google Maps link → location for delivery sites

## What you'll get

When adding a delivery site, paste a Google Maps link (a share link like `maps.app.goo.gl/...` or a full `google.com/maps/...` link). The app reads the link, finds the exact place, and fills in the address and map location for you — no typing the address by hand. The "Open in Google Maps" button on the Sites page keeps working as it does today.

## What changes

1. **Save the location with each site**
   - Add two new fields to the sites table: latitude and longitude (stored automatically, never typed by hand).

2. **"Paste a Maps link" helper when adding a site**
   - In the New Load form's "+ Add new site" pop-up: a new optional box for a Google Maps link. Paste it, tap "Get location", and the address box fills in automatically.
   - On the Delivery Sites page add/edit form: the same helper next to the existing "Google Maps link" box.

3. **How the link is read (behind the scenes)**
   - A secure server function (`resolveMapLink`) receives the pasted link, checks it's a real Google Maps link, then:
     - Follows short share links to the real place URL and reads the coordinates from it.
     - If the link has no coordinates, looks the place up through the Google Maps connection (already linked to this project).
   - Returns the address, latitude and longitude; the form fills them in. Bad or non-Google links show a friendly message and change nothing.

4. **Cost and safety limits**
   - The lookup only runs for signed-in users, one link at a time, when you tap the button — no automatic background lookups, so Google usage stays tiny.

## Technical details

- Migration: `ALTER TABLE delivery_sites ADD COLUMN latitude double precision, ADD COLUMN longitude double precision` (no data changes; existing rows stay as they are).
- New `src/lib/maps.functions.ts` with `resolveMapLink` (createServerFn, `requireSupabaseAuth`, zod-validated URL, hostname allowlist: `google.com`/`*.google.com`/`maps.app.goo.gl`/`goo.gl`). Short links are resolved by following the redirect server-side and parsing `@lat,lng` or `!3d!4d` from the final URL; fallback is the Geocoding API via the connector gateway (`https://connector-gateway.lovable.dev/google_maps/maps/api/geocode/json`) with `Authorization: Bearer $LOVABLE_API_KEY` and `X-Connection-Api-Key: $GOOGLE_MAPS_API_KEY`, both read inside the handler.
- `OrderDispatchForm.tsx` add-site dialog and `sites.tsx` form get the link box + "Get location" button; on success they set `address`, `map_url`, `latitude`, `longitude`.
- Regenerate Supabase types after the migration so the new fields typecheck.

## Checks before done

- Paste a real short share link and a full Maps link on a phone-sized screen; confirm the address fills in and the site saves.
- Paste a non-Google link; confirm a clear error and nothing breaks.
- Typecheck and build clean; existing Sites page and New Load form unchanged otherwise.
