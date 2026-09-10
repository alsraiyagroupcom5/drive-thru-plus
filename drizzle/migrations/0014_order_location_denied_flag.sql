ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS location_denied boolean NOT NULL DEFAULT false;