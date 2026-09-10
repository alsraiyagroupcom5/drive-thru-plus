/** Shared geo helpers for drive-thru arrival tracking. */

export const ARRIVAL_RADIUS_KM = 0.2;
export const DEFAULT_SPEED_KMH = 32;

export type TrackingConfig = {
  /** Radius, in km, where the customer counts as arrived at the branch. */
  arrivalRadiusKm: number;
  /** Average driving speed used for the ETA estimate. */
  avgSpeedKmh: number;
};

export const DEFAULT_TRACKING: TrackingConfig = {
  arrivalRadiusKm: ARRIVAL_RADIUS_KM,
  avgSpeedKmh: DEFAULT_SPEED_KMH,
};

/** Build a config from raw branch settings columns. */
export function trackingFromBranch(branch: {
  arrival_radius_m?: number | null;
  avg_speed_kmh?: number | null;
}): TrackingConfig {
  const radius = Number(branch.arrival_radius_m);
  const speed = Number(branch.avg_speed_kmh);
  return {
    arrivalRadiusKm: Number.isFinite(radius) && radius > 0 ? radius / 1000 : ARRIVAL_RADIUS_KM,
    avgSpeedKmh: Number.isFinite(speed) && speed > 0 ? speed : DEFAULT_SPEED_KMH,
  };
}

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
export function driveMinutes(distanceKm: number, config: TrackingConfig = DEFAULT_TRACKING): number {
  if (distanceKm <= config.arrivalRadiusKm) return 0;
  return Math.max(1, Math.round((distanceKm / config.avgSpeedKmh) * 60) + 1);
}

/** Always renders western digits, per project rule. */
export function formatKm(distanceKm: number, lang: "ar" | "en"): string {
  const value = distanceKm < 1 ? `${Math.round(distanceKm * 1000)}` : distanceKm.toFixed(1);
  const unit = distanceKm < 1 ? (lang === "ar" ? "م" : "m") : lang === "ar" ? "كم" : "km";
  return `${value} ${unit}`;
}
