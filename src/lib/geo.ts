/** Shared geo helpers for drive-thru arrival tracking. */

export const ARRIVAL_RADIUS_KM = 0.2;
const AVG_CITY_SPEED_KMH = 32;

export function haversineKm(
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number,
): number {
  const R = 6371;
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(s)) * 100) / 100;
}

/** Rough drive time in minutes for a straight-line distance. */
export function driveMinutes(distanceKm: number): number {
  if (distanceKm <= ARRIVAL_RADIUS_KM) return 0;
  return Math.max(1, Math.round((distanceKm / AVG_CITY_SPEED_KMH) * 60) + 1);
}

/** Always renders western digits, per project rule. */
export function formatKm(distanceKm: number, lang: "ar" | "en"): string {
  const value = distanceKm < 1 ? `${Math.round(distanceKm * 1000)}` : distanceKm.toFixed(1);
  const unit = distanceKm < 1 ? (lang === "ar" ? "م" : "m") : lang === "ar" ? "كم" : "km";
  return `${value} ${unit}`;
}
