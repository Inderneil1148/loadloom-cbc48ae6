# Apply the new LoadLoom brand palette site-wide

## Goal
Replace the current navy-and-orange presentation with the supplied LoadLoom colors:

- Brand red: `#e33825`
- Brand yellow: `#ffde5f`
- White: `#ffffff`
- Black: `#000000`

The existing layout, typography, content, features, calculations, and navigation will remain unchanged.

## Changes
1. **Update the shared color system**
   - Make red the main action and brand color.
   - Use yellow for highlights, selected states, and supporting emphasis.
   - Use white for primary page surfaces and black for text, navigation, and dark sections.
   - Derive muted, border, warning, success, and chart colors with accessible contrast while keeping the four supplied colors visually dominant.
   - Keep existing semantic class names so the palette updates consistently across public pages, sign-in, dashboards, forms, dialogs, tables, plan screens, notifications, and mobile navigation.

2. **Update high-visibility brand surfaces**
   - Restyle the public header/footer, homepage dark bands, sign-in screen, authenticated sidebar, dashboard splash, buttons, links, active navigation, banners, cards, and focus states.
   - Ensure yellow never carries white text where contrast would be poor; use black text on yellow.
   - Preserve red for clear primary actions without making every surface red.

3. **Update browser and installed-app branding**
   - Change the browser theme color and web-app manifest background/theme colors to the new palette.
   - Update the maskable app icon background that still uses the old navy; retain the existing red/yellow LL artwork.

4. **Update branded emails and standalone error styling**
   - Replace the old navy/orange values in authentication, payment, and enquiry emails with the new red/yellow/black/white palette.
   - Align the standalone fallback error page with the same brand colors.

5. **Validate the result**
   - Check representative public, sign-in, dashboard, table, form, pricing, and billing screens on phone and desktop sizes.
   - Verify contrast, readable buttons, active states, no overlaps or overflow, app icons, and no build/runtime errors.

## Technical notes
- Define the new palette centrally in `src/styles.css` using OKLCH semantic tokens rather than hardcoded component colors.
- Keep legacy token names such as `navy` and `concrete` as compatibility aliases, but remap their values to black/white roles so existing screens update without broad component rewrites.
- Retain third-party logo colors, such as the official Google sign-in mark, because those are provider identity colors rather than LoadLoom branding.
