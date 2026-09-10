ALTER TABLE public.branches
  ADD COLUMN IF NOT EXISTS tracking_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS arrival_radius_m integer NOT NULL DEFAULT 200,
  ADD COLUMN IF NOT EXISTS approach_radius_m integer NOT NULL DEFAULT 1500,
  ADD COLUMN IF NOT EXISTS avg_speed_kmh integer NOT NULL DEFAULT 32,
  ADD COLUMN IF NOT EXISTS location_ping_seconds integer NOT NULL DEFAULT 15,
  ADD COLUMN IF NOT EXISTS auto_arrival boolean NOT NULL DEFAULT true;