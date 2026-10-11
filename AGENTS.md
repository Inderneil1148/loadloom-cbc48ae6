<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

Use a single shared AppHeader on authenticated pages for mobile navigation and desktop sidebar, so navigation stays consistent across operations screens.
Use the existing deliveries table for dispatch-board stages rather than duplicating trip state, so existing summaries and status updates stay consistent.
Store customers, delivery sites, and drivers as owner-scoped records rather than deriving their contact details from orders, so account data remains reusable and access-controlled.
Use the specialized dispatch order form for order creation and editing while RecordManager remains the shared list and CRUD shell, so live commercial calculations do not complicate simpler records.
- Feature entitlements live in `src/lib/plans.ts`; editable prices and numeric limits live in `plan_settings`, and `enforce_plan_limits` reads them so admin controls, public pricing, and database enforcement stay aligned.
- Super Admin (/super-admin, old /admin redirects) requires `is_super_admin()` = admin role plus the owner email; its tables (announcements, support tickets, append-only admin_audit_log written by triggers) and report RPCs check it server-side, so access cannot be widened from the client.
- Demo mode is a shared demo@loadloom.app account (Fleet plan, listed in `demo_users`) seeded server-side by `startDemo`; restrictive RLS blocks all its writes and the UI redirects change attempts to /pricing, so the demo stays identical for every visitor.
- Paid plans are bought by UPI QR + screenshot: `plan_payments` rows (private `payment-proofs` bucket) are approved by the admin, which activates the subscription; this keeps billing manual with no payment provider.
- In-app notifications live in the `notifications` table, created by SECURITY DEFINER triggers on subscriptions (plan activated) and plan_payments (rejected); `useNotifications` + `NotificationBell` in AppHeader render them with realtime toast, so approval feedback reaches users instantly without polling.
- MCP server lives in src/lib/mcp (OAuth via the backend's OAuth server, tools query as the signed-in user so RLS applies); /auth honours a same-origin ?next= so the consent page round-trips.
- Optional third-party scripts (Analytics, AdSense) load only via `src/lib/consent.ts` after cookie consent, so nothing tracks before the visitor agrees.
- Account deletion goes through `deletion_requests` and an admin-only server function that removes owner rows and the auth user, so deletion is auditable and manual.
- Desktop packaging source lives under `desktop/` and loads the canonical hosted app through a sandboxed shell, so Mac and Windows releases share live data without exposing Node access.
- Sign-in is email + password only — no Google or Apple buttons — and sign-up never waits on a confirmation email: `createAccount` in `src/lib/auth.functions.ts` creates the account already confirmed through the admin API and the page signs the person straight in, then `confirmPendingAccount` rescues accounts left unverified when confirmation emails were still on, so nobody is blocked while email delivery is unconfigured.
