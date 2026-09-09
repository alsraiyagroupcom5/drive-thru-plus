# Smart Drive-Thru Platform — Phase 1

A premium, Arabic-first (English switch) drive-thru ordering platform. Phase 1 delivers the full customer ordering journey plus the two screens that keep it running live: the kitchen display and the branch live-orders screen. Payment and the phone verification code are simulated so everything is testable today, with clean swap points for real providers later.

## Brand

Invented premium demo brand: **مسار / MASAR** — a Gulf drive-thru grill concept. Dark charcoal base, warm sand and brass accents, generous whitespace, large food photography, quiet motion. Not a generic food-delivery look.

## What the customer can do

1. Open by QR link or website. A branch code in the link selects the branch automatically; otherwise pick from a branch list showing open/closed status, prep time and busy level.
2. Browse a visual menu by category with badges (popular, new, spicy, unavailable) and search in Arabic or English.
3. Open a product, choose size/bread/cheese, add extras, remove ingredients, set quantity — price updates instantly.
4. See a "make it a meal" upgrade prompt and 2–3 relevant add-on suggestions, no more.
5. Sticky cart with items, modifiers, discounts, tax and total.
6. Sign in with phone number and a 6-digit code (shown on screen in demo mode, no password).
7. Save a vehicle (nickname, plate, type, make, model, colour) and pick one at checkout.
8. Choose pay-at-pickup or a simulated card payment; get a confirmation screen with order number and pickup QR.
9. Live tracking timeline: received → preparing → quality check → ready → picked up, with an "I'm here" button that alerts the branch.
10. Order history with one-tap "order again" and favourites.

## What staff can do

**Kitchen display** — big-touch columns for New / Preparing / Ready, each ticket showing items, modifiers, notes, elapsed time and target, with colour + icon + text urgency (normal / approaching / overdue). Staff advance tickets with one tap.

**Branch live screen** — KPI strip (live orders, sales today, orders today, average order value, average prep time, delayed count), a filterable live order table (order, time, customer, vehicle, value, payment, kitchen status, elapsed), and arrival alerts when a customer presses "I'm here". Everything updates without refreshing.

**Staff sign-in** — email/password with roles; Phase 1 uses branch manager, cashier and kitchen roles.

## Demo data

3 branches, ~50 products across categories with modifiers, ~100 customers, ~200 orders in mixed states, with realistic Arabic and English names and prices in QAR — so every screen looks alive on first open.

## Technical approach

- Lovable Cloud for the database, auth, storage and realtime.
- Multi-tenant schema from the start: organizations → restaurants → branches → users/menu/orders/customers. Phase 1 creates the tables it uses (organizations, restaurants, branches, profiles, user_roles, customers, customer_vehicles, categories, products, product_modifiers, modifier_options, orders, order_items, order_item_modifiers, order_status_history, payments, otp_requests, pickup_codes, qr_codes, audit_logs) and leaves loyalty/promotions/reporting tables for the next phase.
- Roles live in a separate `user_roles` table checked by a security-definer function; row-level security on every table, scoped per branch and per customer. Customers read their own orders only; staff read their branch.
- Order status is a strict state machine with a recorded history; invalid transitions rejected server-side.
- Realtime subscriptions push order changes to kitchen, branch screen and customer tracking.
- Provider abstraction layer with mock adapters for payment, WhatsApp/SMS and POS, so a real provider is a config swap, not a rewrite.
- Arabic-first i18n with true RTL layout mirroring, English toggle persisted per customer.
- Mobile-first customer UI, desktop/tablet staff UI, PWA manifest, skeleton loading, empty and error states, accessible contrast and touch targets.

## Not in this phase

Loyalty and rewards, gamification, referrals, promotions engine, CRM and segmentation, marketing automation, general manager and accounting dashboards, reports and exports, super-admin console, AI assistant, scheduled orders, location-based arrival. The schema and event model are designed so these attach to the same order engine without rework.
