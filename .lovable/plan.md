# LoadLoom: Plans, Manual Activation, Email-only Sign-in, Private Admin Panel

## How it will work (workflow)

```text
Person signs up (email + password) -> picks a plan: Free / Starter / Growth / Fleet
        |
        v
Free  -> active at once
Paid  -> saved as "Requested", app runs on Free until you approve
        |
        v
You open the private Admin panel -> see every user, requested plan, current plan
        -> set plan (Free/Starter/Growth/Fleet) + status (Active/Pending/Suspended)
        |
        v
User's app unlocks exactly the features of their active plan.
Locked screens show "Available on Growth/Fleet - contact us to upgrade".
```

No online charging. Payment is agreed with you directly, then you switch the plan.

## What each plan unlocks

| Feature | Free | Starter ₹999 | Growth ₹2,499 | Fleet ₹4,999 |
|---|---|---|---|---|
| Dashboard, Orders (New Load with live totals) | Yes (max 20 orders/month) | Yes | Yes | Yes |
| Materials, Enterprise Profile | Yes | Yes | Yes | Yes |
| Trucks, Drivers, Customers, Sites | 2 trucks | Yes | Yes | Yes |
| Deliveries, Invoices, Payments recording | - | Yes | Yes | Yes |
| Dispatch Board, Driver Portal | - | Yes | Yes | Yes |
| CSV export | - | Yes | Yes | Yes |
| Quotations with "Convert to Order" | - | - | Yes | Yes |
| Customer 360 (orders, invoices, payments per customer) | - | - | Yes | Yes |
| Reports (12: sales, outstanding, material-wise, truck-wise, etc.) | - | - | Yes | Yes |
| Dispatch Command Centre (live counts, delays) | - | - | - | Yes |
| Fleet intelligence (trips/revenue per truck, utilisation) | - | - | - | Yes |
| Advanced analytics (trends, top customers) | - | - | - | Yes |
| AI tools: voice/text to order, weighbridge slip reading, daily summary, smart search, payment follow-up drafts | - | - | - | Yes |

Locked items stay visible in the menu with a small lock and an upgrade message, so users know what they can get.

## Sign-in changes
- Remove Google sign-in everywhere; email + password only (sign up, sign in, forgot password).
- Sign-up form adds a 4-card plan picker (Free, Starter, Growth, Fleet) with prices and short feature lists.

## Private Admin panel
- Hidden page (not linked anywhere in the app or website).
- Only your email (inderneilkanagali@gmail.com) is granted admin; anyone else opening it sees "Not found".
- Shows: user email, business name, sign-up date, requested plan, current plan, status, with search and filter.
- Change plan and status from a dropdown; saves instantly.
- Admin access is checked on the server, not in the browser, so it can't be faked.

## Build order
1. Database: subscriptions record per user (plan, requested plan, status), admin role list, auto-create on sign-up, security rules.
2. Email-only sign-in + plan picker on sign-up.
3. Plan access checks: menu locks, page locks, Free limits.
4. Admin panel.
5. Growth features: Quotations, Customer 360, Reports.
6. Fleet features: Command Centre, Fleet intelligence, Analytics, AI tools (AI is optional; the app works if AI fails).
7. Final check on phone first, then desktop, no errors.

## Technical details
- Tables: `subscriptions` (user_id, plan, requested_plan, status), `user_roles` + `has_role()`; `quotations` table for Growth.
- Trigger on new auth user creates subscription from sign-up metadata (paid picks -> plan free, status pending).
- Users can read only their own subscription; only admins update any. Admin list/update via server functions verifying `has_role(admin)`.
- `usePlan()` hook + `PLAN_FEATURES` map in `src/lib/plans.ts`; `<PlanGate feature>` wrapper for pages.
- AI via Lovable AI Gateway in server functions only.

Please confirm the Free limits (20 orders/month, 2 trucks) and the admin email, or tell me changes.
