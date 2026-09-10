ALTER TABLE public.user_roles
  ADD COLUMN IF NOT EXISTS restaurant_id uuid REFERENCES public.restaurants(id) ON DELETE CASCADE;

UPDATE public.user_roles ur
SET restaurant_id = b.restaurant_id
FROM public.branches b
WHERE ur.branch_id = b.id
  AND ur.restaurant_id IS NULL;

UPDATE public.user_roles
SET restaurant_id = '22222222-2222-2222-2222-222222222222'::uuid
WHERE role = 'general_manager'
  AND restaurant_id IS NULL;

CREATE INDEX IF NOT EXISTS user_roles_restaurant_id_idx ON public.user_roles(restaurant_id);

CREATE TABLE public.login_security_state (
  principal_hash text PRIMARY KEY,
  failed_count integer NOT NULL DEFAULT 0,
  window_started_at timestamptz NOT NULL DEFAULT now(),
  last_failed_at timestamptz NOT NULL DEFAULT now(),
  locked_until timestamptz
);
GRANT ALL ON public.login_security_state TO service_role;
ALTER TABLE public.login_security_state ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.security_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type text NOT NULL,
  severity text NOT NULL DEFAULT 'high',
  title text NOT NULL,
  message text NOT NULL,
  attempted_email text,
  ip_hash text,
  attempt_count integer NOT NULL DEFAULT 0,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz,
  email_sent_at timestamptz
);
GRANT SELECT, UPDATE ON public.security_alerts TO authenticated;
GRANT ALL ON public.security_alerts TO service_role;
ALTER TABLE public.security_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY security_alerts_admin_read
ON public.security_alerts FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY security_alerts_admin_update
ON public.security_alerts FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));
CREATE INDEX security_alerts_created_at_idx ON public.security_alerts(created_at DESC);
CREATE INDEX security_alerts_unread_idx ON public.security_alerts(read_at) WHERE read_at IS NULL;

CREATE OR REPLACE FUNCTION public.has_restaurant_access(_user_id uuid, _restaurant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = _user_id
      AND (
        ur.role = 'super_admin'
        OR (ur.role = 'general_manager' AND ur.restaurant_id = _restaurant_id)
        OR (
          ur.role IN ('branch_manager', 'cashier', 'kitchen', 'accounting', 'marketing')
          AND EXISTS (
            SELECT 1 FROM public.branches b
            WHERE b.id = ur.branch_id AND b.restaurant_id = _restaurant_id
          )
        )
      )
  )
$$;

CREATE OR REPLACE FUNCTION public.has_branch_access(_user_id uuid, _branch_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    LEFT JOIN public.branches b ON b.id = _branch_id
    WHERE ur.user_id = _user_id
      AND (
        ur.role = 'super_admin'
        OR (ur.role = 'general_manager' AND ur.restaurant_id = b.restaurant_id)
        OR (ur.branch_id = _branch_id AND ur.role IN ('branch_manager', 'cashier', 'kitchen', 'accounting', 'marketing'))
      )
  )
$$;

CREATE OR REPLACE FUNCTION public.register_login_failure(
  _email text,
  _email_hash text,
  _ip_hash text,
  _user_agent text
)
RETURNS TABLE(failed_count integer, locked_until timestamptz, alert_created boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  email_key text := 'email:' || _email_hash;
  ip_key text := 'ip:' || _ip_hash;
  email_state public.login_security_state%ROWTYPE;
  ip_state public.login_security_state%ROWTYPE;
  now_at timestamptz := now();
  created boolean := false;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(email_key, 0));

  INSERT INTO public.login_security_state(principal_hash, failed_count, window_started_at, last_failed_at, locked_until)
  VALUES (email_key, 1, now_at, now_at, NULL)
  ON CONFLICT (principal_hash) DO UPDATE SET
    failed_count = CASE
      WHEN login_security_state.window_started_at < now_at - interval '15 minutes' THEN 1
      ELSE login_security_state.failed_count + 1
    END,
    window_started_at = CASE
      WHEN login_security_state.window_started_at < now_at - interval '15 minutes' THEN now_at
      ELSE login_security_state.window_started_at
    END,
    last_failed_at = now_at,
    locked_until = CASE
      WHEN (CASE WHEN login_security_state.window_started_at < now_at - interval '15 minutes' THEN 1 ELSE login_security_state.failed_count + 1 END) >= 5
        THEN now_at + interval '30 minutes'
      ELSE login_security_state.locked_until
    END
  RETURNING * INTO email_state;

  INSERT INTO public.login_security_state(principal_hash, failed_count, window_started_at, last_failed_at, locked_until)
  VALUES (ip_key, 1, now_at, now_at, NULL)
  ON CONFLICT (principal_hash) DO UPDATE SET
    failed_count = CASE
      WHEN login_security_state.window_started_at < now_at - interval '15 minutes' THEN 1
      ELSE login_security_state.failed_count + 1
    END,
    window_started_at = CASE
      WHEN login_security_state.window_started_at < now_at - interval '15 minutes' THEN now_at
      ELSE login_security_state.window_started_at
    END,
    last_failed_at = now_at,
    locked_until = CASE
      WHEN (CASE WHEN login_security_state.window_started_at < now_at - interval '15 minutes' THEN 1 ELSE login_security_state.failed_count + 1 END) >= 5
        THEN now_at + interval '30 minutes'
      ELSE login_security_state.locked_until
    END
  RETURNING * INTO ip_state;

  IF email_state.failed_count = 5 THEN
    INSERT INTO public.security_alerts(alert_type, severity, title, message, attempted_email, ip_hash, attempt_count, details)
    VALUES (
      'repeated_login_failures',
      'high',
      'Repeated failed sign-in attempts',
      'An account was temporarily locked after five failed sign-in attempts.',
      left(_email, 160),
      _ip_hash,
      email_state.failed_count,
      jsonb_build_object('user_agent', left(coalesce(_user_agent, ''), 300), 'locked_until', email_state.locked_until)
    );
    created := true;
  END IF;

  RETURN QUERY SELECT greatest(email_state.failed_count, ip_state.failed_count), greatest(email_state.locked_until, ip_state.locked_until), created;
