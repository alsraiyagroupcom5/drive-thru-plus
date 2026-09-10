import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Clock3, Coffee, Store, UtensilsCrossed, ClipboardList, Pencil, Plus, Palette, Users, Radar, ExternalLink } from "lucide-react";
import { TeamTab } from "@/components/owner/TeamTab";
import { DesignTab } from "@/components/owner/DesignTab";
import { TrackingTab } from "@/components/owner/TrackingTab";
import { BranchOrdersTab } from "@/components/owner/BranchOrdersTab";
import { OrdersTicker } from "@/components/console/OrdersTicker";
import { ConsoleShell } from "@/components/console/ConsoleShell";
import { useOrdersRealtime } from "@/hooks/useOrdersRealtime";
import { Modal } from "@/components/console/Modal";

import { supabase } from "@/integrations/supabase/client";
import { useI18n, money, formatDateTime } from "@/lib/i18n";
import { foodImage } from "@/lib/food-images";
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
      { title: "Owner console — QR-Spring" },
      { name: "description", content: "Manage branches, menu, discounts, stock and orders." },
      { property: "og:title", content: "Owner console — QR-Spring" },
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

type Tab = "branches" | "menu" | "design" | "team" | "orders" | "settings";

function OwnerConsole() {
  const { pick, lang } = useI18n();
  const qc = useQueryClient();
  useOrdersRealtime(["owner-orders", "owner-menu"], "owner-orders");
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

  const navItems = [
    { id: "menu", label: pick("المنيو", "Menu"), hint: pick("الأصناف والأسعار", "Items & pricing"), icon: UtensilsCrossed },
    { id: "design", label: pick("شكل المنيو", "Menu design"), hint: pick("الترتيب والتمييز", "Order & highlights"), icon: Palette },
    { id: "branches", label: pick("الفروع", "Branches"), hint: pick("المواقع والتفاصيل", "Locations & details"), icon: Store },
    { id: "team", label: pick("الفريق", "Team"), hint: pick("الحسابات والصلاحيات", "Accounts & access"), icon: Users },
    { id: "settings", label: pick("الإعدادات", "Settings"), hint: pick("التتبع والمواقع", "Tracking & locations"), icon: Radar },
    { id: "orders", label: pick("الطلبات", "Orders"), hint: pick("قيد التنفيذ ومكتملة", "In progress & done"), icon: ClipboardList },
  ];

  return (
    <ConsoleShell
      title={pick("لوحة المالك", "Owner console")}
      subtitle={pick(
        "الفروع والمنيو والخصومات والمخزون والطلبات",
        "Branches, menu, discounts, stock and orders",
      )}
      items={navItems}
      active={tab}
      onSelect={(id) => setTab(id as Tab)}
      quickLinks={[
        { to: "/live", label: pick("الطلبات المباشرة", "Live orders") },
        { to: "/kitchen", label: pick("شاشة المطبخ", "Kitchen screen") },
      ]}
    >
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
      {tab === "settings" && (
        <TrackingTab branches={data.branches} onChanged={refreshMenu} />
      )}
      {tab === "orders" && <OrdersTab branches={data.branches} lang={lang} />}
    </ConsoleShell>
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
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
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

  const selectedBranch = branches.find((branch) => branch["id"] === selectedBranchId) ?? null;
  const branchProducts = selectedBranchId
    ? products.filter((product) =>
        (branchesOf.get(product["id"] as string) ?? []).some((row) => row.branchId === selectedBranchId),
      )
    : [];

  if (!selectedBranch) {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3 border-b border-border pb-5 sm:flex sm:flex-wrap sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase text-primary">{pick("إدارة المنيو", "Menu management")}</p>
            <h2 className="mt-1 truncate font-display text-2xl font-bold">{pick("اختر الفرع", "Choose a branch")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {pick("افتح أي فرع لإدارة أصنافه كما هي الآن.", "Open a branch to manage its existing menu.")}
            </p>
          </div>
          <div className="shrink-0 rounded-2xl border border-border bg-elevated px-4 py-3 text-end">
            <p className="text-[11px] text-muted-foreground">{pick("إجمالي الفروع", "Total branches")}</p>
            <p className="font-display text-xl font-bold" dir="ltr">{branches.length}</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {branches.map((branch) => {
            const branchId = branch["id"] as string;
            const assigned = products.filter((product) =>
              (branchesOf.get(product["id"] as string) ?? []).some((row) => row.branchId === branchId),
            );
            const outCount = assigned.filter((product) =>
              (branchesOf.get(product["id"] as string) ?? []).some(
                (row) => row.branchId === branchId && row.outToday,
              ),
            ).length;
            return (
              <button
                key={branchId}
                onClick={() => setSelectedBranchId(branchId)}
                className="group overflow-hidden rounded-2xl border border-border bg-card text-start shadow-sm transition duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lift"
              >
                <div className="flex items-start justify-between gap-3 border-b border-border bg-elevated p-5">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
                    <Store className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="flex items-center gap-2">
                    <span
                      role="link"
                      tabIndex={0}
                      title={pick("معاينة المنيو كزائر", "Preview menu as guest")}
                      aria-label={pick("معاينة المنيو كزائر", "Preview menu as guest")}
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(`/app?branch=${encodeURIComponent(String(branch["code"] ?? ""))}`, "_blank", "noopener");
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.stopPropagation();
                          window.open(`/app?branch=${encodeURIComponent(String(branch["code"] ?? ""))}`, "_blank", "noopener");
                        }
                      }}
                      className="grid h-8 w-8 cursor-pointer place-items-center rounded-full border border-border bg-card text-muted-foreground transition hover:border-primary/40 hover:text-primary"
                    >
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                    </span>
                    <span className={cn("rounded-full px-3 py-1 text-[11px] font-bold", branch["is_open"] ? "bg-success/15 text-success" : "bg-destructive/12 text-destructive")}>
                      {branch["is_open"] ? pick("مفتوح", "Open") : pick("مغلق", "Closed")}
                    </span>
                  </span>
                </div>
                <div className="p-5">
                  <h3 className="truncate font-display text-lg font-bold">{pick(branch["name_ar"] as string, branch["name_en"] as string)}</h3>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {pick(branch["address_ar"] as string, branch["address_en"] as string) || pick("لم يضف عنوان", "No address added")}
                  </p>
                  <div className="mt-5 grid grid-cols-2 gap-2">
                    <div className="rounded-xl bg-elevated p-3"><p className="text-[10px] text-muted-foreground">{pick("الأصناف", "Items")}</p><p className="mt-1 font-display text-lg font-bold" dir="ltr">{assigned.length}</p></div>
                    <div className="rounded-xl bg-elevated p-3"><p className="text-[10px] text-muted-foreground">{pick("نفد اليوم", "Out today")}</p><p className="mt-1 font-display text-lg font-bold" dir="ltr">{outCount}</p></div>
                  </div>
                  <div className="mt-5 flex items-center justify-between border-t border-border pt-4 text-xs font-bold text-primary">
                    <span>{pick("فتح منيو الفرع", "Open branch menu")}</span>
                    {lang === "ar" ? <ArrowLeft className="h-4 w-4 transition group-hover:-translate-x-1" aria-hidden /> : <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" aria-hidden />}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <nav aria-label={pick("التنقل بين الفروع", "Branch navigation")} className="-mx-1 flex gap-2 overflow-x-auto border-b border-border px-1 pb-4">
        {branches.map((branch) => {
          const branchId = branch["id"] as string;
          const active = branchId === selectedBranchId;
          const itemCount = products.filter((product) =>
            (branchesOf.get(product["id"] as string) ?? []).some((row) => row.branchId === branchId),
          ).length;
          return (
            <button key={branchId} onClick={() => setSelectedBranchId(branchId)} aria-current={active ? "page" : undefined} className={cn("flex shrink-0 items-center gap-3 rounded-xl border px-4 py-2.5 text-start transition", active ? "border-primary bg-primary text-primary-foreground shadow-sm" : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground")}>
              <Store className="h-4 w-4 shrink-0" aria-hidden />
              <span><span className="block max-w-40 truncate text-xs font-bold">{pick(branch["name_ar"] as string, branch["name_en"] as string)}</span><span className="block text-[10px]" dir="ltr">{itemCount} {pick("صنف", "items")}</span></span>
            </button>
          );
        })}
      </nav>

      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border pb-5 sm:flex sm:flex-wrap sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <button onClick={() => setSelectedBranchId(null)} aria-label={pick("العودة إلى الفروع", "Back to branches")} className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-border bg-card text-muted-foreground">
            {lang === "ar" ? <ArrowRight className="h-4 w-4" aria-hidden /> : <ArrowLeft className="h-4 w-4" aria-hidden />}
          </button>
          <div className="min-w-0"><h2 className="truncate font-display text-xl font-bold">{pick(selectedBranch["name_ar"] as string, selectedBranch["name_en"] as string)}</h2><p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><Clock3 className="h-3.5 w-3.5 shrink-0" aria-hidden /><span dir="ltr">{String(selectedBranch["opens_at"] ?? "").slice(0, 5)}–{String(selectedBranch["closes_at"] ?? "").slice(0, 5)}</span></p></div>
        </div>
        <button onClick={() => { setEditing(null); setCreating(true); }} className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[image:var(--gradient-brass)] px-4 py-2.5 text-sm font-bold text-primary-foreground"><Plus className="h-4 w-4" aria-hidden />{pick("صنف جديد", "New item")}</button>
      </div>

      <Modal
        open={creating || editing !== null}
        onClose={() => {
          setEditing(null);
          setCreating(false);
        }}
        title={editing ? pick("تعديل الصنف", "Edit item") : pick("صنف جديد", "New item")}
        subtitle={pick("تفاصيل الصنف والسعر والفروع.", "Item details, price and branches.")}
      >
        <ProductForm
          key={(editing?.["id"] as string) ?? "new"}
          product={editing}
          categories={categories}
          branches={branches}
          selectedBranches={
            editing
              ? (branchesOf.get(editing["id"] as string) ?? []).map((b) => b.branchId)
              : [selectedBranch["id"] as string]
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
      </Modal>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {branchProducts.map((p) => {
          const id = p["id"] as string;
          const price = Number(p["price"]);
          const disc = Number(p["discount_percent"] ?? 0);
          const rows = branchesOf.get(id) ?? [];
          const selectedStock = rows.find((row) => row.branchId === selectedBranchId);
          return (
            <article key={id} className="surface overflow-hidden rounded-2xl">
              <div className="relative aspect-[16/9] overflow-hidden bg-elevated">
                <img src={foodImage(p["image_url"] as string)} alt={pick(p["name_ar"] as string, p["name_en"] as string)} className="h-full w-full object-cover" loading="lazy" />
                <span className={cn("absolute end-3 top-3 rounded-full px-3 py-1 text-[11px] font-bold backdrop-blur", p["is_available"] ? "bg-success/90 text-success-foreground" : "bg-destructive/90 text-destructive-foreground")}>{p["is_available"] ? pick("متاح", "Available") : pick("موقوف", "Hidden")}</span>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                  <div className="min-w-0"><p className="truncate font-semibold">
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
                  </p></div>
                  <button onClick={() => { setCreating(false); setEditing(p); }} aria-label={pick("تعديل الصنف", "Edit item")} className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border text-muted-foreground transition hover:border-primary/40 hover:text-primary"><Pencil className="h-3.5 w-3.5" aria-hidden /></button>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2">
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
                </div>

              <div className="mt-3 border-t border-border pt-3">
                {selectedStock ? (
                  <button onClick={() => stock.mutate({ productId: id, branchId: selectedStock.branchId, outOfStock: !selectedStock.outToday })} className={cn("w-full rounded-xl border px-3 py-2 text-xs font-semibold", selectedStock.outToday ? "border-destructive/50 bg-destructive/10 text-destructive" : "border-border text-muted-foreground")}>
                    {selectedStock.outToday ? pick("نفد اليوم", "Out today") : pick("متوفر اليوم", "In stock today")}
                  </button>
                ) : null}
              </div>
              </div>
            </article>
          );
        })}
        {!branchProducts.length ? <div className="rounded-2xl border border-dashed border-border py-16 text-center sm:col-span-2 xl:col-span-3"><Coffee className="mx-auto h-7 w-7 text-muted-foreground" aria-hidden /><p className="mt-3 text-sm font-semibold">{pick("لا توجد أصناف في هذا الفرع", "No items in this branch")}</p></div> : null}
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

      <Modal
        open={creating || editing !== null}
        onClose={() => {
          setEditing(null);
          setCreating(false);
        }}
        title={editing ? pick("تعديل الفرع", "Edit branch") : pick("فرع جديد", "New branch")}
        subtitle={pick("بيانات الفرع والموقع وأوقات العمل.", "Branch details, location and hours.")}
      >
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
      </Modal>

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

function OrdersTab({ branches }: { branches: Row[]; lang: "ar" | "en" }) {
  const orders = useQuery({
    queryKey: ["owner-orders", "all"],
    queryFn: () => ownerOrders({ data: { branchId: null } }),
    refetchInterval: 10_000,
    refetchIntervalInBackground: true,
  });

  return (
    <div className="space-y-5">
      <OrdersTicker orders={(orders.data ?? []) as Row[]} branches={branches} />
      <div className="surface rounded-3xl p-5">
        <BranchOrdersTab
          branches={branches}
          orders={(orders.data ?? []) as Row[]}
          loading={orders.isLoading}
        />
      </div>
    </div>
  );
}
