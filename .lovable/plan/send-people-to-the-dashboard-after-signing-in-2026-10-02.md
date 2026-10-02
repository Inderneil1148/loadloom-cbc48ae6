# Send people to the dashboard after signing in

## The problem
When someone signs in with Google or Apple, or taps the confirmation link in their sign-up email, they come back to the homepage instead of the app. Only email + password sign-in goes straight to the dashboard.

## The fix
- After Google, Apple or the email confirmation link, bring people back to the sign-in page, which immediately sends them on:
  - New account that hasn't chosen a plan yet: the plan picker.
  - Everyone else (Free plan, or a paid plan already chosen or paid): the dashboard.
- After choosing Free, or after uploading a payment screenshot, people already land on the dashboard. This stays the same.
- The password reset link already returns to the sign-in page. This stays the same.

## Technical details
- In `src/routes/auth.tsx`, change `returnUrl()` so its fallback is `${window.location.origin}/auth` instead of `window.location.origin`. The existing session effect then sends them to `/choose-plan` or `/dashboard`. The `?next=` behaviour stays the same.
- Check the result on a phone-sized screen: a signed-in visit to `/auth` should go to the dashboard, and the build should pass.
