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

/** Local (Qatar) calendar day, used for "out of stock for today". */
export function todayISO(date = new Date()) {
  return new Date(date.getTime() + 3 * 60 * 60_000).toISOString().slice(0, 10);
}
