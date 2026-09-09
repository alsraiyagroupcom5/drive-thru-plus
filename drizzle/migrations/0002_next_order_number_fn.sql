CREATE OR REPLACE FUNCTION public.next_order_number()
RETURNS text LANGUAGE sql VOLATILE SET search_path = public AS $$
  SELECT 'A' || nextval('public.order_seq')::text
$$;

GRANT EXECUTE ON FUNCTION public.next_order_number() TO service_role;