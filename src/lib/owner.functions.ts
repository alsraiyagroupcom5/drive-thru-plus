import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const RESTAURANT_ID = "22222222-2222-2222-2222-222222222222";

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

type RoleClient = {
  rpc: (
    fn: "has_role",
    args: { _user_id: string; _role: "super_admin" | "general_manager" },
  ) => PromiseLike<{ data: unknown }>;
};

/** Owner (general_manager) or platform admin (super_admin) may manage the restaurant. */
async function assertOwner(supabase: unknown, userId: string) {
  const client = supabase as RoleClient;
  const [{ data: isAdmin }, { data: isOwner }] = await Promise.all([
    client.rpc("has_role", { _user_id: userId, _role: "super_admin" }),
    client.rpc("has_role", { _user_id: userId, _role: "general_manager" }),
  ]);
  if (isAdmin !== true && isOwner !== true) throw new Error("FORBIDDEN");
}

/**
 * Resolve which restaurant the caller is acting on.
 * Owners always act on their own restaurant; only the platform admin may
 * target another restaurant by passing `restaurantId`.
 */
async function resolveRestaurant(
  context: { supabase: unknown; userId: string },
  requested?: string | null,
) {
  await assertOwner(context.supabase, context.userId);
  if (!requested || requested === RESTAURANT_ID) return RESTAURANT_ID;
  const { data: isAdmin } = await (context.supabase as RoleClient).rpc("has_role", {
    _user_id: context.userId,
    _role: "super_admin",
  });
  if (isAdmin !== true) throw new Error("FORBIDDEN");
  const db = await admin();
  const { data: exists } = await db
    .from("restaurants")
    .select("id")
    .eq("id", requested)
    .maybeSingle();
  if (!exists) throw new Error("RESTAURANT_NOT_FOUND");
  return requested;
}

type Scoped = { restaurantId?: string | null };

function clamp(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), max);
}

/* --------------------------- read model --------------------------- */

export const ownerMenu = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d?: Scoped) => d ?? {})
  .handler(async ({ data, context }) => {
    const rid = await resolveRestaurant(context, data.restaurantId);
    const db = await admin();

    const [restaurant, branches, categories, products, availability] = await Promise.all([
      db.from("restaurants").select("*").eq("id", rid).maybeSingle(),
      db.from("branches").select("*").eq("restaurant_id", rid).order("name_en"),
      db.from("categories").select("*").eq("restaurant_id", rid).order("sort_order"),
      db.from("products").select("*").eq("restaurant_id", rid).order("sort_order"),
      db.from("branch_product_availability").select("*"),
    ]);

    return {
      restaurantId: rid,
      restaurant: restaurant.data ?? null,
      branches: branches.data ?? [],
      categories: categories.data ?? [],
      products: products.data ?? [],
      availability: availability.data ?? [],
    };
  });

export const ownerOrders = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { branchId?: string | null } & Scoped) => d)
  .handler(async ({ data, context }) => {
    const rid = await resolveRestaurant(context, data.restaurantId);
    const db = await admin();
    let q = db
      .from("orders")
      .select(
        "id, order_number, pickup_code, status, payment_status, payment_method, subtotal, discount, tax, total, notes, target_prep_minutes, created_at, ready_at, completed_at, customer_name, customer_phone, customer_arrived, arrived_at, distance_km, eta_minutes, location_updated_at, branch_id, branches(name_en, name_ar), order_items(id, name_en, name_ar, quantity, unit_price, line_total)",
      )
      .eq("restaurant_id", rid)
      .order("created_at", { ascending: false })
      .limit(120);
    if (data.branchId) q = q.eq("branch_id", data.branchId);
    const { data: orders, error } = await q;
    if (error) throw new Error(error.message);
    return orders ?? [];
  });

/* ---------------------------- branches ---------------------------- */

type BranchInput = Scoped & {
  id?: string | null;
  name_en: string;
  name_ar: string;
  code: string;
  city_en?: string | null;
  city_ar?: string | null;
  address_en?: string | null;
  address_ar?: string | null;
  maps_url?: string | null;
  lat?: number | null;
  lng?: number | null;
  phone?: string | null;
  opens_at?: string;
  closes_at?: string;
  is_open?: boolean;
  avg_prep_minutes?: number;
};

