import { createServerFn } from "@tanstack/react-start";

const RESTAURANT_ID = "22222222-2222-2222-2222-222222222222";

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

function normalisePhone(raw: string) {
  const digits = raw.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) return digits;
  if (digits.startsWith("974")) return `+${digits}`;
  return `+974${digits}`;
}

/* ------------------------------ OTP ------------------------------ */

export const requestOtp = createServerFn({ method: "POST" })
  .inputValidator((d: { phone: string; channel?: "whatsapp" | "sms" }) => d)
  .handler(async ({ data }) => {
    const phone = normalisePhone(data.phone);
    if (phone.length < 11) throw new Error("INVALID_PHONE");

    const db = await admin();
    const since = new Date(Date.now() - 10 * 60_000).toISOString();
    const { count } = await db
      .from("otp_requests")
      .select("id", { count: "exact", head: true })
      .eq("phone", phone)
      .gte("created_at", since);
    if ((count ?? 0) >= 5) throw new Error("RATE_LIMITED");

    const code = String(Math.floor(100000 + Math.random() * 900000));
    await db.from("otp_requests").insert({
      phone,
      code,
      channel: data.channel ?? "whatsapp",
      expires_at: new Date(Date.now() + 5 * 60_000).toISOString(),
    });

    const { messagingProvider } = await import("@/lib/providers.server");
    await messagingProvider().sendOtp(phone, code, data.channel ?? "whatsapp");

    // Demo mode returns the code so the flow is testable without a real provider.
    return { phone, demoCode: code, expiresInSeconds: 300 };
  });

export const verifyOtp = createServerFn({ method: "POST" })
  .inputValidator((d: { phone: string; code: string }) => d)
  .handler(async ({ data }) => {
    const phone = normalisePhone(data.phone);
    const db = await admin();

    const { data: rows } = await db
      .from("otp_requests")
      .select("*")
      .eq("phone", phone)
      .eq("consumed", false)
      .gte("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1);

    const otp = rows?.[0];
    if (!otp) throw new Error("CODE_EXPIRED");
    if (otp.attempts >= 5) throw new Error("TOO_MANY_ATTEMPTS");
    if (otp.code !== data.code.trim()) {
      await db.from("otp_requests").update({ attempts: otp.attempts + 1 }).eq("id", otp.id);
      throw new Error("CODE_INVALID");
    }
    await db.from("otp_requests").update({ consumed: true }).eq("id", otp.id);

    let { data: customer } = await db
      .from("customers")
      .select("*")
      .eq("restaurant_id", RESTAURANT_ID)
      .eq("phone", phone)
      .maybeSingle();

    if (!customer) {
      const inserted = await db
        .from("customers")
        .insert({ restaurant_id: RESTAURANT_ID, phone })
        .select("*")
        .single();
      customer = inserted.data;
    }
    if (!customer) throw new Error("CUSTOMER_CREATE_FAILED");

    const { signCustomerToken } = await import("@/lib/customer-session.server");
    return {
      token: await signCustomerToken(customer.id),
      customer: {
        id: customer.id,
        phone: customer.phone,
        fullName: customer.full_name,
        loyaltyPoints: customer.loyalty_points,
      },
    };
  });

/* --------------------------- profile --------------------------- */

async function requireCustomer(token: string) {
  const { verifyCustomerToken } = await import("@/lib/customer-session.server");
  const id = await verifyCustomerToken(token);
  if (!id) throw new Error("UNAUTHENTICATED");
  return id;
}

export const getMe = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string }) => d)
  .handler(async ({ data }) => {
    const id = await requireCustomer(data.token);
    const db = await admin();
    const { data: customer } = await db.from("customers").select("*").eq("id", id).maybeSingle();
    if (!customer) throw new Error("UNAUTHENTICATED");
    const { data: vehicles } = await db
      .from("customer_vehicles")
      .select("*")
      .eq("customer_id", id)
      .order("created_at");
    const { data: lastOrder } = await db
      .from("orders")
      .select("id, order_number, total, created_at, order_items(name_en, name_ar, quantity)")
      .eq("customer_id", id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    return {
      id: customer.id,
      phone: customer.phone,
      fullName: customer.full_name,
      loyaltyPoints: customer.loyalty_points,
      totalOrders: customer.total_orders,
      vehicles: vehicles ?? [],
      lastOrder,
    };
  });

export const updateProfile = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; fullName: string }) => d)
  .handler(async ({ data }) => {
    const id = await requireCustomer(data.token);
    const db = await admin();
    await db.from("customers").update({ full_name: data.fullName.slice(0, 80) }).eq("id", id);
    return { ok: true };
  });

