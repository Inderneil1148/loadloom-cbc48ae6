# New Load dispatch order panel

## What will change
- Replace the generic New Load form with a phone-first dispatch order panel matching the reference: customer, delivery site, material, unit, quantity, rate, freight, GST, truck, driver, delivery date, target time, and advance.
- Load customers, sites, materials, available trucks, and drivers from the existing account lists.
- Selecting a material will fill its default unit and rate; users can still adjust order-specific values.
- Show a live commercial summary for material subtotal, freight plus tax, total load amount, and pending balance.
- Save the calculated total with the order and create or update its linked delivery assignment when a truck or driver is selected.
- Keep existing order search, filters, CSV export, edit, delete, and status behavior.

## Calculation rules
- Material subtotal = quantity × unit rate.
- GST = selected GST percentage × (material subtotal + haulage freight).
- Total load amount = material subtotal + haulage freight + GST.
- Balance pending = max(total load amount − advance received, 0).
- All values update immediately while typing or changing a selection.

## Technical details
- Add order fields for rate, freight, GST percentage, advance, delivery date, target time, and optional customer/site/truck/driver references.
- Preserve existing text fields and total amount so current dashboard calculations and older orders continue working.
- Use the existing deliveries table for dispatch assignments rather than creating duplicate trip state.
- Validate required selections and non-negative numbers before saving.
- Verify create and edit flows, calculations, mobile layout, desktop layout, and current error logs.