export const saveBranch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: BranchInput) => d)
  .handler(async ({ data, context }) => {
    const rid = await resolveRestaurant(context, data.restaurantId);
    if (!data.name_en.trim() || !data.name_ar.trim() || !data.code.trim())
      throw new Error("MISSING_FIELDS");
    const db = await admin();

    const row = {
      restaurant_id: rid,
      code: data.code.trim().toUpperCase().slice(0, 20),
      name_en: data.name_en.trim().slice(0, 80),
      name_ar: data.name_ar.trim().slice(0, 80),
      city_en: data.city_en?.trim().slice(0, 60) || null,
      city_ar: data.city_ar?.trim().slice(0, 60) || null,
      address_en: data.address_en?.trim().slice(0, 160) || null,
      address_ar: data.address_ar?.trim().slice(0, 160) || null,
      maps_url: data.maps_url?.trim().slice(0, 300) || null,
      lat: data.lat === null || data.lat === undefined || Number.isNaN(Number(data.lat)) ? null : Number(data.lat),
      lng: data.lng === null || data.lng === undefined || Number.isNaN(Number(data.lng)) ? null : Number(data.lng),
      phone: data.phone?.trim().slice(0, 30) || null,
      opens_at: data.opens_at || "07:00:00",
      closes_at: data.closes_at || "00:00:00",
      is_open: data.is_open ?? true,
      avg_prep_minutes: clamp(Math.round(data.avg_prep_minutes ?? 8), 1, 60),
    };

    if (data.id) {
      const { error } = await db
        .from("branches")
        .update(row)
        .eq("id", data.id)
        .eq("restaurant_id", rid);
      if (error) throw new Error(error.message);
      return { id: data.id };
    }

    const { data: created, error } = await db.from("branches").insert(row).select("id").single();
    if (error || !created) throw new Error(error?.message ?? "BRANCH_CREATE_FAILED");
    return { id: created.id };
  });

/* ----------------------------- menu ------------------------------ */

type ProductInput = Scoped & {
  id?: string | null;
  category_id: string;
  name_en: string;
  name_ar: string;
  description_en?: string | null;
  description_ar?: string | null;
  price: number;
  discount_percent?: number;
  image_url?: string | null;
  calories?: number | null;
  prep_minutes?: number;
  is_available?: boolean;
  is_popular?: boolean;
  is_new?: boolean;
  branchIds?: string[];
};

export const saveProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: ProductInput) => d)
  .handler(async ({ data, context }) => {
    const rid = await resolveRestaurant(context, data.restaurantId);
    if (!data.name_en.trim() || !data.name_ar.trim()) throw new Error("MISSING_FIELDS");
    if (!data.category_id) throw new Error("CATEGORY_REQUIRED");
    if (!(Number(data.price) > 0)) throw new Error("INVALID_PRICE");
    const db = await admin();

    const row = {
      restaurant_id: rid,
      category_id: data.category_id,
      name_en: data.name_en.trim().slice(0, 80),
      name_ar: data.name_ar.trim().slice(0, 80),
      description_en: data.description_en?.trim().slice(0, 240) || null,
      description_ar: data.description_ar?.trim().slice(0, 240) || null,
      price: Math.round(Number(data.price) * 100) / 100,
      discount_percent: clamp(Math.round(Number(data.discount_percent ?? 0)), 0, 90),
      image_url: data.image_url?.trim() || "latte",
      calories: data.calories ? Math.round(Number(data.calories)) : null,
      prep_minutes: clamp(Math.round(Number(data.prep_minutes ?? 5)), 1, 60),
      is_available: data.is_available ?? true,
      is_popular: data.is_popular ?? false,
      is_new: data.is_new ?? false,
    };

    let productId = data.id ?? null;
    if (productId) {
      const { error } = await db
        .from("products")
        .update(row)
        .eq("id", productId)
        .eq("restaurant_id", rid);
      if (error) throw new Error(error.message);
    } else {
      const { data: created, error } = await db.from("products").insert(row).select("id").single();
      if (error || !created) throw new Error(error?.message ?? "PRODUCT_CREATE_FAILED");
      productId = created.id;
    }

    if (data.branchIds) await syncBranches(productId, data.branchIds);
    return { id: productId };
  });

