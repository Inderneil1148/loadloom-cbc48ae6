# Printable bills for payments + invoices for paid plans

Two changes: a print option for payments, and invoice making/printing locked to paid plans.

## 1. Printable bill for every payment

- Each payment row (phone card and desktop table) gets a small print icon next to edit and delete.
- Tapping it opens one common bill template (no template choices):
  - "LoadLoom" header with the business name (from Enterprise Profile) as the seller
  - "Payment receipt" title, receipt number (from the payment ID), and date
  - Customer name, invoice number (if linked), payment method, reference/UTR
  - Amount in large type, ₹ with Indian formatting, plus amount in words
  - "Received with thanks" footer
- "Print / save as PDF" button prints just the bill — the rest of the app is hidden while printing.

## 2. Invoices become a paid-plan feature

- Invoices move to the paid plans (Starter and above) in the plan feature list.
- Paid users: the Invoices page works as today, plus each invoice row gets a print icon opening a common invoice bill template (business header, invoice no., customer, order, amount, due date, status, amount in words) with the same print behaviour.
- Free users: opening Invoices shows the existing upgrade screen (lock icon, what's included, upgrade button) instead of the list — the same pattern already used for Quotations and Reports.

## Technical details

- New shared component `src/components/app/BillPrint.tsx`: a Dialog rendering the bill (`id="ll-bill"`) for a payment or an invoice, plus a print button calling `window.print()`.
- `src/routes/_authenticated/payments.tsx` and `invoices.tsx`: use RecordManager's existing `actions` prop to add the print-icon button per row; fetch the business profile once for the bill header.
- `src/styles.css`: add `@media print` rules hiding everything except `#ll-bill`.
- Amount-in-words helper (Indian numbering: lakh/crore) in a small util.
- `src/lib/plans.ts`: add an `invoices` feature with minimum tier Starter (FEATURE_MIN + FEATURE_LABEL).
- `src/routes/_authenticated/invoices.tsx`: wrap the page in the existing `PlanGate feature="invoices"` so Free users see the upgrade popup.
- No new routes, no database changes, no template options.

## Verification

- Typecheck + build log clean.
- Playwright on phone size: print icon on a payment and an invoice opens the correct bill; print output contains only the bill; a Free-plan account opening Invoices sees the upgrade screen, a paid account sees the list.
