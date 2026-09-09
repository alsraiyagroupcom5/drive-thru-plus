-- ==========================================================
-- MASAR Drive-Thru — core schema
-- ==========================================================

CREATE TYPE public.app_role AS ENUM (
  'super_admin','general_manager','branch_manager','cashier','kitchen','accounting','marketing'
);

CREATE TYPE public.order_status AS ENUM (
  'DRAFT','PENDING_PAYMENT','PAYMENT_FAILED','PAID','RECEIVED','ACCEPTED','PREPARING',
  'QUALITY_CHECK','READY','ARRIVING','PICKED_UP','COMPLETED','CANCELLED','REFUNDED'
);

CREATE TYPE public.payment_status AS ENUM ('PENDING','PAID','FAILED','REFUNDED');
CREATE TYPE public.payment_method AS ENUM ('CARD','APPLE_PAY','GOOGLE_PAY','PAY_AT_PICKUP');

-- ---------- tenancy ----------
CREATE TABLE public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en text NOT NULL,
  name_ar text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.restaurants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  slug text NOT NULL UNIQUE,
  name_en text NOT NULL,
  name_ar text NOT NULL,
  logo_url text,
  currency text NOT NULL DEFAULT 'QAR',
  tax_rate numeric(5,4) NOT NULL DEFAULT 0.0000,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.branches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  code text NOT NULL UNIQUE,
  name_en text NOT NULL,
  name_ar text NOT NULL,
  city_en text,
  city_ar text,
  lat numeric(9,6),
  lng numeric(9,6),
  opens_at time NOT NULL DEFAULT '07:00',
  closes_at time NOT NULL DEFAULT '02:00',
  is_open boolean NOT NULL DEFAULT true,
  avg_prep_minutes int NOT NULL DEFAULT 9,
  busy_level int NOT NULL DEFAULT 1,
  phone text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------- staff ----------
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  full_name text,
  email text,
  branch_id uuid REFERENCES public.branches(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  branch_id uuid REFERENCES public.branches(id) ON DELETE CASCADE,
  UNIQUE (user_id, role)
);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id)
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ---------- customers ----------
CREATE TABLE public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  phone text NOT NULL,
  full_name text,
  language text NOT NULL DEFAULT 'ar',
  birthday date,
  loyalty_points int NOT NULL DEFAULT 0,
  total_orders int NOT NULL DEFAULT 0,
  total_spent numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_order_at timestamptz,
  UNIQUE (restaurant_id, phone)
);

CREATE TABLE public.customer_vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  nickname text,
  plate text NOT NULL,
  make text,
  model text,
  color text,
  vehicle_type text,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.otp_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL,
  code text NOT NULL,
  channel text NOT NULL DEFAULT 'whatsapp',
  attempts int NOT NULL DEFAULT 0,
  consumed boolean NOT NULL DEFAULT false,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------- menu ----------
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  slug text NOT NULL,
  name_en text NOT NULL,
  name_ar text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  UNIQUE (restaurant_id, slug)
);

CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  sku text,
  name_en text NOT NULL,
  name_ar text NOT NULL,
  description_en text,
  description_ar text,
  price numeric(10,2) NOT NULL,
  image_url text,
  calories int,
  is_available boolean NOT NULL DEFAULT true,
  is_popular boolean NOT NULL DEFAULT false,
  is_new boolean NOT NULL DEFAULT false,
  is_spicy boolean NOT NULL DEFAULT false,
  allergens text[] NOT NULL DEFAULT '{}',
  prep_minutes int NOT NULL DEFAULT 6,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.product_modifiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name_en text NOT NULL,
  name_ar text NOT NULL,
  kind text NOT NULL DEFAULT 'single',
  is_required boolean NOT NULL DEFAULT false,
  max_select int NOT NULL DEFAULT 1,
  sort_order int NOT NULL DEFAULT 0
);

CREATE TABLE public.modifier_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  modifier_id uuid NOT NULL REFERENCES public.product_modifiers(id) ON DELETE CASCADE,
  name_en text NOT NULL,
  name_ar text NOT NULL,
  price_delta numeric(10,2) NOT NULL DEFAULT 0,
  is_default boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 0
);

