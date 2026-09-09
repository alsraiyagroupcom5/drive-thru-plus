ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS discount_percent numeric NOT NULL DEFAULT 0;

ALTER TABLE public.branch_product_availability
  ADD COLUMN IF NOT EXISTS out_of_stock_on date;