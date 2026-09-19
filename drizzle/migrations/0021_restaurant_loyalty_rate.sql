ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS loyalty_points_per_currency numeric NOT NULL DEFAULT 1;