export const saveVehicle = createServerFn({ method: "POST" })
  .inputValidator(
    (d: {
      token: string;
      nickname?: string;
      plate: string;
      make?: string;
      model?: string;
      color?: string;
    }) => d,
  )
  .handler(async ({ data }) => {
    const id = await requireCustomer(data.token);
    if (!data.plate.trim()) throw new Error("PLATE_REQUIRED");
    const db = await admin();
    await db.from("customer_vehicles").update({ is_default: false }).eq("customer_id", id);
    const { data: vehicle, error } = await db
      .from("customer_vehicles")
      .insert({
        customer_id: id,
        nickname: data.nickname?.slice(0, 40) || null,
        plate: data.plate.trim().slice(0, 20),
        make: data.make?.slice(0, 40) || null,
        model: data.model?.slice(0, 40) || null,
        color: data.color?.slice(0, 30) || null,
        vehicle_type: "SUV",
        is_default: true,
      })
      .select("*")
      .single();
    if (error) throw new Error("VEHICLE_SAVE_FAILED");
    return vehicle;
  });

/* ---------------------------- orders ---------------------------- */

type CartLine = {
  productId: string;
  quantity: number;
  options: { name_en: string; name_ar: string; price_delta: number }[];
  notes?: string;
};

export const placeOrder = createServerFn({ method: "POST" })
  .inputValidator(
    (d: {
      token: string;
      branchId: string;
      vehicleId: string | null;
      paymentMethod: "CARD" | "APPLE_PAY" | "GOOGLE_PAY" | "PAY_AT_PICKUP";
      items: CartLine[];
      notes?: string;
    }) => d,
  )
  .handler(async ({ data }) => {
    const customerId = await requireCustomer(data.token);
    if (!data.items.length) throw new Error("EMPTY_CART");
    const db = await admin();

    const { data: customer } = await db
      .from("customers")
      .select("*")
      .eq("id", customerId)
      .maybeSingle();
    if (!customer) throw new Error("UNAUTHENTICATED");

    const { data: branch } = await db
      .from("branches")
      .select("*")
      .eq("id", data.branchId)
      .maybeSingle();
    if (!branch) throw new Error("BRANCH_NOT_FOUND");
    if (!branch.is_open) throw new Error("BRANCH_CLOSED");

    const ids = [...new Set(data.items.map((i) => i.productId))];
    const { data: products } = await db.from("products").select("*").in("id", ids);
    const byId = new Map((products ?? []).map((p) => [p.id, p]));

    const { effectivePrice, todayISO } = await import("@/lib/pricing");
    const today = todayISO();
    const { data: availability } = await db
      .from("branch_product_availability")
      .select("product_id, is_available, out_of_stock_on")
      .eq("branch_id", branch.id)
      .in("product_id", ids);
    const soldOut = new Set(
      (availability ?? [])
        .filter((r) => !r.is_available || r.out_of_stock_on === today)
        .map((r) => r.product_id),
    );

    let subtotal = 0;
    let maxPrep = branch.avg_prep_minutes;
    const lines = data.items.map((item) => {
      const product = byId.get(item.productId);
      if (!product) throw new Error("PRODUCT_NOT_FOUND");
      if (!product.is_available || soldOut.has(product.id))
        throw new Error("PRODUCT_UNAVAILABLE");
      const quantity = Math.min(Math.max(1, Math.round(item.quantity)), 20);
      const extras = (item.options ?? []).reduce((sum, o) => sum + Number(o.price_delta || 0), 0);
      const unit = effectivePrice(product.price, product.discount_percent) + extras;
      const lineTotal = unit * quantity;
      subtotal += lineTotal;
      maxPrep = Math.max(maxPrep, product.prep_minutes);
      return { product, quantity, unit, lineTotal, options: item.options ?? [], notes: item.notes };
    });

    const total = Math.round(subtotal * 100) / 100;
    const vehicle = data.vehicleId
      ? (
          await db
            .from("customer_vehicles")
            .select("*")
            .eq("id", data.vehicleId)
            .eq("customer_id", customerId)
            .maybeSingle()
        ).data
      : null;

    const { data: seq } = await db.rpc("next_order_number" as never).single();
    const orderNumber =
      (seq as unknown as string) ?? `A${Math.floor(1000 + Math.random() * 9000)}`;

    const { data: order, error } = await db
      .from("orders")
      .insert({
        restaurant_id: RESTAURANT_ID,
        branch_id: branch.id,
        customer_id: customerId,
        vehicle_id: vehicle?.id ?? null,
        order_number: orderNumber,
        pickup_code: String(Math.floor(100000 + Math.random() * 900000)),
        status: "RECEIVED",
        payment_status: "PENDING",
        payment_method: data.paymentMethod,
        subtotal: total,
        tax: 0,
        total,
        points_earned: Math.floor(total),
        customer_name: customer.full_name,
        customer_phone: customer.phone,
        vehicle_snapshot: vehicle
          ? { plate: vehicle.plate, make: vehicle.make, model: vehicle.model, color: vehicle.color }
          : null,
        target_prep_minutes: maxPrep,
        notes: data.notes?.slice(0, 300) ?? null,
      })
      .select("*")
      .single();
    if (error || !order) throw new Error("ORDER_CREATE_FAILED");

    for (const line of lines) {
      const { data: item } = await db
        .from("order_items")
        .insert({
          order_id: order.id,
          product_id: line.product.id,
          name_en: line.product.name_en,
          name_ar: line.product.name_ar,
          quantity: line.quantity,
          unit_price: line.unit,
          line_total: line.lineTotal,
          notes: line.notes?.slice(0, 200) ?? null,
        })
        .select("id")
        .single();
      if (item && line.options.length) {
        await db.from("order_item_modifiers").insert(
          line.options.map((o) => ({
            order_item_id: item.id,
            name_en: o.name_en,
            name_ar: o.name_ar,
            price_delta: o.price_delta,
          })),
        );
      }
    }

    const { paymentProvider, posProvider, messagingProvider } = await import(
      "@/lib/providers.server"
    );
    const charge = await paymentProvider().charge({
      amount: total,
      method: data.paymentMethod,
      reference: order.id,
    });
    const paid = data.paymentMethod !== "PAY_AT_PICKUP" && charge.status === "PAID";

    await db.from("payments").insert({
      order_id: order.id,
      provider: paymentProvider().name,
      method: data.paymentMethod,
      status: paid ? "PAID" : "PENDING",
      amount: total,
      reference: charge.reference,
    });
    if (paid) await db.from("orders").update({ payment_status: "PAID" }).eq("id", order.id);

    await db
      .from("customers")
      .update({
        total_orders: customer.total_orders + 1,
        total_spent: Number(customer.total_spent) + total,
        loyalty_points: customer.loyalty_points + Math.floor(total),
        last_order_at: new Date().toISOString(),
      })
      .eq("id", customerId);

    await posProvider().pushOrder(order.id);
    await messagingProvider().sendOrderUpdate(
      customer.phone,
      `Order ${order.order_number} received at ${branch.name_en}.`,
    );

    return { orderId: order.id, orderNumber: order.order_number };
  });

