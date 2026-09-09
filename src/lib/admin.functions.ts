import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const RESTAURANT_ID = "22222222-2222-2222-2222-222222222222";

type StaffRole = "general_manager" | "branch_manager" | "cashier" | "kitchen";
const STAFF_ROLES: StaffRole[] = ["general_manager", "branch_manager", "cashier", "kitchen"];

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

/** Admin (super_admin) or restaurant owner (general_manager) may manage accounts. */
async function assertSuperAdmin(supabase: unknown, userId: string) {
  const client = supabase as {
    rpc: (
      fn: "has_role",
      args: { _user_id: string; _role: "super_admin" | "general_manager" },
    ) => PromiseLike<{ data: unknown }>;
  };
  const [{ data: isAdmin }, { data: isOwner }] = await Promise.all([
    client.rpc("has_role", { _user_id: userId, _role: "super_admin" }),
    client.rpc("has_role", { _user_id: userId, _role: "general_manager" }),
  ]);
  if (isAdmin !== true && isOwner !== true) throw new Error("FORBIDDEN");
}



/** Whether the signed-in user is the general admin, and whether one exists at all. */
export const adminStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = await admin();
    const { count } = await db
      .from("user_roles")
      .select("id", { count: "exact", head: true })
      .eq("role", "super_admin");
    const { data: mine } = await db
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "super_admin")
      .maybeSingle();
    return { isSuperAdmin: !!mine, superAdminExists: (count ?? 0) > 0 };
  });

/** First-run bootstrap: if no general admin exists yet, the signed-in user becomes one. */
export const claimSuperAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = await admin();
    const { count } = await db
      .from("user_roles")
      .select("id", { count: "exact", head: true })
      .eq("role", "super_admin");
    if ((count ?? 0) > 0) throw new Error("SUPER_ADMIN_EXISTS");
    const { error } = await db
      .from("user_roles")
      .insert({ user_id: context.userId, role: "super_admin", branch_id: null });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listClients = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertSuperAdmin(context.supabase, context.userId);
    const db = await admin();

    const { data: roles } = await db
      .from("user_roles")
      .select("id, user_id, role, branch_id, branches(id, name_en, name_ar, code)");
    const ids = [...new Set((roles ?? []).map((r) => r.user_id))];
    const { data: profiles } = ids.length
      ? await db.from("profiles").select("id, full_name, email, branch_id").in("id", ids)
      : { data: [] };
    const byId = new Map((profiles ?? []).map((p) => [p.id, p]));

    const { data: branches } = await db
      .from("branches")
      .select("id, code, name_en, name_ar, city_en, city_ar, is_open")
      .eq("restaurant_id", RESTAURANT_ID)
      .order("name_en");

    return {
      accounts: (roles ?? []).map((r) => ({
        id: r.id,
        userId: r.user_id,
        role: r.role as string,
        branch: r.branches,
        fullName: byId.get(r.user_id)?.full_name ?? null,
        email: byId.get(r.user_id)?.email ?? null,
      })),
      branches: branches ?? [],
    };
  });

export const createClientAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      email: string;
      password: string;
      fullName: string;
      role: StaffRole;
      branchId?: string | null;
      newBranch?: { name_en: string; name_ar: string; code: string; city_en?: string; city_ar?: string } | null;
    }) => d,
  )
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.supabase, context.userId);
    if (!STAFF_ROLES.includes(data.role)) throw new Error("INVALID_ROLE");
    const email = data.email.trim().toLowerCase();
    if (!email.includes("@")) throw new Error("INVALID_EMAIL");
    if (data.password.length < 8) throw new Error("WEAK_PASSWORD");

    const db = await admin();

    // Resolve the branch: either an existing one, or create it for this client.
    let branchId = data.branchId ?? null;
    if (!branchId) {
      const nb = data.newBranch;
      if (!nb?.name_en?.trim() || !nb?.name_ar?.trim() || !nb?.code?.trim())
        throw new Error("BRANCH_REQUIRED");
      const { data: branch, error: branchError } = await db
        .from("branches")
        .insert({
          restaurant_id: RESTAURANT_ID,
          code: nb.code.trim().toUpperCase().slice(0, 20),
          name_en: nb.name_en.trim().slice(0, 80),
          name_ar: nb.name_ar.trim().slice(0, 80),
          city_en: nb.city_en?.trim().slice(0, 60) || null,
          city_ar: nb.city_ar?.trim().slice(0, 60) || null,
        })
        .select("id")
        .single();
      if (branchError || !branch) throw new Error(branchError?.message ?? "BRANCH_CREATE_FAILED");
      branchId = branch.id;
    } else {
      const { data: exists } = await db
        .from("branches")
        .select("id")
        .eq("id", branchId)
        .eq("restaurant_id", RESTAURANT_ID)
        .maybeSingle();
      if (!exists) throw new Error("BRANCH_NOT_FOUND");
    }

    const { data: created, error: userError } = await db.auth.admin.createUser({
      email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.fullName.trim().slice(0, 80) },
    });
    if (userError || !created?.user) throw new Error(userError?.message ?? "USER_CREATE_FAILED");
    const userId = created.user.id;

    await db
      .from("profiles")
      .upsert(
        { id: userId, full_name: data.fullName.trim().slice(0, 80), email, branch_id: branchId },
        { onConflict: "id" },
      );

    const { error: roleError } = await db
      .from("user_roles")
      .upsert({ user_id: userId, role: data.role, branch_id: branchId }, { onConflict: "user_id,role" });
    if (roleError) {
      await db.auth.admin.deleteUser(userId);
      throw new Error(roleError.message);
    }

    await db.from("audit_logs").insert({
      actor: context.userId,
      action: "client_account_created",
      entity: "user_roles",
      entity_id: userId,
      details: { email, role: data.role, branch_id: branchId },
    });

    return { userId, branchId, email };
  });

export const setClientPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string; password: string }) => d)
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.supabase, context.userId);
    if (data.password.length < 8) throw new Error("WEAK_PASSWORD");
    const db = await admin();
    const { error } = await db.auth.admin.updateUserById(data.userId, { password: data.password });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const removeClientAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string }) => d)
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.supabase, context.userId);
    if (data.userId === context.userId) throw new Error("CANNOT_REMOVE_SELF");
    const db = await admin();
    await db.from("user_roles").delete().eq("user_id", data.userId);
    const { error } = await db.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
