# Show the new logo on the sign-in page

## Goal
The sign-in/create-account page (`/auth`) currently shows a hand-styled orange "LL" square. Replace it with the real LoadLoom logo you uploaded — the square icon image with the LoadLoom name beside it.

## Changes

### `src/routes/auth.tsx`
- Import the uploaded icon pointer: `import logoIcon from "@/assets/loadloom-icon.png.asset.json"`.
- Replace the orange "LL" `<span>` block with an `<img src={logoIcon.url} alt="LoadLoom" />` (about 44px, rounded corners to match the current look).
- Keep the existing "LoadLoom" wordmark and orange "DISPATCH OS" tagline next to it, unchanged.

No other pages change in this step — the rest of your list comes one by one after.

## Verification
- Open `/auth` on a phone-size screen (393×852): the uploaded icon shows in both sign-in and create-account modes, no layout shift, no page errors, build OK.