END;
$$;

CREATE OR REPLACE FUNCTION public.clear_login_failures(_email_hash text, _ip_hash text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.login_security_state
  WHERE principal_hash IN ('email:' || _email_hash, 'ip:' || _ip_hash)
$$;

REVOKE ALL ON FUNCTION public.has_restaurant_access(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_restaurant_access(uuid, uuid) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.has_branch_access(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_branch_access(uuid, uuid) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.register_login_failure(text, text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.register_login_failure(text, text, text, text) TO service_role;
REVOKE ALL ON FUNCTION public.clear_login_failures(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.clear_login_failures(text, text) TO service_role;
REVOKE ALL ON FUNCTION public.admin_reset_order(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_reset_order(uuid) TO service_role;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role, supabase_auth_admin;
REVOKE ALL ON FUNCTION public.order_status_log() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.order_status_log() TO service_role;
REVOKE ALL ON FUNCTION public.ensure_order_short_code() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_order_short_code() TO service_role;
REVOKE ALL ON FUNCTION public.order_status_guard() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.order_status_guard() TO service_role;
REVOKE ALL ON FUNCTION public.next_order_number() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.next_order_number() TO service_role;
REVOKE ALL ON FUNCTION public.generate_order_short_code(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.generate_order_short_code(integer) TO service_role;
REVOKE ALL ON FUNCTION public.is_staff(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

DROP POLICY IF EXISTS order_staff_read ON public.orders;
CREATE POLICY order_staff_read ON public.orders FOR SELECT TO authenticated
USING (public.has_branch_access(auth.uid(), branch_id));
DROP POLICY IF EXISTS order_staff_update ON public.orders;
CREATE POLICY order_staff_update ON public.orders FOR UPDATE TO authenticated
USING (public.has_branch_access(auth.uid(), branch_id))
WITH CHECK (public.has_branch_access(auth.uid(), branch_id));

DROP POLICY IF EXISTS cust_staff_read ON public.customers;
CREATE POLICY cust_staff_read ON public.customers FOR SELECT TO authenticated
USING (public.has_restaurant_access(auth.uid(), restaurant_id));
DROP POLICY IF EXISTS veh_staff_read ON public.customer_vehicles;
CREATE POLICY veh_staff_read ON public.customer_vehicles FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.customers c
  WHERE c.id = customer_vehicles.customer_id
    AND public.has_restaurant_access(auth.uid(), c.restaurant_id)
));
DROP POLICY IF EXISTS oi_staff_read ON public.order_items;
CREATE POLICY oi_staff_read ON public.order_items FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.orders o
  WHERE o.id = order_items.order_id
    AND public.has_branch_access(auth.uid(), o.branch_id)
));
DROP POLICY IF EXISTS oim_staff_read ON public.order_item_modifiers;
CREATE POLICY oim_staff_read ON public.order_item_modifiers FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.order_items oi
  JOIN public.orders o ON o.id = oi.order_id
  WHERE oi.id = order_item_modifiers.order_item_id
    AND public.has_branch_access(auth.uid(), o.branch_id)
));
DROP POLICY IF EXISTS osh_staff_read ON public.order_status_history;
CREATE POLICY osh_staff_read ON public.order_status_history FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.orders o
  WHERE o.id = order_status_history.order_id
    AND public.has_branch_access(auth.uid(), o.branch_id)
));
DROP POLICY IF EXISTS pay_staff_read ON public.payments;
CREATE POLICY pay_staff_read ON public.payments FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.orders o
  WHERE o.id = payments.order_id
    AND public.has_branch_access(auth.uid(), o.branch_id)
));
DROP POLICY IF EXISTS audit_staff_read ON public.audit_logs;
CREATE POLICY audit_staff_read ON public.audit_logs FOR SELECT TO authenticated
USING (actor = auth.uid() OR public.has_role(auth.uid(), 'super_admin'));
DROP POLICY IF EXISTS profile_self ON public.profiles;
CREATE POLICY profile_self ON public.profiles FOR SELECT TO authenticated
USING (
  id = auth.uid()
  OR public.has_role(auth.uid(), 'super_admin')
  OR EXISTS (
    SELECT 1 FROM public.user_roles mine
    JOIN public.user_roles target ON target.user_id = profiles.id
    WHERE mine.user_id = auth.uid()
      AND mine.role = 'general_manager'
      AND mine.restaurant_id IS NOT NULL
      AND target.restaurant_id = mine.restaurant_id
  )
);