export const getOrder = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; orderId: string }) => d)
  .handler(async ({ data }) => {
    const customerId = await requireCustomer(data.token);
    const db = await admin();
    const { data: order } = await db
      .from("orders")
      .select(
        "*, branches(name_en, name_ar, phone), order_items(*, order_item_modifiers(*)), order_status_history(status, created_at)",
      )
      .eq("id", data.orderId)
      .eq("customer_id", customerId)
      .maybeSingle();
    if (!order) throw new Error("ORDER_NOT_FOUND");
    return order;
  });

export const myOrders = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string }) => d)
  .handler(async ({ data }) => {
    const customerId = await requireCustomer(data.token);
    const db = await admin();
    const { data: orders } = await db
      .from("orders")
      .select("*, branches(name_en, name_ar), order_items(id, name_en, name_ar, quantity, product_id)")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false })
      .limit(30);
    return orders ?? [];
  });

export const announceArrival = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; orderId: string }) => d)
  .handler(async ({ data }) => {
    const customerId = await requireCustomer(data.token);
    const db = await admin();
    const { data: order } = await db
      .from("orders")
      .select("id, status")
      .eq("id", data.orderId)
      .eq("customer_id", customerId)
      .maybeSingle();
    if (!order) throw new Error("ORDER_NOT_FOUND");
    await db
      .from("orders")
      .update({ customer_arrived: true, arrived_at: new Date().toISOString() })
      .eq("id", order.id);
    return { ok: true };
  });
