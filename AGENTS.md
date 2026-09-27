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
- Plan entitlements live in `src/lib/plans.ts` (FEATURE_MIN/LIMITS) read via `usePlan()`; numeric limits are enforced by the `enforce_plan_limits` DB trigger, so the UI and database stay in agreement.
- Admin access uses `user_roles` + `has_role()`; the /admin page is unlinked and RLS lets only admins read/update all subscriptions.
