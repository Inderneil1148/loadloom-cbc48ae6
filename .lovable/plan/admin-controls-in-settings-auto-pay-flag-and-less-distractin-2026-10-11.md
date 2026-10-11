# Admin controls in Settings, auto-pay flag, and less distracting extras

## 1. Admin tab in Settings (only your account)
- Settings gets a fourth tab, "Admin". Only your admin account can see it. The server checks your role before showing it, so other users can't find or open it.
- Inside the tab:
  - **Customers & plans**: a searchable list showing each user's email, business, current plan, status and auto-pay.
  - **Change plan**: a dropdown on each row (Free / Starter / Growth / Fleet). It uses the same activation logic as the current admin panel, so users still get the "plan activated" notification.
  - **Auto pay**: an on/off switch on each row, plus a filter to show only auto-pay customers.
  - A link to the full admin panel for payments, plan settings and deletion requests.
- No link to the admin page is added anywhere else.

## 2. What "auto pay" means
- Auto pay is a flag you set yourself. It does not charge anyone automatically, because payments are still manual UPI.
- When it's on, the customer's paid plan stays active month to month without them sending a new payment.
- Customers see "Auto pay: On" on their Plan & Billing page.

## 3. Remove the AI plugin section
- Remove the MCP / "use LoadLoom in ChatGPT, Claude" section from the homepage, along with any matching mention on the features page.
- The hidden connection behind it stays in place. It just isn't advertised anymore.

## 4. Install-as-app pop-up: once only
- Shrink it to a small corner card with a close button.
- It shows a single time per device. It never comes back after that, whether it was closed or ignored.
- It never appears while you're on the dashboard opening animation.

## Technical details
- Migration: add `auto_pay boolean not null default false` and `auto_pay_updated_at timestamptz` to `subscriptions`. The existing admin-only update RLS policy covers it, and users keep read access to their own row.
- `settings.tsx`: add an "Admin" tab, shown only when `has_role(uid,'admin')` returns true through the existing plan/role check. Reuse the admin accounts query and update code from `admin.tsx`, pulled into a shared `AdminAccountsTable` component used by both.
- `InstallPrompt.tsx`: write the `ll-install-dismissed` key as soon as the pop-up is first shown, not only when it's closed. Make it smaller and skip it on `/dashboard` while the splash is playing.
- `index.tsx` (and `features` if it mentions MCP): remove the MCP section. Leave the `/mcp` endpoint itself untouched.
