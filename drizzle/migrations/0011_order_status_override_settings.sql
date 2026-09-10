ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS owner_order_override boolean NOT NULL DEFAULT true;

CREATE TABLE IF NOT EXISTS public.platform_settings (
  id boolean PRIMARY KEY DEFAULT true,
  admin_order_override boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT platform_settings_singleton CHECK (id)
);

GRANT SELECT ON public.platform_settings TO authenticated;
GRANT ALL ON public.platform_settings TO service_role;

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS platform_settings_staff_read ON public.platform_settings;
CREATE POLICY platform_settings_staff_read ON public.platform_settings
  FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));

INSERT INTO public.platform_settings (id) VALUES (true) ON CONFLICT (id) DO NOTHING;