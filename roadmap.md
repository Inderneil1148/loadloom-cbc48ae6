# LoadLoom roadmap

Stack note: TanStack Start + Lovable Cloud (auth, database, storage, server functions)
instead of the spec's Firebase/React Router.

## Stage 1 — Marketing site + auth (done)
- [x] Design system: Midnight Navy / Construction Orange, Manrope + Inter
- [x] Public routes: /, /features, /pricing, /demo, /contact, /privacy, /terms
- [x] Sign in / sign up with email + Google, /login redirect
- [x] Protected shell with placeholder /dashboard

## Stage 2 — Organization foundation
- [ ] organizations, org_members, user_roles (separate table), subscription on org
- [x] Plan entitlement config + admin-controlled pricing and limit enforcement
- [ ] First-time onboarding wizard (business, units, first material)
- [x] App shell: desktop sidebar, mobile bottom nav, quick add
- [ ] Global search across records

## Stage 3 — Core operations
- [x] Customers, sites, materials, vehicles, drivers: basic records and contact links
- [x] Orders + create order with calculations
- [ ] Dispatch board and trips with controlled status transitions
- [ ] Delivery proof (photo, signature, OTP, weighbridge slip) in storage

## Stage 4 — Money
- [ ] Quotations + Convert to Order
- [ ] Invoices, payments, outstanding ledger

## Stage 5 — Insight & extras
- [ ] Reports, analytics, activity timeline, audit log
- [ ] Settings (business, users, roles, subscription, notifications, import/export)
- [ ] CSV import/export, PWA, driver experience, WhatsApp share, AI (Fleet)

## Open items needing the user
- [ ] Contact form currently only confirms on screen; needs a destination (inbox or stored enquiries)
- [ ] Real company contact details, support email and legal review of privacy/terms

- [x] Add/edit/delete screens for orders, trucks, deliveries, invoices, payments
- [x] Mobile-first navigation, dispatch board, material page, record search/filter/CSV export
- [x] Driver portal summary, customer directory, delivery sites, call and map links
- [x] Branding: favicon, logo, footer "© 2026 The Social INK / INDERNEILK", contact enquiries emailed to inderneilkanagali@gmail.com
- [x] Final full-app review

- [x] UPI QR payment flow: choose plan, pay + screenshot, 24h bar, emails, admin verify
- [ ] Owner to add UPI ID / QR in Admin > Payments
