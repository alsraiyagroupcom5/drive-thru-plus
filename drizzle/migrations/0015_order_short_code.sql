-- Add short public tracking code to orders.
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS short_code text;

-- Unique partial index: only non-null short codes must be unique.
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_short_code ON public.orders (short_code) WHERE short_code IS NOT NULL;

-- Helper to generate a unique short code for an order row.
CREATE OR REPLACE FUNCTION public.generate_order_short_code(_length integer DEFAULT 5)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
  i integer;
  ok boolean := false;
BEGIN
  WHILE NOT ok LOOP
    result := '';
    FOR i IN 1.._length LOOP
      result := result || substr(chars, floor(random() * length(chars))::integer + 1, 1);
    END LOOP;
    ok := NOT EXISTS (SELECT 1 FROM public.orders WHERE short_code = result);
  END LOOP;
  RETURN result;
END;
$$;

-- Backfill existing orders that don't have a short code yet.
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN SELECT id FROM public.orders WHERE short_code IS NULL LOOP
    UPDATE public.orders
    SET short_code = public.generate_order_short_code(5)
    WHERE id = r.id;
  END LOOP;
END;
$$;

-- Ensure future inserts get a short code automatically if not provided.
CREATE OR REPLACE FUNCTION public.ensure_order_short_code()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.short_code IS NULL THEN
    NEW.short_code := public.generate_order_short_code(5);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ensure_order_short_code ON public.orders;
CREATE TRIGGER trg_ensure_order_short_code
BEFORE INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.ensure_order_short_code();

-- Grant execute on the helper so authenticated/server roles can use it if needed.
GRANT EXECUTE ON FUNCTION public.generate_order_short_code(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_order_short_code(integer) TO service_role;
