# Printable bill for payments

Add a print option to every payment on the Payments page. Tapping it opens one common bill template (no template choices) that can be printed or saved as PDF.

## What the user sees

- Each payment row (phone card and desktop table) gets a small print/receipt icon next to edit and delete.
- Tapping it opens a bill showing:
  - "LoadLoom" header with the business name (from Enterprise Profile) as the seller
  - "Payment receipt" title, receipt number (from the payment ID), and date
  - Customer name, invoice number (if linked), payment method, reference/UTR
  - The amount in large type, in ₹ with Indian formatting, plus the amount in words
  - A "Received with thanks" footer line
- A "Print / save as PDF" button prints just the bill — the rest of the app is hidden while printing.
- Works the same on phone and desktop.

## Technical details

- New shared component `src/components/app/PaymentReceipt.tsx`: a Dialog with the bill markup (`id="ll-receipt"`) and a print button calling `window.print()`.
- `src/routes/_authenticated/payments.tsx`: pass RecordManager's existing `actions` prop a print-icon button per row that opens the receipt dialog; fetch the business profile name once for the bill header.
- `src/styles.css`: add `@media print` rules — hide everything except `#ll-receipt` (body * hidden, receipt positioned full-page), so printing outputs only the bill.
- Amount-in-words helper (Indian numbering: lakh/crore) added to `src/lib/plans.ts` or a small util.
- No new template options, no new routes, no database changes.

## Verification

- Typecheck + build log clean.
- Playwright on phone size: open Payments, tap the print icon on a payment, confirm the bill shows correct customer/amount/invoice, and confirm print output contains only the bill.