CREATE TABLE public.branch_product_availability (
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  is_available boolean NOT NULL DEFAULT true,
  PRIMARY KEY (branch_id, product_id)
);

-- ---------- orders ----------
CREATE SEQUENCE public.order_seq START 1000;

CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  vehicle_id uuid REFERENCES public.customer_vehicles(id) ON DELETE SET NULL,
  order_number text NOT NULL UNIQUE,
  pickup_code text NOT NULL,
  status public.order_status NOT NULL DEFAULT 'RECEIVED',
  payment_status public.payment_status NOT NULL DEFAULT 'PENDING',
  payment_method public.payment_method NOT NULL DEFAULT 'PAY_AT_PICKUP',
  subtotal numeric(10,2) NOT NULL DEFAULT 0,
  discount numeric(10,2) NOT NULL DEFAULT 0,
  tax numeric(10,2) NOT NULL DEFAULT 0,
  total numeric(10,2) NOT NULL DEFAULT 0,
  points_earned int NOT NULL DEFAULT 0,
  notes text,
  vehicle_snapshot jsonb,
  customer_name text,
  customer_phone text,
  target_prep_minutes int NOT NULL DEFAULT 9,
  customer_arrived boolean NOT NULL DEFAULT false,
  arrived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  ready_at timestamptz,
  completed_at timestamptz
);

CREATE INDEX orders_branch_created_idx ON public.orders (branch_id, created_at DESC);
CREATE INDEX orders_status_idx ON public.orders (status);
CREATE INDEX orders_customer_idx ON public.orders (customer_id, created_at DESC);

CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  name_en text NOT NULL,
  name_ar text NOT NULL,
  quantity int NOT NULL DEFAULT 1,
  unit_price numeric(10,2) NOT NULL,
  line_total numeric(10,2) NOT NULL,
  notes text
);

CREATE TABLE public.order_item_modifiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_item_id uuid NOT NULL REFERENCES public.order_items(id) ON DELETE CASCADE,
  name_en text NOT NULL,
  name_ar text NOT NULL,
  price_delta numeric(10,2) NOT NULL DEFAULT 0
);

CREATE TABLE public.order_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status public.order_status NOT NULL,
  changed_by uuid,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  provider text NOT NULL DEFAULT 'mock',
  method public.payment_method NOT NULL,
  status public.payment_status NOT NULL DEFAULT 'PENDING',
  amount numeric(10,2) NOT NULL,
  reference text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor uuid,
  actor_label text,
  action text NOT NULL,
  entity text,
  entity_id uuid,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------- status machine ----------
CREATE OR REPLACE FUNCTION public.order_status_guard()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE allowed public.order_status[];
BEGIN
  IF NEW.status = OLD.status THEN RETURN NEW; END IF;
  allowed := CASE OLD.status
    WHEN 'DRAFT' THEN ARRAY['PENDING_PAYMENT','RECEIVED','CANCELLED']::public.order_status[]
    WHEN 'PENDING_PAYMENT' THEN ARRAY['PAID','PAYMENT_FAILED','CANCELLED']::public.order_status[]
    WHEN 'PAYMENT_FAILED' THEN ARRAY['PENDING_PAYMENT','CANCELLED']::public.order_status[]
    WHEN 'PAID' THEN ARRAY['RECEIVED','CANCELLED','REFUNDED']::public.order_status[]
    WHEN 'RECEIVED' THEN ARRAY['ACCEPTED','CANCELLED']::public.order_status[]
    WHEN 'ACCEPTED' THEN ARRAY['PREPARING','CANCELLED']::public.order_status[]
    WHEN 'PREPARING' THEN ARRAY['QUALITY_CHECK','READY','CANCELLED']::public.order_status[]
    WHEN 'QUALITY_CHECK' THEN ARRAY['READY','PREPARING','CANCELLED']::public.order_status[]
    WHEN 'READY' THEN ARRAY['ARRIVING','PICKED_UP','CANCELLED']::public.order_status[]
    WHEN 'ARRIVING' THEN ARRAY['PICKED_UP','CANCELLED']::public.order_status[]
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
END; $$;

