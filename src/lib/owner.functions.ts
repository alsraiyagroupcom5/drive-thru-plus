import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const RESTAURANT_ID = "22222222-2222-2222-2222-222222222222";

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

/** Owner (general_manager) or platform admin (super_admin) may manage the restaurant. */
async function assertOwner(supabase: unknown, userId: string) {
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

function clamp(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), max);
}

/* --------------------------- read model --------------------------- */

export const ownerMenu = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertOwner(context.supabase, context.userId);
    const db = await admin();

    const [branches, categories, products, availability] = await Promise.all([
      db
        .from("branches")
        .select("*")
        .eq("restaurant_id", RESTAURANT_ID)
        .order("name_en"),
      db
        .from("categories")
        .select("*")
        .eq("restaurant_id", RESTAURANT_ID)
        .order("sort_order"),
      db
        .from("products")
        .select("*")
        .eq("restaurant_id", RESTAURANT_ID)
        .order("sort_order"),
      db.from("branch_product_availability").select("*"),
    ]);

    return {
      branches: branches.data ?? [],
      categories: categories.data ?? [],
      products: products.data ?? [],
      availability: availability.data ?? [],
    };
  });

export const ownerOrders = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { branchId?: string | null }) => d)
  .handler(async ({ data, context }) => {
    await assertOwner(context.supabase, context.userId);
    const db = await admin();
    let q = db
      .from("orders")
      .select(
        "id, order_number, status, payment_status, payment_method, total, created_at, ready_at, completed_at, customer_name, customer_phone, customer_arrived, branch_id, branches(name_en, name_ar), order_items(id, name_en, name_ar, quantity)",
      )
      .eq("restaurant_id", RESTAURANT_ID)
      .order("created_at", { ascending: false })
      .limit(120);
    if (data.branchId) q = q.eq("branch_id", data.branchId);
    const { data: orders, error } = await q;
    if (error) throw new Error(error.message);
    return orders ?? [];
  });

/* ---------------------------- branches ---------------------------- */

type BranchInput = {
  id?: string | null;
  name_en: string;
  name_ar: string;
  code: string;
  city_en?: string | null;
  city_ar?: string | null;
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
    await assertOwner(context.supabase, context.userId);
    if (!data.name_en.trim() || !data.name_ar.trim() || !data.code.trim())
      throw new Error("MISSING_FIELDS");
    const db = await admin();

    const row = {
      restaurant_id: RESTAURANT_ID,
      code: data.code.trim().toUpperCase().slice(0, 20),
      name_en: data.name_en.trim().slice(0, 80),
      name_ar: data.name_ar.trim().slice(0, 80),
      city_en: data.city_en?.trim().slice(0, 60) || null,
      city_ar: data.city_ar?.trim().slice(0, 60) || null,
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
        .eq("restaurant_id", RESTAURANT_ID);
      if (error) throw new Error(error.message);
      return { id: data.id };
    }

    const { data: created, error } = await db
      .from("branches")
      .insert(row)
      .select("id")
      .single();
    if (error || !created) throw new Error(error?.message ?? "BRANCH_CREATE_FAILED");
    return { id: created.id };
  });

/* ----------------------------- menu ------------------------------ */

type ProductInput = {
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
    await assertOwner(context.supabase, context.userId);
    if (!data.name_en.trim() || !data.name_ar.trim()) throw new Error("MISSING_FIELDS");
    if (!data.category_id) throw new Error("CATEGORY_REQUIRED");
    if (!(Number(data.price) > 0)) throw new Error("INVALID_PRICE");
    const db = await admin();

    const row = {
      restaurant_id: RESTAURANT_ID,
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
        .eq("restaurant_id", RESTAURANT_ID);
      if (error) throw new Error(error.message);
    } else {
      const { data: created, error } = await db
        .from("products")
        .insert(row)
        .select("id")
        .single();
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
  .inputValidator((d: { productId: string; branchIds: string[] }) => d)
  .handler(async ({ data, context }) => {
    await assertOwner(context.supabase, context.userId);
    await syncBranches(data.productId, data.branchIds);
    return { ok: true };
  });

export const setProductDiscount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { productId: string; discountPercent: number }) => d)
  .handler(async ({ data, context }) => {
    await assertOwner(context.supabase, context.userId);
    const db = await admin();
    const { error } = await db
      .from("products")
      .update({ discount_percent: clamp(Math.round(Number(data.discountPercent)), 0, 90) })
      .eq("id", data.productId)
      .eq("restaurant_id", RESTAURANT_ID);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Mark an item out of stock for today at one branch (auto-clears tomorrow). */
export const setOutOfStockToday = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { productId: string; branchId: string; outOfStock: boolean }) => d)
  .handler(async ({ data, context }) => {
    await assertOwner(context.supabase, context.userId);
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
  .inputValidator((d: { productId: string; isAvailable: boolean }) => d)
  .handler(async ({ data, context }) => {
    await assertOwner(context.supabase, context.userId);
    const db = await admin();
    const { error } = await db
      .from("products")
      .update({ is_available: data.isAvailable })
      .eq("id", data.productId)
      .eq("restaurant_id", RESTAURANT_ID);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
