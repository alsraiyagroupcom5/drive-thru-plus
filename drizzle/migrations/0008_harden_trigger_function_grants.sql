REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.order_status_log() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.order_status_guard() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.next_order_number() FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_staff(uuid) FROM anon;