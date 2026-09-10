import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const RESTAURANT_ID = "22222222-2222-2222-2222-222222222222";

/**
 * Staff read-only view of a customer order tracking page.
 * Accepts either the order UUID or its short public code.
 */
export const getOrderForStaff = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { orderId: string }) => d)
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.orderId);
    let q = supabaseAdmin
      .from("orders")
      .select(
        "*, branches(name_en, name_ar, phone), order_items(*, order_item_modifiers(*)), order_status_history(status, created_at)",
      );
    if (isUuid) q = q.eq("id", data.orderId);
    else q = q.eq("short_code", data.orderId.toUpperCase());
    const { data: order, error } = await q.maybeSingle();
    if (error || !order) throw new Error("ORDER_NOT_FOUND");
    const roleClient = context.supabase as {
      rpc: (fn: "has_branch_access", args: { _user_id: string; _branch_id: string }) => PromiseLike<{ data: unknown }>;
    };
    const { data: allowed } = await roleClient.rpc("has_branch_access", {
      _user_id: context.userId,
      _branch_id: order.branch_id,
    });
    if (allowed !== true) throw new Error("FORBIDDEN");
    return order;
  });
