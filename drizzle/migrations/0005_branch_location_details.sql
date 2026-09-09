ALTER TABLE public.branches ADD COLUMN IF NOT EXISTS address_en TEXT;
ALTER TABLE public.branches ADD COLUMN IF NOT EXISTS address_ar TEXT;
ALTER TABLE public.branches ADD COLUMN IF NOT EXISTS maps_url TEXT;