# Remember signed-in users every time they open the site

## What already works (verified in the code)

- The homepage sends anyone who is already signed in straight into the app — paid plan or payment under review → dashboard; free plan → plan page.
- The sign-in page does the same check, so a signed-in person never sees the sign-in form again.
- The installed app opens directly on the dashboard.
- Sign-in sessions are stored on the device, so closing and reopening the browser keeps the person signed in.

## What this plan adds

1. **Verify the session truly persists** — confirm the app's sign-in storage is set to keep the session permanently (not just for the browser session), so people stay signed in for weeks, not hours.
2. **Fix any gap found** — if the session is being dropped (for example after a browser restart or inside the installed app), correct the storage settings so the login survives.
3. **Test it end to end** — sign in, fully close and reopen the site, and confirm the person lands inside the app without seeing the sign-in page.

## Technical details

- Check `src/integrations/supabase/client.ts` storage config (auto-generated — if changes are needed there, work around it rather than editing it).
- `persistSession` / storage behaviour of the Supabase client; confirm no code path clears localStorage on load.
- Playwright test: sign in → close context → reopen with same storage state → assert redirect to `/dashboard` or `/choose-plan`, never `/auth`.

## Out of scope

- No change to where people land (paid → dashboard, free → plan page) — that stays as you approved earlier.