async function syncBranches(productId: string, branchIds: string[]) {
  const db = await admin();
  const { data: existing } = await db
    .from("branch_product_availability")
    .select("branch_id")
    .eq("product_id", productId);
  const have = new Set((existing ?? []).map((r) => r.branch_id));
  const want = new Set(branchIds);

  const toAdd = [...want].filter((b) => !have.has(b));
  const toRemove = [...have].filter((b) => !want.has(b));

  if (toAdd.length)
    await db
      .from("branch_product_availability")
      .insert(toAdd.map((branch_id) => ({ branch_id, product_id: productId, is_available: true })));
  if (toRemove.length)
    await db
      .from("branch_product_availability")
      .delete()
      .eq("product_id", productId)
      .in("branch_id", toRemove);
}

export const setProductBranches = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { productId: string; branchIds: string[] } & Scoped) => d)
  .handler(async ({ data, context }) => {
    await resolveRestaurant(context, data.restaurantId);
    await syncBranches(data.productId, data.branchIds);
    return { ok: true };
  });

export const setProductDiscount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { productId: string; discountPercent: number } & Scoped) => d)
  .handler(async ({ data, context }) => {
    const rid = await resolveRestaurant(context, data.restaurantId);
    const db = await admin();
    const { error } = await db
      .from("products")
      .update({ discount_percent: clamp(Math.round(Number(data.discountPercent)), 0, 90) })
      .eq("id", data.productId)
      .eq("restaurant_id", rid);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Mark an item out of stock for today at one branch (auto-clears tomorrow). */
export const setOutOfStockToday = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { productId: string; branchId: string; outOfStock: boolean } & Scoped) => d)
  .handler(async ({ data, context }) => {
    await resolveRestaurant(context, data.restaurantId);
    const { todayISO } = await import("@/lib/pricing");
    const db = await admin();
    const { error } = await db.from("branch_product_availability").upsert(
      {
        branch_id: data.branchId,
        product_id: data.productId,
        is_available: true,
        out_of_stock_on: data.outOfStock ? todayISO() : null,
      },
      { onConflict: "branch_id,product_id" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const setProductAvailable = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { productId: string; isAvailable: boolean } & Scoped) => d)
  .handler(async ({ data, context }) => {
    const rid = await resolveRestaurant(context, data.restaurantId);
    const db = await admin();
    const { error } = await db
      .from("products")
      .update({ is_available: data.isAvailable })
      .eq("id", data.productId)
      .eq("restaurant_id", rid);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ------------------------- menu appearance ------------------------- */

export const saveCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: Scoped & {
      id?: string | null;
      name_en: string;
      name_ar: string;
      slug?: string;
      sort_order?: number;
      is_active?: boolean;
    }) => d,
  )
  .handler(async ({ data, context }) => {
    const rid = await resolveRestaurant(context, data.restaurantId);
    if (!data.name_en.trim() || !data.name_ar.trim()) throw new Error("MISSING_FIELDS");
    const db = await admin();
    const slug =
      (data.slug?.trim() || data.name_en.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-"))
        .replace(/^-|-$/g, "")
        .slice(0, 40) || "category";
    const row = {
      restaurant_id: rid,
      name_en: data.name_en.trim().slice(0, 60),
      name_ar: data.name_ar.trim().slice(0, 60),
      slug,
      sort_order: clamp(Math.round(Number(data.sort_order ?? 0)), 0, 999),
      is_active: data.is_active ?? true,
    };
    if (data.id) {
      const { error } = await db
        .from("categories")
        .update(row)
        .eq("id", data.id)
        .eq("restaurant_id", rid);
      if (error) throw new Error(error.message);
      return { id: data.id };
    }
    const { data: created, error } = await db.from("categories").insert(row).select("id").single();
    if (error || !created) throw new Error(error?.message ?? "CATEGORY_CREATE_FAILED");
    return { id: created.id };
  });

export const setProductLayout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: Scoped & { productId: string; sortOrder?: number; isPopular?: boolean; isNew?: boolean }) => d,
  )
  .handler(async ({ data, context }) => {
    const rid = await resolveRestaurant(context, data.restaurantId);
    const db = await admin();
    const patch: { sort_order?: number; is_popular?: boolean; is_new?: boolean } = {};
    if (data.sortOrder !== undefined) patch["sort_order"] = clamp(Math.round(Number(data.sortOrder)), 0, 999);
    if (data.isPopular !== undefined) patch["is_popular"] = data.isPopular;
    if (data.isNew !== undefined) patch["is_new"] = data.isNew;
    if (!Object.keys(patch).length) return { ok: true };
    const { error } = await db
      .from("products")
      .update(patch)
      .eq("id", data.productId)
      .eq("restaurant_id", rid);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ---------------------------- the team ---------------------------- */

type TeamRole = "branch_manager" | "cashier" | "kitchen";
const TEAM_ROLES: TeamRole[] = ["branch_manager", "cashier", "kitchen"];

export const ownerTeam = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d?: Scoped) => d ?? {})
  .handler(async ({ data, context }) => {
    const rid = await resolveRestaurant(context, data.restaurantId);
    const db = await admin();
    const { data: branches } = await db
      .from("branches")
      .select("id, name_en, name_ar")
      .eq("restaurant_id", rid);
    const branchIds = new Set((branches ?? []).map((b) => b.id));

    const { data: roles } = await db.from("user_roles").select("id, user_id, role, branch_id");
    const mine = (roles ?? []).filter(
      (r) => TEAM_ROLES.includes(r.role as TeamRole) && r.branch_id && branchIds.has(r.branch_id),
    );
    const { data: profiles } = await db.from("profiles").select("id, full_name, email, branch_id");
    const byId = new Map((profiles ?? []).map((p) => [p.id, p]));

    return mine.map((r) => ({
      userId: r.user_id,
      role: r.role as string,
      branchId: r.branch_id as string,
      fullName: byId.get(r.user_id)?.full_name ?? "",
      email: byId.get(r.user_id)?.email ?? "",
    }));
  });

export const createTeamMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: Scoped & {
      email: string;
      password: string;
      fullName: string;
      role: TeamRole;
      branchId: string;
    }) => d,
  )
  .handler(async ({ data, context }) => {
    const rid = await resolveRestaurant(context, data.restaurantId);
    if (!TEAM_ROLES.includes(data.role)) throw new Error("INVALID_ROLE");
    const email = data.email.trim().toLowerCase();
    if (!email.includes("@")) throw new Error("INVALID_EMAIL");
    if (data.password.length < 8) throw new Error("WEAK_PASSWORD");
    const db = await admin();

    const { data: branch } = await db
      .from("branches")
      .select("id")
      .eq("id", data.branchId)
      .eq("restaurant_id", rid)
      .maybeSingle();
    if (!branch) throw new Error("BRANCH_NOT_FOUND");

    const { data: created, error: userError } = await db.auth.admin.createUser({
      email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.fullName.trim().slice(0, 80) },
    });
    if (userError || !created?.user) throw new Error(userError?.message ?? "USER_CREATE_FAILED");
    const userId = created.user.id;

    await db.from("profiles").upsert(
      { id: userId, full_name: data.fullName.trim().slice(0, 80), email, branch_id: data.branchId },
      { onConflict: "id" },
    );
    const { error: roleError } = await db
      .from("user_roles")
      .upsert({ user_id: userId, role: data.role, branch_id: data.branchId }, { onConflict: "user_id,role" });
    if (roleError) {
      await db.auth.admin.deleteUser(userId);
      throw new Error(roleError.message);
    }
    await db.from("audit_logs").insert({
      actor: context.userId,
      action: "team_member_created",
      entity: "user_roles",
      entity_id: userId,
      details: { email, role: data.role, branch_id: data.branchId },
    });
    return { userId };
  });

