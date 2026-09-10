import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const RESTAURANT_ID = "22222222-2222-2222-2222-222222222222";

/**
 * Demo onboarding: gives the signed-in staff member a role at a branch so the
 * kitchen and live screens are usable immediately. Real deployments would
 * invite staff from a manager console instead.
 */
export const claimStaffRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { role: "kitchen" | "branch_manager"; branchId: string }) => d)
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: branch } = await supabaseAdmin
      .from("branches")
      .select("id")
      .eq("id", data.branchId)
      .eq("restaurant_id", RESTAURANT_ID)
      .maybeSingle();
    if (!branch) throw new Error("BRANCH_NOT_FOUND");

    const rolesTable = supabaseAdmin.from("user_roles") as unknown as {
      upsert: (
        values: { user_id: string; role: string; branch_id: string },
        options: { onConflict: string },
      ) => Promise<{ error: { message: string } | null }>;
    };
    const { error } = await rolesTable.upsert(
      { user_id: context.userId, role: data.role, branch_id: data.branchId },
      { onConflict: "user_id,role" },
    );
    if (error) throw new Error(error.message);

    return { ok: true };
  });

/**
 * Staff read-only view of a customer order tracking page.
 * Accepts either the order UUID or its short public code.
 */
export const getOrderForStaff = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { orderId: string }) => d)
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const roleClient = context.supabase as {
      rpc: (fn: "is_staff", args: { _user_id: string }) => PromiseLike<{ data: unknown }>;
    };
    const { data: staff } = await roleClient.rpc("is_staff", { _user_id: context.userId });
    if (staff !== true) throw new Error("FORBIDDEN");

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.orderId);
    let q = supabaseAdmin
      .from("orders")
      .select(
        "*, branches(name_en, name_ar, phone), order_items(*, order_item_modifiers(*)), order_status_history(status, created_at)",
      )
      .eq("restaurant_id", RESTAURANT_ID);
    if (isUuid) q = q.eq("id", data.orderId);
    else q = q.eq("short_code", data.orderId.toUpperCase());
    const { data: order, error } = await q.maybeSingle();
    if (error || !order) throw new Error("ORDER_NOT_FOUND");
    return order;
  });
