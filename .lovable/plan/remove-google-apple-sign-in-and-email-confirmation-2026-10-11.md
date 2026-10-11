# Remove Google & Apple sign-in and the email-confirmation step

## What changes

- The sign-in / sign-up page has **one way in: email + password**. The "Continue with Google"
  and "Continue with Apple" buttons, their logos, and the "or continue with email" divider are gone.
- **No confirmation email is ever sent.** Creating an account now signs the person straight in and
  takes them to the plan picker, so nobody is left waiting for a link that email delivery cannot send.
- Accounts left unconfirmed while confirmation emails were switched on are activated automatically
  the first time their owner signs in with the right password.

## How it works

- `src/lib/auth.functions.ts` (new):
  - `createAccount` — server function that creates the user through the Supabase admin API with
    `email_confirm: true`, so the account is usable immediately and no email is queued. The usual
    `handle_new_user_subscription` trigger still fires, so the Free subscription is created as before.
    If the email already has an account, it reports `status: "existing"` and confirms that account if
    it was never confirmed (confirming never changes a password, so no one can take over an account
    they do not already have the password for).
  - `confirmPendingAccount` — confirms a legacy unconfirmed account during sign-in, used only after
    Supabase answers a correct email + password with `email_not_confirmed`.
- `src/routes/auth.tsx`: sign-up calls `createAccount` and then signs in with the password the person
  just typed; sign-in retries once through `confirmPendingAccount` before showing the Supabase error.
  The "Confirm your email" screen and its state are removed.
- `desktop/main.cjs`: `accounts.google.com` and `appleid.apple.com` are dropped from the shell's
  allowed auth origins, since no OAuth flow leaves the app any more.

## What deliberately stays

- Forgot password still uses Supabase's recovery email — it is the only recovery route, and it is
  untouched by this change. If email delivery stays unconfigured, that link will not arrive either.
- The MCP OAuth consent screen (`/.lovable/oauth/consent`) is unrelated to social sign-in and is
  unchanged.

## Suggested Supabase dashboard step (optional)

Turning off Auth → Providers → Email → "Confirm email" in the Supabase project makes the plain
`signUp` path work too. The app no longer depends on it, but it keeps both paths consistent.
