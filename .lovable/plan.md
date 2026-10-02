# Install as an app + remember signed-in users

## What changes for users

1. **Add to Home Screen (install as an app)**
   - LoadLoom can be saved to a phone's home screen from the browser's Share / menu button and opens full-screen like an app, with the LoadLoom icon and navy theme.
   - A small bar at the bottom: "Install LoadLoom on your phone" with short steps (iPhone: Share → Add to Home Screen; Android: Install button when the browser offers it) and a close (X) button. Once closed it stays hidden on that device. It never shows when already opened as the installed app.

2. **Remember the user**
   - Signed-in users stay signed in (already the default); opening the homepage or the sign-in page while signed in sends them straight into the app instead of asking them to sign in again.

3. **Where people land after opening / signing in**
   - Has an active paid plan (Starter/Growth/Fleet) → Dashboard. Never shown the plan page again.
   - Paid plan already chosen and payment waiting for approval → Dashboard (with the existing "activated within 24 hours" bar).
   - Free plan user → plan page first, then payment page if they pick a paid plan ("Continue on Free" / "Skip for now" still go to the dashboard).
   - Demo account → unchanged.

4. **Mobile polish** for the installed app: safe-area spacing for phone notches and the bottom navigation, no zoom-jumping on inputs, full-height screens.

## Technical details

- Manifest-only installability (no service worker / offline): `public/manifest.webmanifest` (name, short_name, start_url `/dashboard`, display standalone, theme `#0B132B`, background `#0B132B`, icons 192/512 + maskable generated from the existing square icon). Head links in `__root.tsx`: manifest, theme-color, apple-touch-icon, apple-mobile-web-app-capable/title/status-bar-style, `viewport-fit=cover`.
- `InstallPrompt` component rendered in `__root.tsx`: detects standalone (`display-mode: standalone` / `navigator.standalone`), captures `beforeinstallprompt` for an Install button on Android/Chrome, shows iOS Share instructions otherwise; dismissal stored in localStorage; hidden on `/auth`-less checks not needed; hidden inside the Lovable preview iframe is not required (harmless).
- Shared helper `landingFor(session)` (new `src/lib/landing.ts`) reading `subscriptions` + latest `plan_payments`: active paid → `/dashboard`; pending paid payment → `/dashboard`; free → `/choose-plan`; demo → `/dashboard`. Used by the `/auth` redirect effect and the password sign-in handler (replacing the 7-day "new user" rule).
- Homepage `/`: on mount, if a session exists, navigate to `landingFor(...)` (client-side, after hydration, so SEO/SSR of the landing page is unaffected).
- Remove the AppHeader first-visit `/choose-plan` effect so the dashboard never bounces paid users; the landing helper owns the decision at sign-in/open time.
- CSS: `env(safe-area-inset-*)` padding on header and bottom nav; 16px input font on mobile.
