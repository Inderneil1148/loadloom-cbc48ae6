# Launch compliance pass for LoadLoom

Business: The Social INK. Refunds: none once activated. Minimum age: 18+. Data deletion: users request it, the admin approves it.

## 1. Legal pages
- Rewrite **Privacy Policy** to cover what's collected, why, the services that process it (sign-in, email, Google Analytics, AdSense, Google Maps, AI diagnosis), how long it's kept, user rights, deletion requests, the 18+ rule, and a contact email.
- Rewrite **Terms of Service** with the business name, 18+ eligibility, manual UPI billing (replacing the old "billing coming soon" text), no-refund terms and governing law (India).
- New **Refund Policy** page: no refunds after activation, rejected payments are returned, how to contact support.
- New **Cookie Policy** page: essential cookies (sign-in) versus analytics/ad cookies, and how to change your choice.
- Add a "Last updated" date to each page, plus footer links to all four.

## 2. Cookie consent and form consents
- Show a small cookie banner on first visit with **Accept all / Essential only** and a close button. The choice is remembered, and you can change it later from a footer link.
- Google Analytics and AdSense load only after **Accept all**.
- Sign-up gets a required checkbox: "I am 18+ and agree to the Terms and Privacy Policy." The contact form gets a short consent note.

## 3. Data deletion requests
- Settings gets a "Request account deletion" button with a confirmation step and an optional reason.
- A new Deletion Requests tab in the admin panel lets you approve (the account and all its records are permanently deleted) or decline. The user gets an in-app notification.

## 4. Data minimization and third-party audit
- Review the sign-up, contact and record forms. Remove or make optional any field that isn't needed.
- List every outside service in the Privacy Policy. Remove anything unused.

## 5. Honest marketing
- Scan the homepage, features and pricing pages. Remove fake testimonials, made-up customer counts and unsupported claims (e.g. delivery proof or weighbridge features that don't exist yet).
- Make sure prices show the full amount with no hidden fees, and that there are no pre-ticked boxes or fake countdowns.

## 6. Accessibility
- Add meaningful alt text to images, and labels to icon-only buttons.
- Check colour contrast for the red/yellow palette and adjust the shades where text falls below the WCAG AA standard.
- Make every menu, dialog and button keyboard-reachable with a visible focus ring, and add a "Skip to content" link.

## 7. Emails, fonts and images
- Add the business name, address line and a reason-for-email line to the footer of every email. Transactional emails (receipts, sign-in) don't legally need unsubscribe links. No marketing emails exist today.
- Confirm the fonts (Inter and Manrope, both under the free SIL Open Font licence) and images (your own or AI-generated) are licensed for use. Note this in the report.

## 8. Business details
- Show "The Social INK" plus a contact email in the footer and on the Contact page.

## Needed from you
A contact email, a registered address and a phone number to print on the legal pages. Until you send them, I'll use your enquiry email and leave the address out.

## Technical details
- New routes: `/refund-policy` and `/cookie-policy`, each with its own `head()` and sitemap entry.
- Consent stored in localStorage. `initAnalytics` and the AdSense script are injected only when analytics consent is given (the AdSense script moves out of the root `head`).
- New `deletion_requests` table (owner insert/select, admin select/update via `has_role`). Approval runs a server function that checks the caller is admin, then uses the admin client to delete the user's rows and their auth user.
- Sign-up blocks submission until the consent checkbox is ticked. Google/Apple buttons show an "By continuing you agree..." line.