export const setTeamMemberAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: Scoped & { userId: string; role: TeamRole; branchId: string }) => d)
  .handler(async ({ data, context }) => {
    const rid = await resolveRestaurant(context, data.restaurantId);
    if (!TEAM_ROLES.includes(data.role)) throw new Error("INVALID_ROLE");
    const db = await admin();
    const { data: branch } = await db
      .from("branches")
      .select("id")
      .eq("id", data.branchId)
      .eq("restaurant_id", rid)
      .maybeSingle();
    if (!branch) throw new Error("BRANCH_NOT_FOUND");

    await db.from("user_roles").delete().eq("user_id", data.userId).in("role", TEAM_ROLES);
    const { error } = await db
      .from("user_roles")
      .insert({ user_id: data.userId, role: data.role, branch_id: data.branchId });
    if (error) throw new Error(error.message);
    await db.from("profiles").update({ branch_id: data.branchId }).eq("id", data.userId);
    return { ok: true };
  });

export const setTeamMemberPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: Scoped & { userId: string; password: string }) => d)
  .handler(async ({ data, context }) => {
    await resolveRestaurant(context, data.restaurantId);
    if (data.password.length < 8) throw new Error("WEAK_PASSWORD");
    const db = await admin();
    const { error } = await db.auth.admin.updateUserById(data.userId, { password: data.password });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const removeTeamMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: Scoped & { userId: string }) => d)
  .handler(async ({ data, context }) => {
    await resolveRestaurant(context, data.restaurantId);
    if (data.userId === context.userId) throw new Error("CANNOT_REMOVE_SELF");
    const db = await admin();
    const { data: roles } = await db.from("user_roles").select("role").eq("user_id", data.userId);
    const onlyTeam = (roles ?? []).every((r) => TEAM_ROLES.includes(r.role as TeamRole));
    if (!onlyTeam) throw new Error("FORBIDDEN");
    await db.from("user_roles").delete().eq("user_id", data.userId);
    const { error } = await db.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ------------------------ tracking settings ------------------------ */

type TrackingInput = Scoped & {
  branchId: string;
  lat?: number | null;
  lng?: number | null;
  maps_url?: string | null;
  tracking_enabled?: boolean;
  auto_arrival?: boolean;
  arrival_radius_m?: number;
  approach_radius_m?: number;
  avg_speed_kmh?: number;
  location_ping_seconds?: number;
};

export const saveTrackingSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: TrackingInput) => d)
  .handler(async ({ data, context }) => {
    const rid = await resolveRestaurant(context, data.restaurantId);
    const db = await admin();
    const num = (v: unknown) =>
      v === null || v === undefined || Number.isNaN(Number(v)) ? null : Number(v);

    const arrival = clamp(Math.round(data.arrival_radius_m ?? 200), 30, 5000);
    const approach = clamp(Math.round(data.approach_radius_m ?? 1500), arrival, 50000);

    const { error } = await db
      .from("branches")
      .update({
        lat: num(data.lat),
        lng: num(data.lng),
        maps_url: data.maps_url?.trim().slice(0, 300) || null,
        tracking_enabled: data.tracking_enabled ?? true,
        auto_arrival: data.auto_arrival ?? true,
        arrival_radius_m: arrival,
        approach_radius_m: approach,
        avg_speed_kmh: clamp(Math.round(data.avg_speed_kmh ?? 32), 5, 120),
        location_ping_seconds: clamp(Math.round(data.location_ping_seconds ?? 15), 5, 180),
      })
      .eq("id", data.branchId)
      .eq("restaurant_id", rid);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ------------------ order status override (admin / owner) ------------------ */

/** Allowed next statuses, mirroring the database transition guard. */
export const NEXT_STATUSES: Record<string, string[]> = {
  DRAFT: ["PENDING_PAYMENT", "RECEIVED", "CANCELLED"],
  PENDING_PAYMENT: ["PAID", "PAYMENT_FAILED", "CANCELLED"],
  PAYMENT_FAILED: ["PENDING_PAYMENT", "CANCELLED"],
  PAID: ["RECEIVED", "CANCELLED", "REFUNDED"],
  RECEIVED: ["ACCEPTED", "PREPARING", "CANCELLED"],
  ACCEPTED: ["PREPARING", "CANCELLED"],
  PREPARING: ["QUALITY_CHECK", "READY", "CANCELLED"],
  QUALITY_CHECK: ["READY", "PREPARING", "CANCELLED"],
  READY: ["ARRIVING", "PICKED_UP", "COMPLETED", "CANCELLED"],
  ARRIVING: ["PICKED_UP", "COMPLETED", "CANCELLED"],
  PICKED_UP: ["COMPLETED"],
  COMPLETED: ["REFUNDED"],
  CANCELLED: [],
  REFUNDED: [],
};

async function isSuperAdmin(supabase: unknown, userId: string) {
  const { data } = await (supabase as RoleClient).rpc("has_role", {
    _user_id: userId,
    _role: "super_admin",
  });
  return data === true;
}

/** Reads whether status override is enabled for the platform and the restaurant. */
export const orderControlSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d?: Scoped) => d ?? {})
  .handler(async ({ data, context }) => {
    const rid = await resolveRestaurant(context, data.restaurantId);
    const superAdmin = await isSuperAdmin(context.supabase, context.userId);
    const db = await admin();
    const [platform, restaurant] = await Promise.all([
      db.from("platform_settings").select("admin_order_override").eq("id", true).maybeSingle(),
      db.from("restaurants").select("owner_order_override").eq("id", rid).maybeSingle(),
    ]);
    const adminOverride = platform.data?.admin_order_override ?? true;
    const ownerOverride = restaurant.data?.owner_order_override ?? true;
    return {
      restaurantId: rid,
      isSuperAdmin: superAdmin,
      adminOverride,
      ownerOverride,
      canChangeStatus: superAdmin ? adminOverride : ownerOverride,
    };
  });

