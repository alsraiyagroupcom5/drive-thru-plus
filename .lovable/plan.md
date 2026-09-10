# Dashboard redesign + client workspace

Applies only to the management dashboards (admin, owner, live orders, kitchen). The public website stays exactly as it is. Everything stays bilingual Arabic/English with English digits.

## 1. New dashboard look

Rebuild the shared dashboard frame to match the reference:

- Soft tinted page background instead of flat white.
- A dark, rounded, floating navigation rail on the side: icon + label, clear highlighted current item, quick add button at the bottom and the signed-in person's avatar.
- The rail collapses to icons only on smaller screens and slides over on phones.
- Content sits on one large white rounded panel with a light top bar: page title, search field, notification bell.
- Coloured status chips (pill filters) above lists, e.g. new / in progress / ready / completed.
- Lists become clean rows with avatar, name, coloured status pill, priority/assignee, and a row menu.
- Optional right-hand panel for at-a-glance info (today's tasks / latest activity) on wide screens.

Applies to: admin console, owner console, live orders, kitchen screen.

## 2. Clients as boxes

In the admin console, restaurants (clients) are shown as a grid of cards instead of a list. Each card shows logo/initials, name, plan, number of branches, number of team accounts, orders today, and an open/closed indicator.

## 3. Client workspace page

Clicking a client card opens that client's own page (`/admin/client/<id>`) with its own side sections:

- Overview: key numbers for that client.
- Menu: items — add, edit, price, discount, out of stock today, branch assignment.
- Categories: add, rename, order.
- Menu layout: image style, card style, ordering (same controls the owner has).
- Branches: add/edit branch, hours, phone, address, map link, coordinates.
- Staff: create accounts, set role and branch, reset password, remove.
- Contact details: phone numbers, Instagram, hours.

The admin acts on the selected client, so the existing owner tools get an optional "which restaurant" input and the admin's identity is verified server-side before anything is changed.

## Technical notes

- New shared components under `src/components/console/`: rail navigation, page header with search, status chips, data row, panel card.
- `src/lib/owner.functions.ts` server functions gain an optional `restaurantId`; when present the caller must be a general admin, otherwise it resolves from the signed-in owner as today.
- New route `src/routes/_authenticated/admin.client.$clientId.tsx` reusing the existing menu/branches/team components.
- New admin server function returning per-client stats for the cards.
- Colours, radii and shadows added as design tokens in `src/styles.css`; no hard-coded colours in components.
