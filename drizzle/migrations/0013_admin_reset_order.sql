CREATE OR REPLACE FUNCTION public.order_status_guard()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE allowed public.order_status[];
BEGIN
  IF coalesce(current_setting('app.order_reset', true), 'off') = 'on' THEN
    RETURN NEW;
  END IF;
  IF NEW.status = OLD.status THEN RETURN NEW; END IF;
  allowed := CASE OLD.status
    WHEN 'DRAFT' THEN ARRAY['PENDING_PAYMENT','RECEIVED','CANCELLED']::public.order_status[]
    WHEN 'PENDING_PAYMENT' THEN ARRAY['PAID','PAYMENT_FAILED','CANCELLED']::public.order_status[]
    WHEN 'PAYMENT_FAILED' THEN ARRAY['PENDING_PAYMENT','CANCELLED']::public.order_status[]
    WHEN 'PAID' THEN ARRAY['RECEIVED','CANCELLED','REFUNDED']::public.order_status[]
    WHEN 'RECEIVED' THEN ARRAY['ACCEPTED','PREPARING','CANCELLED']::public.order_status[]
    WHEN 'ACCEPTED' THEN ARRAY['PREPARING','CANCELLED']::public.order_status[]
    WHEN 'PREPARING' THEN ARRAY['QUALITY_CHECK','READY','CANCELLED']::public.order_status[]
    WHEN 'QUALITY_CHECK' THEN ARRAY['READY','PREPARING','CANCELLED']::public.order_status[]
    WHEN 'READY' THEN ARRAY['ARRIVING','PICKED_UP','COMPLETED','CANCELLED']::public.order_status[]
    WHEN 'ARRIVING' THEN ARRAY['PICKED_UP','COMPLETED','CANCELLED']::public.order_status[]
    WHEN 'PICKED_UP' THEN ARRAY['COMPLETED']::public.order_status[]
    WHEN 'COMPLETED' THEN ARRAY['REFUNDED']::public.order_status[]
    ELSE ARRAY[]::public.order_status[]
  END;
  IF NOT (NEW.status = ANY(allowed)) THEN
    RAISE EXCEPTION 'Invalid order status transition % -> %', OLD.status, NEW.status;
  END IF;
  IF NEW.status = 'READY' THEN NEW.ready_at := now(); END IF;
  IF NEW.status = 'COMPLETED' THEN NEW.completed_at := now(); END IF;
  RETURN NEW;
END; $function$;

CREATE OR REPLACE FUNCTION public.admin_reset_order(_order_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM set_config('app.order_reset', 'on', true);
  UPDATE public.orders
     SET status = 'RECEIVED',
         ready_at = NULL,
         completed_at = NULL,
         customer_arrived = false,
         arrived_at = NULL,
         arrival_method = NULL,
         created_at = now()
   WHERE id = _order_id;
  PERFORM set_config('app.order_reset', 'off', true);
END; $function$;

REVOKE ALL ON FUNCTION public.admin_reset_order(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_reset_order(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.admin_reset_order(uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.admin_reset_order(uuid) TO service_role;