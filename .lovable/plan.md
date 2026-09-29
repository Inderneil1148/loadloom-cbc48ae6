# In-app notification when a plan is approved

## How it will work

```text
You tap "Approve" in the Admin panel
        |
        v
A notification is created automatically for that user:
"Your Growth plan is now active! All Growth features are unlocked."
        |
        v
The user's app (open or freshly loaded):
  - A bell icon in the top bar shows a red unread dot
  - If the app is open, a toast pops up right away: "Your Growth plan is now active"
  - Tapping the bell opens a list of notifications; tapping one marks it read
```

## What gets built

1. **Notifications table**: each row belongs to one user, with a title, message, link (e.g. to the dashboard), read/unread state, and date.
2. **Automatic creation**: a database trigger fires when a subscription becomes active with a paid plan — so it works no matter how the approval happens (admin panel now, anything later).
3. **Bell in the top bar**: next to the existing header actions, on phone and desktop. Shows an unread count badge; opens a dropdown with the latest notifications, newest first, and a "Mark all read" option.
4. **Live toast**: if the user has the app open when you approve, a toast appears instantly (uses the live updates already set up).
5. **Reusable**: the same bell will work for future notifications (payment rejected, plan suspended, etc.) — rejection already gets one: "Your payment couldn't be verified" with your note.

## Technical details

- New table `notifications` (user_id, title, body, link, read_at, timestamps) with GRANTs and RLS: users read/update only their own rows; inserts happen via a SECURITY DEFINER trigger (bypasses RLS safely).
- Trigger on `subscriptions` AFTER UPDATE: when status changes to 'active' and plan is paid, insert the "plan active" notification; when a payment is rejected (trigger on `plan_payments`), insert a rejection notice.
- `useNotifications` hook: query + realtime channel on the user's rows (same pattern as the live plan updates), unread count, mark-read mutation.
- Bell component added to `AppHeader`; toast via sonner on new realtime insert.
- Final check with Playwright on phone size; typecheck must pass.
