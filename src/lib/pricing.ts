/** Shared price helpers so discounts render and charge identically everywhere. */

export function effectivePrice(price: number | string, discountPercent?: number | string | null) {
  const base = Number(price) || 0;
  const pct = Math.min(Math.max(Number(discountPercent ?? 0) || 0, 0), 90);
  if (pct <= 0) return base;
  return Math.round(base * (1 - pct / 100) * 100) / 100;
}

export function hasDiscount(discountPercent?: number | string | null) {
  return (Number(discountPercent ?? 0) || 0) > 0;
}

/** Loyalty points per one currency unit spent (restaurant configurable). */
export function loyaltyRate(rate?: number | string | null) {
  const r = Number(rate ?? 1);
  if (!Number.isFinite(r) || r <= 0) return 1;
  return Math.min(Math.max(r, 0.01), 100);
}

/** Points earned for a total, using the restaurant's configured rate. */
export function loyaltyPointsForTotal(total: number | string, rate?: number | string | null) {
  return Math.max(0, Math.floor((Number(total) || 0) * loyaltyRate(rate)));
}

/** Local (Qatar) calendar day, used for "out of stock for today". */
export function todayISO(date = new Date()) {
  return new Date(date.getTime() + 3 * 60 * 60_000).toISOString().slice(0, 10);
}
