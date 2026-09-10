CREATE TABLE public.site_content (
  id boolean PRIMARY KEY DEFAULT true,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid,
  CONSTRAINT site_content_singleton CHECK (id = true)
);

GRANT SELECT ON public.site_content TO anon;
GRANT SELECT ON public.site_content TO authenticated;
GRANT ALL ON public.site_content TO service_role;

ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY site_content_read ON public.site_content FOR SELECT TO anon, authenticated USING (true);
