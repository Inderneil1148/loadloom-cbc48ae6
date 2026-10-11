# Product Hunt card in the site footer

## Goal
Show the supplied Product Hunt card in the public site footer on every page, keeping Product Hunt's own look (white card, LoadLoom image, title, tagline, coral "Check it out on Product Hunt →" button).

## Changes
- Add a small `ProductHuntCard` component reproducing the pasted embed exactly (same image URL, text, link, colors, rounded card).
- Render it once in the shared footer in `src/components/site/SiteShell.tsx`, so it appears on all public pages (home, pricing, features, brand, legal, contact, download).
- Link opens Product Hunt in a new tab (`target="_blank" rel="noopener noreferrer"`).
- Fits phone widths: full width up to 500px, title truncates without overflow.

## Technical notes
- Product Hunt's colors are kept as inline styles inside this one component, since they are a third-party brand mark (same exception as the Google sign-in logo).
- Image has proper alt text; no new tracking scripts are loaded.
- Verify on phone and desktop that the footer has no overlap and build is clean.
