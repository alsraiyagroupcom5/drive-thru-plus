ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS prep_preference text NOT NULL DEFAULT 'ASAP',
  ADD COLUMN IF NOT EXISTS prep_delay_minutes integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS prepare_at timestamptz;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_prep_preference_check CHECK (prep_preference IN ('ASAP','SCHEDULED'));

ALTER TABLE public.orders
  ADD CONSTRAINT orders_prep_delay_check CHECK (prep_delay_minutes >= 0 AND prep_delay_minutes <= 240);