import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Store, UtensilsCrossed, ClipboardList, Pencil, Plus, Palette, Users } from "lucide-react";
import { TeamTab } from "@/components/owner/TeamTab";
import { DesignTab } from "@/components/owner/DesignTab";
import { supabase } from "@/integrations/supabase/client";
import { useI18n, money } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { effectivePrice, hasDiscount, todayISO } from "@/lib/pricing";
import {
  ownerMenu,
  ownerOrders,
  saveBranch,
  saveProduct,
  setOutOfStockToday,
  setProductAvailable,
  setProductDiscount,
} from "@/lib/owner.functions";

export const Route = createFileRoute("/_authenticated/owner")({
  head: () => ({
    meta: [
      { title: "Owner console — Origami Qatar" },
      { name: "description", content: "Manage branches, menu, discounts, stock and orders." },
      { property: "og:title", content: "Owner console — Origami Qatar" },
      { property: "og:description", content: "Branches, menu, discounts, stock and orders." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OwnerConsole,
});

const input =
  "h-11 w-full rounded-xl border border-border bg-elevated px-3 text-sm outline-none ring-ring/40 focus:ring-2";
const IMAGE_KEYS = [
  "espresso",
  "latte",
  "iced-latte",
  "coldbrew",
  "matcha",
  "gelato",
  "sundae",
  "cake",
  "croissant",
  "shake",
  "cooler",
];

type Tab = "branches" | "menu" | "design" | "team" | "orders";

function OwnerConsole() {
  const { pick, lang } = useI18n();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("menu");

  const menu = useQuery({ queryKey: ["owner-menu"], queryFn: () => ownerMenu() });

  const refreshMenu = () => {
    qc.invalidateQueries({ queryKey: ["owner-menu"] });
    qc.invalidateQueries({ queryKey: ["products"] });
    qc.invalidateQueries({ queryKey: ["branches"] });
    qc.invalidateQueries({ queryKey: ["branch-availability"] });
  };

  if (menu.isLoading)
    return <div className="p-8 text-sm text-muted-foreground">{pick("جارٍ التحميل…", "Loading…")}</div>;

  if (menu.isError)
    return (
      <div className="mx-auto max-w-md p-8 text-center">
        <p className="font-display text-lg font-bold">{pick("لوحة المالك", "Owner console")}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          {pick("هذا الحساب ليس لديه صلاحية المالك.", "This account is not a restaurant owner.")}
        </p>
        <Link to="/app" search={{ branch: undefined }} className="mt-4 block text-xs underline">
          {pick("العودة للرئيسية", "Back to home")}
        </Link>
      </div>
    );

  const data = menu.data!;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">{pick("لوحة المالك", "Owner console")}</h1>
          <p className="text-xs text-muted-foreground">
            {pick(
              "إدارة الفروع والمنيو والخصومات والمخزون والطلبات",
              "Branches, menu, discounts, stock and orders",
            )}
          </p>
        </div>
        <button
          onClick={() => supabase.auth.signOut()}
          className="rounded-full border border-border px-4 py-2 text-xs"
        >
          {pick("تسجيل الخروج", "Sign out")}
        </button>
      </header>

      <div className="mb-5 flex gap-2">
        {(
          [
            { id: "menu", ar: "المنيو", en: "Menu", icon: UtensilsCrossed },
            { id: "design", ar: "شكل المنيو", en: "Menu design", icon: Palette },
            { id: "branches", ar: "الفروع", en: "Branches", icon: Store },
            { id: "team", ar: "الفريق", en: "Team", icon: Users },
            { id: "orders", ar: "الطلبات", en: "Orders", icon: ClipboardList },
          ] as const
        ).map((x) => (
          <button
            key={x.id}
            onClick={() => setTab(x.id)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-semibold",
              tab === x.id ? "border-primary bg-primary/10 text-primary" : "border-border",
            )}
          >
            <x.icon className="h-3.5 w-3.5" aria-hidden />
            {pick(x.ar, x.en)}
          </button>
        ))}
      </div>

      {tab === "menu" && (
        <MenuTab
          branches={data.branches}
          categories={data.categories}
          products={data.products}
          availability={data.availability}
          onChanged={refreshMenu}
          lang={lang}
        />
      )}
      {tab === "design" && (
        <DesignTab categories={data.categories} products={data.products} onChanged={refreshMenu} />
      )}
      {tab === "branches" && <BranchesTab branches={data.branches} onChanged={refreshMenu} />}
      {tab === "team" && <TeamTab branches={data.branches} />}
      {tab === "orders" && <OrdersTab branches={data.branches} lang={lang} />}
    </div>
  );
}

/* ----------------------------- menu ----------------------------- */

type Row = Record<string, unknown>;

function MenuTab({
  branches,
  categories,
  products,
  availability,
  onChanged,
  lang,
}: {
  branches: Row[];
  categories: Row[];
  products: Row[];
  availability: Row[];
  onChanged: () => void;
  lang: "ar" | "en";
}) {
  const { pick } = useI18n();
  const [editing, setEditing] = useState<Row | null>(null);
  const [creating, setCreating] = useState(false);
  const today = todayISO();

  const branchesOf = useMemo(() => {
    const map = new Map<string, { branchId: string; outToday: boolean }[]>();
    for (const a of availability) {
      const pid = a["product_id"] as string;
      const list = map.get(pid) ?? [];
      list.push({
        branchId: a["branch_id"] as string,
        outToday: (a["out_of_stock_on"] as string | null) === today,
      });
      map.set(pid, list);
    }
    return map;
  }, [availability, today]);

  const discount = useMutation({
    mutationFn: (v: { productId: string; discountPercent: number }) =>
      setProductDiscount({ data: v }),
    onSuccess: () => {
      toast.success(pick("تم تحديث الخصم", "Discount updated"));
      onChanged();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const stock = useMutation({
    mutationFn: (v: { productId: string; branchId: string; outOfStock: boolean }) =>
      setOutOfStockToday({ data: v }),
    onSuccess: () => {
      toast.success(pick("تم تحديث التوفر", "Availability updated"));
      onChanged();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const availableToggle = useMutation({
    mutationFn: (v: { productId: string; isAvailable: boolean }) => setProductAvailable({ data: v }),
    onSuccess: onChanged,
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <button
        onClick={() => {
          setEditing(null);
          setCreating(true);
        }}
        className="inline-flex items-center gap-1.5 rounded-full bg-[image:var(--gradient-brass)] px-5 py-2.5 text-sm font-bold text-primary-foreground"
      >
        <Plus className="h-4 w-4" aria-hidden />
        {pick("صنف جديد", "New item")}
      </button>

      {(creating || editing) && (
        <ProductForm
          key={(editing?.["id"] as string) ?? "new"}
          product={editing}
          categories={categories}
          branches={branches}
          selectedBranches={
            editing
              ? (branchesOf.get(editing["id"] as string) ?? []).map((b) => b.branchId)
              : branches.map((b) => b["id"] as string)
          }
          onDone={() => {
            setEditing(null);
            setCreating(false);
            onChanged();
          }}
          onCancel={() => {
            setEditing(null);
            setCreating(false);
          }}
        />
      )}

      <div className="space-y-2">
        {products.map((p) => {
          const id = p["id"] as string;
          const price = Number(p["price"]);
          const disc = Number(p["discount_percent"] ?? 0);
          const rows = branchesOf.get(id) ?? [];
          return (
            <div key={id} className="surface rounded-2xl p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold">
                    {pick(p["name_ar"] as string, p["name_en"] as string)}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {hasDiscount(disc) ? (
                      <>
                        <span className="line-through">{money(price, lang)}</span>{" "}
                        <span className="font-bold text-primary">
                          {money(effectivePrice(price, disc), lang)}
                        </span>{" "}
                        <span className="text-success">-{disc}%</span>
                      </>
                    ) : (
                      money(price, lang)
                    )}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <label className="flex items-center gap-1.5 text-xs">
                    {pick("خصم %", "Discount %")}
                    <input
                      type="number"
                      min={0}
                      max={90}
                      defaultValue={disc}
                      onBlur={(e) => {
                        const v = Number(e.target.value);
                        if (v !== disc) discount.mutate({ productId: id, discountPercent: v });
                      }}
                      className="h-9 w-16 rounded-lg border border-border bg-elevated px-2 text-sm"
                    />
                  </label>
                  <button
                    onClick={() =>
                      availableToggle.mutate({
                        productId: id,
                        isAvailable: !(p["is_available"] as boolean),
                      })
                    }
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-semibold",
                      p["is_available"]
                        ? "border-success/40 text-success"
                        : "border-destructive/40 text-destructive",
                    )}
                  >
                    {p["is_available"] ? pick("متاح", "Available") : pick("موقوف", "Hidden")}
                  </button>
                  <button
                    onClick={() => {
                      setCreating(false);
                      setEditing(p);
                    }}
                    className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs"
                  >
                    <Pencil className="h-3 w-3" aria-hidden />
                    {pick("تعديل", "Edit")}
                  </button>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {branches.map((b) => {
                  const bid = b["id"] as string;
                  const row = rows.find((r) => r.branchId === bid);
                  if (!row)
                    return (
                      <span
                        key={bid}
                        className="rounded-full border border-dashed border-border px-3 py-1 text-[11px] text-muted-foreground"
                      >
                        {pick(b["name_ar"] as string, b["name_en"] as string)} ·{" "}
                        {pick("غير مضاف", "Not assigned")}
                      </span>
                    );
                  return (
                    <button
                      key={bid}
                      onClick={() =>
                        stock.mutate({ productId: id, branchId: bid, outOfStock: !row.outToday })
                      }
                      className={cn(
                        "rounded-full border px-3 py-1 text-[11px] font-semibold",
                        row.outToday
                          ? "border-destructive/50 bg-destructive/10 text-destructive"
                          : "border-border",
                      )}
                    >
                      {pick(b["name_ar"] as string, b["name_en"] as string)} ·{" "}
                      {row.outToday
                        ? pick("نفد اليوم", "Out today")
                        : pick("متوفر اليوم", "In stock")}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ProductForm({
  product,
  categories,
  branches,
  selectedBranches,
  onDone,
  onCancel,
}: {
  product: Row | null;
  categories: Row[];
  branches: Row[];
  selectedBranches: string[];
  onDone: () => void;
  onCancel: () => void;
}) {
  const { pick } = useI18n();
  const [form, setForm] = useState({
    name_ar: (product?.["name_ar"] as string) ?? "",
    name_en: (product?.["name_en"] as string) ?? "",
    description_ar: (product?.["description_ar"] as string) ?? "",
    description_en: (product?.["description_en"] as string) ?? "",
    category_id: (product?.["category_id"] as string) ?? ((categories[0]?.["id"] as string) ?? ""),
    price: String(product?.["price"] ?? ""),
    discount_percent: String(product?.["discount_percent"] ?? "0"),
    image_url: (product?.["image_url"] as string) ?? "latte",
    calories: String(product?.["calories"] ?? ""),
    prep_minutes: String(product?.["prep_minutes"] ?? "5"),
    is_popular: Boolean(product?.["is_popular"]),
    is_new: Boolean(product?.["is_new"]),
  });
  const [branchIds, setBranchIds] = useState<string[]>(selectedBranches);

  const save = useMutation({
    mutationFn: () =>
      saveProduct({
        data: {
          id: (product?.["id"] as string) ?? null,
          category_id: form.category_id,
          name_en: form.name_en,
          name_ar: form.name_ar,
          description_en: form.description_en,
          description_ar: form.description_ar,
          price: Number(form.price),
          discount_percent: Number(form.discount_percent || 0),
          image_url: form.image_url,
          calories: form.calories ? Number(form.calories) : null,
          prep_minutes: Number(form.prep_minutes || 5),
          is_popular: form.is_popular,
          is_new: form.is_new,
          branchIds,
        },
      }),
    onSuccess: () => {
      toast.success(pick("تم الحفظ", "Saved"));
      onDone();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="surface rounded-3xl p-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          className={input}
          placeholder={pick("الاسم (عربي)", "Name (Arabic)")}
          value={form.name_ar}
          onChange={(e) => setForm({ ...form, name_ar: e.target.value })}
        />
        <input
          className={input}
          dir="ltr"
          placeholder="Name (English)"
          value={form.name_en}
          onChange={(e) => setForm({ ...form, name_en: e.target.value })}
        />
        <input
          className={input}
          placeholder={pick("الوصف (عربي)", "Description (Arabic)")}
          value={form.description_ar}
          onChange={(e) => setForm({ ...form, description_ar: e.target.value })}
        />
        <input
          className={input}
          dir="ltr"
          placeholder="Description (English)"
          value={form.description_en}
          onChange={(e) => setForm({ ...form, description_en: e.target.value })}
        />
        <select
          className={input}
          value={form.category_id}
          onChange={(e) => setForm({ ...form, category_id: e.target.value })}
        >
          {categories.map((c) => (
            <option key={c["id"] as string} value={c["id"] as string}>
              {pick(c["name_ar"] as string, c["name_en"] as string)}
            </option>
          ))}
        </select>
        <select
          className={input}
          value={form.image_url}
          onChange={(e) => setForm({ ...form, image_url: e.target.value })}
        >
          {IMAGE_KEYS.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
        <input
          className={input}
          dir="ltr"
          type="number"
          placeholder={pick("السعر", "Price")}
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
        />
        <input
          className={input}
          dir="ltr"
          type="number"
          placeholder={pick("الخصم %", "Discount %")}
          value={form.discount_percent}
          onChange={(e) => setForm({ ...form, discount_percent: e.target.value })}
        />
        <input
          className={input}
          dir="ltr"
          type="number"
          placeholder={pick("السعرات", "Calories")}
          value={form.calories}
          onChange={(e) => setForm({ ...form, calories: e.target.value })}
        />
        <input
          className={input}
          dir="ltr"
          type="number"
          placeholder={pick("دقائق التحضير", "Prep minutes")}
          value={form.prep_minutes}
          onChange={(e) => setForm({ ...form, prep_minutes: e.target.value })}
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-3 text-xs">
        <label className="flex items-center gap-1.5">
          <input
            type="checkbox"
            checked={form.is_popular}
            onChange={(e) => setForm({ ...form, is_popular: e.target.checked })}
          />
          {pick("الأكثر طلباً", "Popular")}
        </label>
        <label className="flex items-center gap-1.5">
          <input
            type="checkbox"
            checked={form.is_new}
            onChange={(e) => setForm({ ...form, is_new: e.target.checked })}
          />
          {pick("جديد", "New")}
        </label>
      </div>

      <p className="mt-4 text-xs font-semibold text-muted-foreground">
        {pick("الفروع التي تقدم هذا الصنف", "Branches serving this item")}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {branches.map((b) => {
          const id = b["id"] as string;
          const on = branchIds.includes(id);
          return (
            <button
              key={id}
              onClick={() =>
                setBranchIds(on ? branchIds.filter((x) => x !== id) : [...branchIds, id])
              }
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-semibold",
                on ? "border-primary bg-primary/10 text-primary" : "border-border",
              )}
            >
              {pick(b["name_ar"] as string, b["name_en"] as string)}
            </button>
          );
        })}
      </div>

      <div className="mt-5 flex gap-2">
        <button
          onClick={() => save.mutate()}
          disabled={save.isPending}
          className="rounded-full bg-[image:var(--gradient-brass)] px-6 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-50"
        >
          {pick("حفظ", "Save")}
        </button>
        <button onClick={onCancel} className="rounded-full border border-border px-6 py-2.5 text-sm">
          {pick("إلغاء", "Cancel")}
        </button>
      </div>
    </div>
  );
}

/* --------------------------- branches --------------------------- */

function BranchesTab({ branches, onChanged }: { branches: Row[]; onChanged: () => void }) {
  const { pick } = useI18n();
  const [editing, setEditing] = useState<Row | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <div className="space-y-4">
      <button
        onClick={() => {
          setEditing(null);
          setCreating(true);
        }}
        className="inline-flex items-center gap-1.5 rounded-full bg-[image:var(--gradient-brass)] px-5 py-2.5 text-sm font-bold text-primary-foreground"
      >
        <Plus className="h-4 w-4" aria-hidden />
        {pick("فرع جديد", "New branch")}
      </button>

      {(creating || editing) && (
        <BranchForm
          key={(editing?.["id"] as string) ?? "new"}
          branch={editing}
          onDone={() => {
            setEditing(null);
            setCreating(false);
            onChanged();
          }}
          onCancel={() => {
            setEditing(null);
            setCreating(false);
          }}
        />
      )}

      <div className="space-y-2">
        {branches.map((b) => (
          <div
            key={b["id"] as string}
            className="surface flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4"
          >
            <div>
              <p className="font-semibold">
                {pick(b["name_ar"] as string, b["name_en"] as string)}
              </p>
              <p className="text-xs text-muted-foreground" dir="ltr">
                {b["code"] as string} · {(b["phone"] as string) ?? "—"} ·{" "}
                {String(b["opens_at"]).slice(0, 5)}–{String(b["closes_at"]).slice(0, 5)}
              </p>
            </div>
            <button
              onClick={() => {
                setCreating(false);
                setEditing(b);
              }}
              className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs"
            >
              <Pencil className="h-3 w-3" aria-hidden />
              {pick("تعديل", "Edit")}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function BranchForm({
  branch,
  onDone,
  onCancel,
}: {
  branch: Row | null;
  onDone: () => void;
  onCancel: () => void;
}) {
  const { pick } = useI18n();
  const [form, setForm] = useState({
    name_ar: (branch?.["name_ar"] as string) ?? "",
    name_en: (branch?.["name_en"] as string) ?? "",
    code: (branch?.["code"] as string) ?? "",
    city_ar: (branch?.["city_ar"] as string) ?? "",
    city_en: (branch?.["city_en"] as string) ?? "",
    address_ar: (branch?.["address_ar"] as string) ?? "",
    address_en: (branch?.["address_en"] as string) ?? "",
    maps_url: (branch?.["maps_url"] as string) ?? "",
    lat: branch?.["lat"] === null || branch?.["lat"] === undefined ? "" : String(branch["lat"]),
    lng: branch?.["lng"] === null || branch?.["lng"] === undefined ? "" : String(branch["lng"]),
    phone: (branch?.["phone"] as string) ?? "",
    opens_at: String(branch?.["opens_at"] ?? "07:00:00").slice(0, 5),
    closes_at: String(branch?.["closes_at"] ?? "00:00:00").slice(0, 5),
    avg_prep_minutes: String(branch?.["avg_prep_minutes"] ?? "8"),
    is_open: branch ? Boolean(branch["is_open"]) : true,
  });

  const save = useMutation({
    mutationFn: () =>
      saveBranch({
        data: {
          id: (branch?.["id"] as string) ?? null,
          name_ar: form.name_ar,
          name_en: form.name_en,
          code: form.code,
          city_ar: form.city_ar,
          city_en: form.city_en,
          address_ar: form.address_ar,
          address_en: form.address_en,
          maps_url: form.maps_url,
          lat: form.lat.trim() === "" ? null : Number(form.lat),
          lng: form.lng.trim() === "" ? null : Number(form.lng),
          phone: form.phone,
          opens_at: `${form.opens_at}:00`,
          closes_at: `${form.closes_at}:00`,
          avg_prep_minutes: Number(form.avg_prep_minutes || 8),
          is_open: form.is_open,
        },
      }),
    onSuccess: () => {
      toast.success(pick("تم الحفظ", "Saved"));
      onDone();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="surface rounded-3xl p-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <input className={input} placeholder={pick("اسم الفرع (عربي)", "Branch name (Arabic)")} value={form.name_ar} onChange={(e) => setForm({ ...form, name_ar: e.target.value })} />
        <input className={input} dir="ltr" placeholder="Branch name (English)" value={form.name_en} onChange={(e) => setForm({ ...form, name_en: e.target.value })} />
        <input className={input} dir="ltr" placeholder={pick("رمز الفرع", "Branch code")} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
        <input className={input} dir="ltr" placeholder={pick("الهاتف", "Phone")} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <input className={input} placeholder={pick("المدينة (عربي)", "City (Arabic)")} value={form.city_ar} onChange={(e) => setForm({ ...form, city_ar: e.target.value })} />
        <input className={input} dir="ltr" placeholder="City (English)" value={form.city_en} onChange={(e) => setForm({ ...form, city_en: e.target.value })} />
        <input className={input} placeholder={pick("العنوان (عربي)", "Address (Arabic)")} value={form.address_ar} onChange={(e) => setForm({ ...form, address_ar: e.target.value })} />
        <input className={input} dir="ltr" placeholder="Address (English)" value={form.address_en} onChange={(e) => setForm({ ...form, address_en: e.target.value })} />
        <input className={cn(input, "sm:col-span-2")} dir="ltr" placeholder={pick("رابط الموقع على الخرائط", "Google Maps link")} value={form.maps_url} onChange={(e) => setForm({ ...form, maps_url: e.target.value })} />
        <input className={input} dir="ltr" placeholder={pick("خط العرض", "Latitude")} value={form.lat} onChange={(e) => setForm({ ...form, lat: e.target.value })} />
        <input className={input} dir="ltr" placeholder={pick("خط الطول", "Longitude")} value={form.lng} onChange={(e) => setForm({ ...form, lng: e.target.value })} />
        <input className={input} dir="ltr" type="time" value={form.opens_at} onChange={(e) => setForm({ ...form, opens_at: e.target.value })} />
        <input className={input} dir="ltr" type="time" value={form.closes_at} onChange={(e) => setForm({ ...form, closes_at: e.target.value })} />
        <input className={input} dir="ltr" type="number" placeholder={pick("متوسط التحضير (دقيقة)", "Avg prep minutes")} value={form.avg_prep_minutes} onChange={(e) => setForm({ ...form, avg_prep_minutes: e.target.value })} />
        <label className="flex items-center gap-2 text-xs">
          <input type="checkbox" checked={form.is_open} onChange={(e) => setForm({ ...form, is_open: e.target.checked })} />
          {pick("الفرع مفتوح", "Branch open")}
        </label>
      </div>
      {form.maps_url ? (
        <a href={form.maps_url} target="_blank" rel="noreferrer" className="mt-3 inline-block text-xs underline">
          {pick("فتح الموقع على الخرائط", "Open location on maps")}
        </a>
      ) : null}
      <div className="mt-5 flex gap-2">
        <button
          onClick={() => save.mutate()}
          disabled={save.isPending}
          className="rounded-full bg-[image:var(--gradient-brass)] px-6 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-50"
        >
          {pick("حفظ", "Save")}
        </button>
        <button onClick={onCancel} className="rounded-full border border-border px-6 py-2.5 text-sm">
          {pick("إلغاء", "Cancel")}
        </button>
      </div>
    </div>
  );
}

/* ---------------------------- orders ---------------------------- */

const ORDER_FILTERS = ["ALL", "IN_PROGRESS", "READY", "COMPLETED", "CANCELLED"] as const;

function OrdersTab({ branches, lang }: { branches: Row[]; lang: "ar" | "en" }) {
  const { pick } = useI18n();
  const [branchId, setBranchId] = useState<string>("");
  const [filter, setFilter] = useState<(typeof ORDER_FILTERS)[number]>("ALL");

  const orders = useQuery({
    queryKey: ["owner-orders", branchId],
    queryFn: () => ownerOrders({ data: { branchId: branchId || null } }),
    refetchInterval: 30_000,
  });

  const rows = useMemo(() => {
    const list = (orders.data ?? []) as Row[];
    if (filter === "ALL") return list;
    if (filter === "IN_PROGRESS")
      return list.filter((o) =>
        ["RECEIVED", "ACCEPTED", "PREPARING", "QUALITY_CHECK", "ARRIVING"].includes(
          o["status"] as string,
        ),
      );
    return list.filter((o) => o["status"] === filter);
  }, [orders.data, filter]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        <select
          className={cn(input, "h-9 w-auto")}
          value={branchId}
          onChange={(e) => setBranchId(e.target.value)}
        >
          <option value="">{pick("كل الفروع", "All branches")}</option>
          {branches.map((b) => (
            <option key={b["id"] as string} value={b["id"] as string}>
              {pick(b["name_ar"] as string, b["name_en"] as string)}
            </option>
          ))}
        </select>
        {ORDER_FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-full border px-4 py-2 text-xs font-semibold",
              filter === f ? "border-primary bg-primary text-primary-foreground" : "border-border",
            )}
          >
            {f === "ALL"
              ? pick("الكل", "All")
              : f === "IN_PROGRESS"
                ? pick("قيد التنفيذ", "In progress")
                : f === "READY"
                  ? pick("جاهز", "Ready")
                  : f === "COMPLETED"
                    ? pick("مكتمل", "Completed")
                    : pick("ملغي", "Cancelled")}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {rows.map((o) => {
          const branch = o["branches"] as Row | null;
          const items = (o["order_items"] as Row[]) ?? [];
          return (
            <div
              key={o["id"] as string}
              className="surface flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4"
            >
              <div className="min-w-0">
                <p className="font-display font-bold">{o["order_number"] as string}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {branch ? pick(branch["name_ar"] as string, branch["name_en"] as string) : ""} ·{" "}
                  {new Date(o["created_at"] as string).toLocaleString(
                    lang === "ar" ? "ar-QA" : "en-GB",
                  )}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {items
                    .map((i) => `${i["quantity"]}× ${pick(i["name_ar"] as string, i["name_en"] as string)}`)
                    .join(" • ")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-elevated px-2.5 py-1 text-[11px] font-semibold">
                  {o["status"] as string}
                </span>
                <span className="font-display font-bold text-primary">
                  {money(Number(o["total"]), lang)}
                </span>
              </div>
            </div>
          );
        })}
        {!rows.length && (
          <p className="py-16 text-center text-sm text-muted-foreground">
            {pick("لا توجد طلبات", "No orders")}
          </p>
        )}
      </div>
    </div>
  );
}
