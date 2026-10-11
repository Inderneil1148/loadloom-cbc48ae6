# LoadLoom Brand Page

A new public page at `/brand` presenting the LoadLoom identity, styled with the brand palette (red `#e33825`, yellow `#ffde5f`, white, black).

## What it will contain

1. **Hero / logo block** — the existing LoadLoom icon and wordmark shown large, with the tagline underneath, on a black section with red/yellow accents.
2. **Tagline** — a short line such as "Materials in, money tracked." (final wording can be adjusted).
3. **About section** — a few short paragraphs on what LoadLoom does: orders, vehicles, deliveries, invoices and payments for construction-material suppliers, mobile-first.
4. **Brand colors** — the four palette colors shown as labeled swatches (red, yellow, white, black) so the identity is documented on the page itself.
5. **Contact section** — enquiry email link, a link to the existing Contact page form, and the guided-walkthrough YouTube link.

## Technical details

- New route `src/routes/brand.tsx` using the existing `SiteShell` and `PageHeader` so header/footer stay consistent.
- Reuses `src/assets/loadloom-icon.png` and the `Logo` component; no new images needed.
- Colors come from the existing semantic tokens in `src/styles.css` (already set to the brand palette) — no hardcoded hex in the page.
- Own `head()` with unique title/description, og:title, og:description, og:type, twitter:card; added to the sitemap via `staticData`.
- Mobile-first layout, matching the rest of the site.

## Out of scope

- No new logo artwork (uses the current icon).
- No changes to existing pages other than optionally adding a "Brand" link in the footer.
