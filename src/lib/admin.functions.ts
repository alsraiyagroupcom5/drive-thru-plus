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
      .in("role", ["super_admin", "general_manager"]);
    return { isSuperAdmin: (mine ?? []).length > 0, superAdminExists: (count ?? 0) > 0 };
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

/* ---------------------------------------------------------------
 * Marketplace: restaurants sign up for an account from /business
 * ------------------------------------------------------------- */

export const submitSignupRequest = createServerFn({ method: "POST" })
  .inputValidator(
    (d: {
      restaurantName: string;
      contactName: string;
      email: string;
      phone?: string;
      branchesCount?: number;
      plan?: string;
      message?: string;
    }) => d,
  )
  .handler(async ({ data }) => {
    const clean = (v: string | undefined, max: number) => (v ?? "").trim().slice(0, max);
    const restaurantName = clean(data.restaurantName, 120);
    const contactName = clean(data.contactName, 120);
    const email = clean(data.email, 160).toLowerCase();
    if (!restaurantName || !contactName || !email.includes("@")) throw new Error("INVALID_INPUT");
    const db = await admin();
    const { error } = await db.from("signup_requests").insert({
      restaurant_name: restaurantName,
      contact_name: contactName,
      email,
      phone: clean(data.phone, 40) || null,
      branches_count: Math.min(Math.max(1, Math.round(Number(data.branchesCount ?? 1) || 1)), 500),
      plan: ["starter", "growth", "enterprise"].includes(data.plan ?? "")
        ? (data.plan as string)
        : "growth",
      message: clean(data.message, 1000) || null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listSignupRequests = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertSuperAdmin(context.supabase, context.userId);
    const db = await admin();
    const { data } = await db
      .from("signup_requests")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    return data ?? [];
  });

export const setSignupStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; status: "NEW" | "CONTACTED" | "ONBOARDED" | "REJECTED" }) => d)
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.supabase, context.userId);
    const db = await admin();
    const { error } = await db
      .from("signup_requests")
      .update({ status: data.status, handled_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ---------------------------------------------------------------
 * Platform administration: restaurants + overview
 * ------------------------------------------------------------- */

export const listRestaurants = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertSuperAdmin(context.supabase, context.userId);
    const db = await admin();
    const [{ data: orgs }, { data: restaurants }, { data: branches }] = await Promise.all([
      db.from("organizations").select("id, name_en, name_ar").order("name_en"),
      db.from("restaurants").select("*").order("name_en"),
      db.from("branches").select("id, restaurant_id, code, name_en, name_ar, is_open"),
    ]);
    return {
      organizations: orgs ?? [],
      restaurants: (restaurants ?? []).map((r) => ({
        ...r,
        branches: (branches ?? []).filter((b) => b.restaurant_id === r.id),
      })),
    };
  });

export const saveRestaurant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      id?: string | null;
      organizationId?: string | null;
      newOrganization?: { name_en: string; name_ar: string } | null;
      slug: string;
      name_en: string;
      name_ar: string;
      currency?: string;
      tax_rate?: number;
    }) => d,
  )
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.supabase, context.userId);
    const db = await admin();
    const patch = {
      slug: data.slug.trim().toLowerCase().slice(0, 40),
      name_en: data.name_en.trim().slice(0, 80),
      name_ar: data.name_ar.trim().slice(0, 80),
      currency: (data.currency || "QAR").trim().slice(0, 6).toUpperCase(),
      tax_rate: Math.min(Math.max(Number(data.tax_rate ?? 0) || 0, 0), 1),
    };
    if (!patch.slug || !patch.name_en || !patch.name_ar) throw new Error("INVALID_INPUT");

    if (data.id) {
      const { error } = await db.from("restaurants").update(patch).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { id: data.id };
    }

    let organizationId = data.organizationId ?? null;
    if (!organizationId) {
      const no = data.newOrganization;
      if (!no?.name_en?.trim() || !no?.name_ar?.trim()) throw new Error("ORG_REQUIRED");
      const { data: org, error: orgError } = await db
        .from("organizations")
        .insert({ name_en: no.name_en.trim().slice(0, 80), name_ar: no.name_ar.trim().slice(0, 80) })
        .select("id")
        .single();
      if (orgError || !org) throw new Error(orgError?.message ?? "ORG_CREATE_FAILED");
      organizationId = org.id;
    }

    const { data: created, error } = await db
      .from("restaurants")
      .insert({ ...patch, organization_id: organizationId })
      .select("id")
      .single();
    if (error || !created) throw new Error(error?.message ?? "RESTAURANT_CREATE_FAILED");
    return { id: created.id };
  });

