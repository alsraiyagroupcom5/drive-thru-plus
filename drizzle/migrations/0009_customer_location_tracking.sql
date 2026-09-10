ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS customer_lat numeric,
  ADD COLUMN IF NOT EXISTS customer_lng numeric,
  ADD COLUMN IF NOT EXISTS distance_km numeric,
  ADD COLUMN IF NOT EXISTS eta_minutes integer,
  ADD COLUMN IF NOT EXISTS location_updated_at timestamptz,
  ADD COLUMN IF NOT EXISTS arrival_method text;