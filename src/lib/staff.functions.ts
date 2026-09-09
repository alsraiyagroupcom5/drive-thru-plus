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

    const { error } = await supabaseAdmin.from("user_roles").upsert(
      {
        user_id: context.userId,
        role: data.role,
        restaurant_id: RESTAURANT_ID,
        branch_id: data.branchId,
      } as never,
      { onConflict: "user_id,role" },
    );
    if (error) throw new Error(error.message);

    return { ok: true };
  });
