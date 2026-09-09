CREATE TABLE public.signup_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_name text NOT NULL,
  contact_name text NOT NULL,
  email text NOT NULL,
  phone text,
  branches_count integer NOT NULL DEFAULT 1,
  plan text NOT NULL DEFAULT 'growth',
  message text,
  status text NOT NULL DEFAULT 'NEW',
  created_at timestamptz NOT NULL DEFAULT now(),
  handled_at timestamptz
);

GRANT SELECT, UPDATE ON public.signup_requests TO authenticated;
GRANT ALL ON public.signup_requests TO service_role;

ALTER TABLE public.signup_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY signup_admin_read ON public.signup_requests
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY signup_admin_update ON public.signup_requests
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE INDEX signup_requests_created_idx ON public.signup_requests (created_at DESC);
