# Plan payment by QR code after sign-up

## How it will work

```text
Sign up (email, Google or Apple)
   -> "Choose your plan" page (Free / Starter / Growth / Fleet)
        Free  -> goes straight to the dashboard
        Paid  -> "Pay for your plan" page
                   - Plan name + amount (₹999 / ₹2,499 / ₹4,999)
                   - Your UPI QR code + UPI ID (tap to copy)
                   - Upload payment screenshot + optional UTR / reference no.
                   - "Submit payment"
   -> "Payment received" screen: "Your plan will start within 24 hours"
   -> Confirmation email to the customer with the same message
   -> You see the payment + screenshot in the Admin panel and approve it
```

Until you approve, the user uses the app on the Free plan (same as now).

## What gets built

1. **Choose a plan page**: shown right after sign-up and whenever a Free user taps "Upgrade". The plan picker moves out of the sign-up form to this page, so Google and Apple sign-ups also get to choose.
2. **Pay for your plan page**: QR code, amount, UPI ID, screenshot upload (phone camera or gallery), reference number, submit button. Works phone-first.
3. **Payment submitted screen**: shows the "within 24 hours" message and a button to the dashboard.
4. **Confirmation email**: in LoadLoom navy and orange: "We received your payment for the Starter plan (₹999). Your plan will start working within 24 hours." Also a short alert email to you (inderneilkanagali@gmail.com) so you know to check.
5. **Admin panel, new "Payments to verify" tab**: each submission shows the user, plan, amount, reference, screenshot preview, and date. Buttons: **Approve** (turns the plan on) or **Reject** (with a note). The existing plan controls stay as they are.
6. **Admin, Plan settings**: a place to upload your UPI QR image and type your UPI ID, so you can change them any time.
7. **Mini bar at the top of every app page, only for users who chose a paid plan and submitted a payment**: "Your Growth plan will be activated within 24 hours." Free-plan users never see it, and it disappears once you approve. Anyone who picked a paid plan but hasn't paid yet gets a small "Complete payment" link instead.
8. **Free access while waiting**: after submitting the screenshot, the user goes straight to the dashboard and uses everything in the Free plan until you approve.

## What I need from you

- Your UPI QR code image, or just your UPI ID (I can make the QR from it). You can also add it later from the Admin panel.
- Emails will only reach inboxes once notify.inderneil.xyz finishes its DNS check. You still need to add the DNS records at your domain provider.

## Technical details

- New table `plan_payments` (owner user_id, plan, amount, reference, screenshot_path, status pending/approved/rejected, admin_note, timestamps), with GRANTs and RLS: users can insert and read their own rows; admins read and update all rows through has_role.
- Private storage bucket `payment-proofs` (path `{user_id}/...`): users can upload and read their own files; admins read everything through signed URLs.
- `plan_settings`-level (or a new single-row `payment_settings`) fields `upi_id` and `qr_path`, with a public bucket `payment-qr` for the QR image. If only a UPI ID is set, the QR is generated from `upi://pay?pa=...&am=...` with the `qrcode` library.
- New routes: `_authenticated/choose-plan`, `_authenticated/checkout/$plan`, `_authenticated/checkout/submitted`. After sign-up, the redirect goes to /choose-plan. Demo users get sent to /pricing.
- Server function `submitPlanPayment` (requireSupabaseAuth): validates the input, inserts the row, sets subscriptions.requested_plan with status pending, and sends the `payment-received` email plus the `payment-admin-alert` email through sendTemplateEmail.
- Admin approve updates the subscription (plan and status active) and the payment row. It uses the existing server-side admin check.
- Final check with Playwright on phone and desktop.