export const adminOverview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertSuperAdmin(context.supabase, context.userId);
    const db = await admin();
    const since = new Date(Date.now() - 24 * 60 * 60_000).toISOString();
    const [restaurants, branches, products, accounts, leads, orders, recent] = await Promise.all([
      db.from("restaurants").select("id", { count: "exact", head: true }),
      db.from("branches").select("id", { count: "exact", head: true }),
      db.from("products").select("id", { count: "exact", head: true }),
      db.from("user_roles").select("id", { count: "exact", head: true }),
      db.from("signup_requests").select("id", { count: "exact", head: true }).eq("status", "NEW"),
      db.from("orders").select("total, status, created_at").gte("created_at", since),
      db
        .from("orders")
        .select("id, order_number, status, total, created_at, branches(name_en, name_ar)")
        .order("created_at", { ascending: false })
        .limit(12),
    ]);
    const rows = orders.data ?? [];
    return {
      restaurants: restaurants.count ?? 0,
      branches: branches.count ?? 0,
      products: products.count ?? 0,
      accounts: accounts.count ?? 0,
      newLeads: leads.count ?? 0,
      orders24h: rows.length,
      revenue24h: rows.reduce((s, o) => s + Number(o.total || 0), 0),
      inProgress: rows.filter((o) =>
        ["RECEIVED", "ACCEPTED", "PREPARING", "QUALITY_CHECK", "READY"].includes(o.status as string),
      ).length,
      recent: recent.data ?? [],
    };
  });

export const setAccountRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { roleRowId: string; role: StaffRole; branchId: string | null }) => d)
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.supabase, context.userId);
    if (!STAFF_ROLES.includes(data.role)) throw new Error("INVALID_ROLE");
    const db = await admin();
    const { error } = await db
      .from("user_roles")
      .update({ role: data.role, branch_id: data.branchId })
      .eq("id", data.roleRowId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Cards for the admin "clients" grid: one box per restaurant with live counts. */
export const listClientCards = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertSuperAdmin(context.supabase, context.userId);
    const db = await admin();
    const since = new Date(Date.now() - 24 * 60 * 60_000).toISOString();
    const [{ data: restaurants }, { data: branches }, { data: products }, { data: roles }, { data: orders }] =
      await Promise.all([
        db.from("restaurants").select("id, slug, name_en, name_ar, currency, logo_url").order("name_en"),
        db.from("branches").select("id, restaurant_id, is_open"),
        db.from("products").select("id, restaurant_id"),
        db.from("user_roles").select("user_id, role, branch_id"),
        db
          .from("orders")
          .select("id, restaurant_id, total, status, created_at")
          .gte("created_at", since),
      ]);

    const branchList = branches ?? [];
    const branchOwner = new Map(branchList.map((b) => [b.id, b.restaurant_id]));

    return (restaurants ?? []).map((r) => {
      const mine = branchList.filter((b) => b.restaurant_id === r.id);
      const team = (roles ?? []).filter((x) => x.branch_id && branchOwner.get(x.branch_id) === r.id);
      const day = (orders ?? []).filter((o) => o.restaurant_id === r.id);
      return {
        ...r,
        branches: mine.length,
        openBranches: mine.filter((b) => b.is_open).length,
        products: (products ?? []).filter((p) => p.restaurant_id === r.id).length,
        team: team.length,
        orders24h: day.length,
        revenue24h: day.reduce((s, o) => s + Number(o.total || 0), 0),
        activeOrders: day.filter((o) =>
          ["RECEIVED", "ACCEPTED", "PREPARING", "QUALITY_CHECK", "ARRIVING"].includes(o.status as string),
        ).length,
        // Brand-new orders waiting for the team — drives the red glow on the
        // restaurant card until the first status change flips it to orange.
        newOrders: day.filter((o) => o.status === "RECEIVED").length,
        readyOrders: day.filter((o) => o.status === "READY").length,
        completedOrders: day.filter((o) => ["COMPLETED", "PICKED_UP"].includes(o.status as string)).length,
        cancelledOrders: day.filter((o) => o.status === "CANCELLED").length,
      };
    });
  });

