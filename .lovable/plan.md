# Add Google & Apple sign-in to LoadLoom

## Goal
Let users sign in or create an account with email/password (as now), **Google**, or **Apple**. Plan picker stays for email sign-ups; social sign-ups start on the Free plan and can request an upgrade later (admin activates paid plans manually, as today).

## Changes

### 1. Enable the providers (backend)
- Call the Configure Social Login tool with `providers: ["google", "apple"]` — this turns on both providers with Lovable-managed credentials (no Google/Apple developer accounts or keys needed from you) and regenerates the `src/integrations/lovable` module.

### 2. Sign-in page (`src/routes/auth.tsx`)
- Add two buttons above the email form, shown in both sign-in and sign-up modes:
  - **Continue with Google** (Google "G" mark, outlined button)
  - **Continue with Apple** (Apple logo, dark button)
- Divider "or continue with email" between social buttons and the email/password form.
- Both call `lovable.auth.signInWithOAuth("google" | "apple", { redirect_uri: window.location.origin })`; on error show a toast, on redirect do nothing (browser leaves).
- Social sign-ups land on `/dashboard` via the existing session redirect; the `handle_new_user_subscription` trigger already creates their subscription row (Free, active) with their email — no code change needed there.
- Plan picker stays visible only for email sign-up; a small note under the social buttons says social sign-ups start on Free and can request a plan upgrade after signing in.

### 3. Memory update
- Replace the old "no Google sign-in" rule with: email + Google + Apple sign-in enabled.

## Technical details
- Provider enablement: `supabase--configure_social_auth` with `["google", "apple"]` (managed credentials; safe, no user setup).
- Client: `lovable.auth.signInWithOAuth` from `@/integrations/lovable` (auto-generated, not hand-edited); `redirect_uri: window.location.origin` (public same-origin URL, per OAuth rules — not a protected route).
- No changes to admin panel, plan enforcement, or RLS.

## Verification
- Playwright check on phone (393×852) and desktop: both buttons render on /auth in sign-in and sign-up modes, email form unchanged, no page errors, build OK.
- Confirm providers report enabled after the configure call.
