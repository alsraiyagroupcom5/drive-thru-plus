CREATE OR REPLACE FUNCTION public.check_login_allowed(_email_hash text, _ip_hash text)
RETURNS TABLE(allowed boolean, locked_until timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    coalesce(max(s.locked_until) <= now() OR max(s.locked_until) IS NULL, true) AS allowed,
    max(s.locked_until) AS locked_until
  FROM public.login_security_state s
  WHERE s.principal_hash IN ('email:' || _email_hash, 'ip:' || _ip_hash)
$$;

REVOKE ALL ON FUNCTION public.check_login_allowed(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_login_allowed(text, text) TO service_role;

REVOKE UPDATE ON public.orders FROM authenticated;
GRANT UPDATE (status, ready_at, completed_at) ON public.orders TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_reset_order(_order_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'super_admin') AND current_user NOT IN ('postgres', 'service_role') THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;
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
END;
$$;
REVOKE ALL ON FUNCTION public.admin_reset_order(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_reset_order(uuid) TO service_role;