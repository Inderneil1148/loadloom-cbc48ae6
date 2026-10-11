# Super Admin — Phase 1

Rename the admin panel to **Super Admin**. Only your account (inderneilkanagali@gmail.com, with the admin role) can open it, and it stays unlinked from public pages. Items that need features LoadLoom doesn't have yet show a "Coming Soon" label and no made-up numbers.

## Phase 1 (this build)

1. **Access**
   - Rename the page title, the Settings tab and the menu labels to "Super Admin".
   - Add a check on the server that only lets your email *and* the admin role in, for every action on the page.
   - Add a secure Sign out button.

2. **Reports**
   - Business sign-ups by day, week and month.
   - Daily, weekly and monthly active users, based on last sign-in.
   - Subscription revenue trend, from approved UPI payments.
   - Number of customers on each plan.
   - Cancellations and suspensions.
   - Total orders across the platform.
   - Feature usage per business: orders, trucks, invoices and quotations.
   - CSV download for each report.
   - Marked Coming Soon: free-trial-to-paid conversion, and API usage.

3. **Announcements**
   - Send an in-app announcement to everyone, to one plan, or to chosen users.
   - Each announcement has a type: General, Maintenance or Release notes.
   - Save reusable templates.
   - A sent history with read counts.
   - Marked Coming Soon: email delivery settings.

4. **Support & Feedback**
   - Users get a "Contact support" form in the app with three types: Bug, Feedback or Feature request.
   - In Super Admin, tickets move between Open, Pending and Resolved.
   - Private internal notes on each ticket.
   - Average resolution time and ticket counts.
   - Not included: assigning tickets to team members, because you chose to be the only admin.

5. **Audit log**
   - Plan, status, auto-pay, payment approval, deletion and settings changes are recorded automatically.
   - Account suspensions and restorations are recorded too.
   - Nobody can edit or delete these entries, including you.
   - The page shows your recent sign-ins.
   - Marked Coming Soon: failed sign-in tracking and admin session control.

6. **System health**
   - A live check that the database is reachable.
   - Storage used in each file area.
   - Status of connected services: Maps, Analytics and email.
   - Recent app errors from the "Fix a problem" page.
   - The app version and the date it was last published.
   - Marked Coming Soon: background jobs and backup controls.

## Phase 2 (later)

- **Platform settings:** name and logo, support contacts, currency and time zone, feature switches, maintenance mode, sign-up defaults, and data retention.
- **Profile & security:** two-step sign-in (2FA), password change and device sessions.

## Technical details

- A new `/super-admin` route under `_authenticated` with tabs. The old `/admin` path redirects to it.
- Access is checked with `has_role(admin)` plus your email from the sign-in token, inside every server function.
- New tables, each with access controls that only let admins in:
  - `announcements` and `announcement_templates`, delivered to users through the existing `notifications`.
  - `support_tickets` (users can create and read their own) and `ticket_notes` (admin only).
  - `admin_audit_log`, filled by triggers. It can only be added to, never edited or deleted.
- Reports come from database functions limited to admins, which read `subscriptions`, `plan_payments`, `orders` and `auth.users.last_sign_in_at`.
- Charts are drawn in the app, and CSV files are made in the browser.
