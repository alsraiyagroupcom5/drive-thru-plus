-- Data API grants: RLS policies already exist but PostgREST roles had no table privileges.
GRANT SELECT ON public.restaurants, public.organizations, public.branches, public.categories,
  public.products, public.product_modifiers, public.modifier_options,
  public.branch_product_availability TO anon, authenticated;

GRANT SELECT ON public.customers, public.customer_vehicles, public.order_items,
  public.order_item_modifiers, public.order_status_history, public.payments,
  public.audit_logs, public.user_roles TO authenticated;

GRANT SELECT, UPDATE ON public.orders TO authenticated;
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, UPDATE ON public.signup_requests TO authenticated;

GRANT ALL ON public.restaurants, public.organizations, public.branches, public.categories,
  public.products, public.product_modifiers, public.modifier_options,
  public.branch_product_availability, public.customers, public.customer_vehicles,
  public.orders, public.order_items, public.order_item_modifiers, public.order_status_history,
  public.payments, public.audit_logs, public.user_roles, public.profiles,
  public.signup_requests, public.otp_requests TO service_role;