CREATE TRIGGER trg_order_status_guard
BEFORE UPDATE OF status ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.order_status_guard();

CREATE OR REPLACE FUNCTION public.order_status_log()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' OR NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.order_status_history (order_id, status, changed_by)
    VALUES (NEW.id, NEW.status, auth.uid());
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_order_status_log
AFTER INSERT OR UPDATE OF status ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.order_status_log();

-- ---------- grants + RLS ----------
GRANT SELECT ON public.organizations TO anon, authenticated;
GRANT ALL ON public.organizations TO service_role;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY org_read ON public.organizations FOR SELECT TO anon, authenticated USING (true);

GRANT SELECT ON public.restaurants TO anon, authenticated;
GRANT ALL ON public.restaurants TO service_role;
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
CREATE POLICY rest_read ON public.restaurants FOR SELECT TO anon, authenticated USING (true);

GRANT SELECT ON public.branches TO anon, authenticated;
GRANT ALL ON public.branches TO service_role;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
CREATE POLICY branch_read ON public.branches FOR SELECT TO anon, authenticated USING (true);

GRANT SELECT ON public.categories TO anon, authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY cat_read ON public.categories FOR SELECT TO anon, authenticated USING (true);

GRANT SELECT ON public.products TO anon, authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY prod_read ON public.products FOR SELECT TO anon, authenticated USING (true);

GRANT SELECT ON public.product_modifiers TO anon, authenticated;
GRANT ALL ON public.product_modifiers TO service_role;
ALTER TABLE public.product_modifiers ENABLE ROW LEVEL SECURITY;
CREATE POLICY mod_read ON public.product_modifiers FOR SELECT TO anon, authenticated USING (true);

GRANT SELECT ON public.modifier_options TO anon, authenticated;
GRANT ALL ON public.modifier_options TO service_role;
ALTER TABLE public.modifier_options ENABLE ROW LEVEL SECURITY;
CREATE POLICY modopt_read ON public.modifier_options FOR SELECT TO anon, authenticated USING (true);

GRANT SELECT ON public.branch_product_availability TO anon, authenticated;
GRANT ALL ON public.branch_product_availability TO service_role;
ALTER TABLE public.branch_product_availability ENABLE ROW LEVEL SECURITY;
CREATE POLICY bpa_read ON public.branch_product_availability FOR SELECT TO anon, authenticated USING (true);

GRANT SELECT ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY profile_self ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY profile_update_self ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY roles_self ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

-- customer data: server-side only (service role)
GRANT ALL ON public.customers TO service_role;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.customers TO authenticated;
CREATE POLICY cust_staff_read ON public.customers FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

GRANT ALL ON public.customer_vehicles TO service_role;
GRANT SELECT ON public.customer_vehicles TO authenticated;
ALTER TABLE public.customer_vehicles ENABLE ROW LEVEL SECURITY;
CREATE POLICY veh_staff_read ON public.customer_vehicles FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

GRANT ALL ON public.otp_requests TO service_role;
ALTER TABLE public.otp_requests ENABLE ROW LEVEL SECURITY;

-- orders: staff read/update, customers via server functions
GRANT SELECT, UPDATE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY order_staff_read ON public.orders FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY order_staff_update ON public.orders FOR UPDATE TO authenticated USING (public.is_staff(auth.uid()));

GRANT SELECT ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY oi_staff_read ON public.order_items FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

GRANT SELECT ON public.order_item_modifiers TO authenticated;
GRANT ALL ON public.order_item_modifiers TO service_role;
ALTER TABLE public.order_item_modifiers ENABLE ROW LEVEL SECURITY;
CREATE POLICY oim_staff_read ON public.order_item_modifiers FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

GRANT SELECT ON public.order_status_history TO authenticated;
GRANT ALL ON public.order_status_history TO service_role;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY osh_staff_read ON public.order_status_history FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

GRANT SELECT ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY pay_staff_read ON public.payments FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

GRANT SELECT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY audit_staff_read ON public.audit_logs FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

-- realtime
ALTER TABLE public.orders REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