/** Everything the admin needs on one client page header. */
export const clientSummary = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { restaurantId: string }) => d)
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.supabase, context.userId);
    const db = await admin();
    const since = new Date(Date.now() - 24 * 60 * 60_000).toISOString();
    const [{ data: restaurant }, { data: branches }, { data: orders }] = await Promise.all([
      db.from("restaurants").select("*").eq("id", data.restaurantId).maybeSingle(),
      db.from("branches").select("id, name_en, name_ar, phone, is_open").eq("restaurant_id", data.restaurantId),
      db
        .from("orders")
        .select("id, total, status, created_at")
        .eq("restaurant_id", data.restaurantId)
        .gte("created_at", since),
    ]);
    if (!restaurant) throw new Error("RESTAURANT_NOT_FOUND");
    const rows = orders ?? [];
    return {
      restaurant,
      branches: branches ?? [],
      orders24h: rows.length,
      revenue24h: rows.reduce((s, o) => s + Number(o.total || 0), 0),
      inProgress: rows.filter((o) =>
        ["RECEIVED", "ACCEPTED", "PREPARING", "QUALITY_CHECK", "READY"].includes(o.status as string),
      ).length,
    };
  });

/** Sharing panel: restaurant + branch links and the login accounts per branch. */
export const clientAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { restaurantId: string }) => d)
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.supabase, context.userId);
    const db = await admin();
    const { data: restaurant } = await db
      .from("restaurants")
      .select("id, slug, name_en, name_ar")
      .eq("id", data.restaurantId)
      .maybeSingle();
    if (!restaurant) throw new Error("RESTAURANT_NOT_FOUND");

    const { data: branches } = await db
      .from("branches")
      .select("id, code, name_en, name_ar, is_open")
      .eq("restaurant_id", data.restaurantId)
      .order("name_en");

    const ids = (branches ?? []).map((b) => b.id);
    const { data: roles } = ids.length
      ? await db.from("user_roles").select("user_id, role, branch_id").in("branch_id", ids)
      : { data: [] as { user_id: string; role: string; branch_id: string }[] };
    const userIds = [...new Set((roles ?? []).map((r) => r.user_id))];
    const { data: profiles } = userIds.length
      ? await db.from("profiles").select("id, full_name, email").in("id", userIds)
      : { data: [] as { id: string; full_name: string | null; email: string | null }[] };
    const byId = new Map((profiles ?? []).map((p) => [p.id, p]));

    return {
      restaurant,
      branches: (branches ?? []).map((b) => ({
        ...b,
        accounts: (roles ?? [])
          .filter((r) => r.branch_id === b.id)
          .map((r) => ({
            userId: r.user_id,
            role: r.role as string,
            fullName: byId.get(r.user_id)?.full_name ?? null,
            email: byId.get(r.user_id)?.email ?? null,
          })),
      })),
    };
  });


/** Platform-wide live orders feed: every branch + its recent orders for the overview boxes. */
export const adminOrdersFeed = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertSuperAdmin(context.supabase, context.userId);
    const db = await admin();
    const [branches, orders] = await Promise.all([
      db
        .from("branches")
        .select("id, restaurant_id, code, name_en, name_ar, is_open, city_en, city_ar")
        .order("created_at", { ascending: true }),
      db
        .from("orders")
        .select(
          "id, order_number, pickup_code, status, payment_status, payment_method, subtotal, discount, tax, total, notes, target_prep_minutes, created_at, ready_at, completed_at, customer_name, customer_phone, customer_arrived, arrived_at, distance_km, eta_minutes, location_updated_at, branch_id, branches(name_en, name_ar), order_items(id, name_en, name_ar, quantity, unit_price, line_total)",
        )
        .order("created_at", { ascending: false })
        .limit(150),
    ]);
    if (branches.error) throw new Error(branches.error.message);
    if (orders.error) throw new Error(orders.error.message);
    return { branches: branches.data ?? [], orders: orders.data ?? [] };
  });
