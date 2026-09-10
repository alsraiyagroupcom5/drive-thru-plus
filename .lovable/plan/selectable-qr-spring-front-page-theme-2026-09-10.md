# Selectable QR-Spring Front-Page Theme

## Goal
Add the uploaded deep-teal and muted-gold luxury design as a second public website theme. The admin can switch between the current architectural website and the new QR-Spring luxury theme from Website Settings.

## What will change
- Add a clear theme chooser to the admin website editor, with the current design and the new luxury design as two options.
- Store the selected theme inside the existing website content settings, so no new database table or migration is required.
- Build the new full-screen front-page presentation with:
  - fixed glass navigation that changes after scrolling,
  - centered bilingual headline and calls to action,
  - the QR-Spring logo and generated Spring mascot,
  - deep teal, muted brass-gold, and sparing sage styling,
  - subtle QR-inspired texture and refined entrance motion,
  - responsive navigation and mobile layout,
  - trusted-partner strip.
- Keep all existing admin-editable logo, navigation, headline, button, and website content connected to the new theme.
- Keep Features, Pricing, Contact, dashboard, customer ordering, and all operational pages unchanged.
- Preserve the current theme exactly as the alternate selection.

## Technical details
- Extend the existing website content model with `theme: "architectural" | "luxury"`; old saved content automatically receives the current architectural default.
- Add isolated semantic luxury-theme tokens and styles so dashboard and customer-page colors are unaffected.
- Render theme-specific website navigation/footer and homepage only when Luxury is selected.
- Load Fraunces and Inter through document-head links, not CSS imports.
- Use the existing local logo asset plus the newly generated transparent mascot asset.
- Verify both themes, language direction, desktop/mobile layouts, admin selection persistence, and page metadata.

## Separate pending owner feature
After this visual theme work, complete the previously requested owner control for either one restaurant menu link or separate branch-locked links.
