# Add a new customer (and site) straight from the New Load form

When someone opens the "Contractor / Buyer" dropdown in the New Load form and their customer isn't listed, they can add them on the spot instead of leaving the form.

## What the user sees

- The customer dropdown gains a "+ Add new customer" option at the bottom. Choosing it opens a small pop-up asking for the customer's name (required) and phone (optional). Saving adds the customer and selects them in the form straight away.
- The delivery-site dropdown gets the same "+ Add new site" option (name required, address optional) — a new customer usually needs a new site too.
- The newly added customer/site appears in the dropdown immediately and is also saved on the Customers / Delivery Sites pages for reuse.
- If adding fails (e.g. name already exists), a clear error message shows in the pop-up.
- Plan limits still apply: if a Free user has reached their customer limit, the error from the limit check is shown.

## Technical details

- `src/components/app/OrderDispatchForm.tsx`:
  - Add a sentinel option value `__new__` to the customer and site `<select>`s; selecting it opens a small inline Dialog instead of setting a value.
  - New mini-form dialog (name + phone for customers; name + address for sites) inserts into `customers` / `delivery_sites` with the current user's `owner_id`, then invalidates the form's option query and calls `selectCustomer(newId)` / `selectSite(newId)` so the new row is selected.
  - Insert errors (including the `enforce_plan_limits` trigger message) surface via the existing toast/error pattern.
- No database changes, no new routes, no changes to RecordManager.

## Verification

- Typecheck + build log clean.
- Playwright on phone size: open New Load, choose "+ Add new customer", save, confirm the new customer is selected in the form; same for delivery site; confirm the new customer appears on the Customers page.
