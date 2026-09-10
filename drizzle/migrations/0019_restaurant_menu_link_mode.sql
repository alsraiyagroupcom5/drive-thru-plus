ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS menu_link_mode text NOT NULL DEFAULT 'all_branches'
  CHECK (menu_link_mode IN ('all_branches', 'separate_branches'));

COMMENT ON COLUMN public.restaurants.menu_link_mode IS 'Controls whether guests use one restaurant link or branch-locked links.';