/** Turns the override feature on/off (admin scope = platform, owner scope = restaurant). */
export const setOrderOverride = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: Scoped & { scope: "admin" | "owner"; enabled: boolean }) => d)
  .handler(async ({ data, context }) => {
    const rid = await resolveRestaurant(context, data.restaurantId);
    const superAdmin = await isSuperAdmin(context.supabase, context.userId);
    const db = await admin();

    if (data.scope === "admin") {
      if (!superAdmin) throw new Error("FORBIDDEN");
      const { error } = await db
        .from("platform_settings")
        .update({ admin_order_override: !!data.enabled, updated_at: new Date().toISOString() })
        .eq("id", true);
      if (error) throw new Error(error.message);
      return { ok: true };
    }

    const { error } = await db
      .from("restaurants")
      .update({ owner_order_override: !!data.enabled })
      .eq("id", rid);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Admin/owner status change for any order inside the scoped restaurant. */
export const updateOrderStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: Scoped & { orderId: string; status: string }) => {
    if (!d?.orderId || !d?.status) throw new Error("INVALID_INPUT");
    if (!(d.status in NEXT_STATUSES)) throw new Error("INVALID_STATUS");
    return d;
  })
  .handler(async ({ data, context }) => {
    const rid = await resolveRestaurant(context, data.restaurantId);
    const superAdmin = await isSuperAdmin(context.supabase, context.userId);
    const db = await admin();

    const [platform, restaurant] = await Promise.all([
      db.from("platform_settings").select("admin_order_override").eq("id", true).maybeSingle(),
      db.from("restaurants").select("owner_order_override").eq("id", rid).maybeSingle(),
    ]);
    const enabled = superAdmin
      ? (platform.data?.admin_order_override ?? true)
      : (restaurant.data?.owner_order_override ?? true);
    if (!enabled) throw new Error("OVERRIDE_DISABLED");

    const { data: order } = await db
      .from("orders")
      .select("id, status, restaurant_id, order_number")
      .eq("id", data.orderId)
      .maybeSingle();
    if (!order) throw new Error("ORDER_NOT_FOUND");
    if (!superAdmin && order.restaurant_id !== rid) throw new Error("FORBIDDEN");

    if (order.status === data.status) return { ok: true, status: data.status };
    const allowed = NEXT_STATUSES[order.status] ?? [];
    if (!allowed.includes(data.status)) throw new Error("INVALID_TRANSITION");

    const patch: Record<string, unknown> = { status: data.status };
    if (data.status === "READY") patch["ready_at"] = new Date().toISOString();
    if (data.status === "COMPLETED") patch["completed_at"] = new Date().toISOString();

    const { error } = await db.from("orders").update(patch).eq("id", order.id);
    if (error) throw new Error(error.message);

    await db.from("audit_logs").insert({
      actor: context.userId,
      action: "ORDER_STATUS_OVERRIDE",
      entity: "orders",
      entity_id: order.id,
      details: { from: order.status, to: data.status, order_number: order.order_number },
    });

    return { ok: true, status: data.status };
  });
