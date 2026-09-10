import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ClipboardList,
  Inbox,
  LayoutDashboard,
  MapPin,
  Palette,
  Phone,
  Store,
  UtensilsCrossed,
  Users,
} from "lucide-react";
import { ConsoleShell, StatusChip } from "@/components/console/ConsoleShell";
import { Modal } from "@/components/console/Modal";
import { TeamTab } from "@/components/owner/TeamTab";
import { DesignTab } from "@/components/owner/DesignTab";
import { useI18n, money, formatDateTime } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { effectivePrice, hasDiscount, todayISO } from "@/lib/pricing";
import { clientSummary } from "@/lib/admin.functions";
import { saveRestaurant } from "@/lib/admin.functions";
import {
  ownerMenu,
  ownerOrders,
  saveBranch,
  saveProduct,
  setOutOfStockToday,
  setProductAvailable,
  setProductBranches,
  setProductDiscount,
} from "@/lib/owner.functions";

export const Route = createFileRoute("/_authenticated/admin_/clients/$clientId")({
  head: () => ({
    meta: [
      { title: "Client workspace — Origami Platform" },
      { name: "description", content: "Manage one restaurant: menu, categories, branches, staff and contact details." },
      { property: "og:title", content: "Client workspace — Origami Platform" },
      { property: "og:description", content: "Menu, categories, branches, staff and contact details for one client." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ClientWorkspace,
});

const input =
  "h-11 w-full rounded-xl border border-border bg-elevated px-3 text-sm outline-none ring-ring/40 focus:ring-2";

type Row = Record<string, unknown>;
type Tab = "overview" | "menu" | "design" | "branches" | "team" | "contact" | "orders";

const TABS = [
  { id: "overview", ar: "نظرة عامة", en: "Overview", hintAr: "المؤشرات", hintEn: "Key numbers", icon: LayoutDashboard },
  { id: "menu", ar: "المنيو", en: "Menu", hintAr: "الأصناف والأسعار", hintEn: "Items & prices", icon: UtensilsCrossed },
  { id: "design", ar: "شكل المنيو", en: "Menu layout", hintAr: "الأقسام والترتيب", hintEn: "Sections & order", icon: Palette },
  { id: "branches", ar: "الفروع", en: "Branches", hintAr: "المواقع والأوقات", hintEn: "Locations & hours", icon: MapPin },
  { id: "team", ar: "الفريق", en: "Staff", hintAr: "الحسابات والصلاحيات", hintEn: "Accounts & access", icon: Users },
  { id: "contact", ar: "بيانات التواصل", en: "Contact", hintAr: "اسم المطعم والهواتف", hintEn: "Name & phones", icon: Phone },
  { id: "orders", ar: "الطلبات", en: "Orders", hintAr: "آخر الطلبات", hintEn: "Latest orders", icon: ClipboardList },
] as const;

function ClientWorkspace() {
  const { clientId } = Route.useParams();
  const { pick, lang } = useI18n();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("overview");
  const [search, setSearch] = useState("");

  const summary = useQuery({
    queryKey: ["client-summary", clientId],
    queryFn: () => clientSummary({ data: { restaurantId: clientId } }),
  });
  const menu = useQuery({
    queryKey: ["client-menu", clientId],
    queryFn: () => ownerMenu({ data: { restaurantId: clientId } }),
  });
  const orders = useQuery({
    queryKey: ["client-orders", clientId],
    queryFn: () => ownerOrders({ data: { restaurantId: clientId } }),
    enabled: tab === "orders" || tab === "overview",
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["client-menu", clientId] });
    qc.invalidateQueries({ queryKey: ["client-summary", clientId] });
    qc.invalidateQueries({ queryKey: ["admin-client-cards"] });
  };

  const branches = (menu.data?.branches ?? []) as Row[];
  const categories = (menu.data?.categories ?? []) as Row[];
  const products = (menu.data?.products ?? []) as Row[];
  const availability = (menu.data?.availability ?? []) as Row[];

  const name = summary.data
    ? pick(summary.data.restaurant.name_ar, summary.data.restaurant.name_en)
    : pick("العميل", "Client");

  const navigate = Route.useNavigate();
  const MAIN_NAV = [
    { id: "overview", ar: "نظرة عامة", en: "Overview", hintAr: "المؤشرات", hintEn: "Key numbers", icon: LayoutDashboard },
    { id: "accounts", ar: "الحسابات", en: "Accounts", hintAr: "الفريق والصلاحيات", hintEn: "People & access", icon: Users },
    { id: "restaurants", ar: "المطاعم", en: "Restaurants", hintAr: "العملاء", hintEn: "Clients", icon: Store },
    { id: "requests", ar: "طلبات الاشتراك", en: "Sign-up requests", hintAr: "عملاء محتملون", hintEn: "Leads", icon: Inbox },
  ];
  const navItems = MAIN_NAV.map((t) => ({
    id: t.id,
    label: pick(t.ar, t.en),
    hint: pick(t.hintAr, t.hintEn),
    icon: t.icon,
    badge: null,
  }));

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) =>
      `${p["name_en"]} ${p["name_ar"]}`.toLowerCase().includes(q),
    );
  }, [products, search]);

  return (
    <ConsoleShell
      title={name}
      subtitle={pick("مساحة إدارة العميل", "Client workspace")}
      items={navItems}
      active="restaurants"
      onSelect={(id) => void navigate({ to: "/admin", search: { tab: id } })}
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder={pick("ابحث في الأصناف…", "Search items…")}
      backTo="/admin"
      backLabel={pick("كل العملاء", "All clients")}
      secondaryTitle={name}
      secondary={
        <nav className="flex gap-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as Tab)}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-semibold transition",
                tab === t.id
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
              )}
            >
              <t.icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span className="truncate">{pick(t.ar, t.en)}</span>
            </button>
          ))}
        </nav>
      }
    >
      {menu.isLoading || summary.isLoading ? (
        <p className="py-16 text-center text-sm text-muted-foreground">{pick("جارٍ التحميل…", "Loading…")}</p>
      ) : null}

      {tab === "overview" && summary.data ? (
        <section className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { ar: "الفروع", en: "Branches", v: branches.length },
              { ar: "الأصناف", en: "Menu items", v: products.length },
              { ar: "طلبات 24 ساعة", en: "Orders (24h)", v: summary.data.orders24h },
              { ar: "مبيعات 24 ساعة", en: "Revenue (24h)", v: money(summary.data.revenue24h, lang) },
            ].map((k) => (
              <div key={k.en} className="rounded-2xl bg-elevated p-4">
                <p className="text-xs text-muted-foreground">{pick(k.ar, k.en)}</p>
                <p className="mt-1 font-display text-2xl font-bold" dir="ltr">
                  {k.v}
                </p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <StatusChip label={pick("قيد التنفيذ", "In progress")} count={summary.data.inProgress} tone="warning" />
            <StatusChip label={pick("فروع مفتوحة", "Open branches")} count={summary.data.branches.filter((b) => b.is_open).length} tone="success" />
            <StatusChip label={pick("أقسام المنيو", "Menu sections")} count={categories.length} tone="info" />
          </div>

          <div className="rounded-3xl border border-border p-5">
            <h2 className="font-display text-lg font-bold">{pick("أحدث الطلبات", "Latest orders")}</h2>
            <div className="mt-2 divide-y divide-border">
              {(orders.data ?? []).slice(0, 8).map((o) => (
                <div key={o.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <div className="min-w-0">
                    <p className="font-semibold" dir="ltr">
                      {o.order_number}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {formatDateTime(o.created_at, lang)}
                    </p>
                  </div>
                  <div className="text-end">
                    <p className="text-xs text-muted-foreground">{o.status}</p>
                    <p className="font-semibold">{money(Number(o.total), lang)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {tab === "menu" ? (
        <MenuTab
          restaurantId={clientId}
          branches={branches}
          categories={categories}
          products={filtered}
          availability={availability}
          onChanged={refresh}
        />
      ) : null}

      {tab === "design" ? (
        <DesignTab
          categories={categories}
          products={products}
          onChanged={refresh}
          restaurantId={clientId}
        />
      ) : null}

      {tab === "branches" ? (
        <BranchesTab restaurantId={clientId} branches={branches} onChanged={refresh} />
      ) : null}

      {tab === "team" ? <TeamTab branches={branches} restaurantId={clientId} /> : null}

      {tab === "contact" && summary.data ? (
        <ContactTab
          restaurant={summary.data.restaurant as Row}
          branches={branches}
          onChanged={refresh}
        />
      ) : null}

      {tab === "orders" ? (
        <div className="space-y-2">
          {(orders.data ?? []).map((o) => (
            <div key={o.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border p-4">
              <div className="min-w-0">
                <p className="font-semibold" dir="ltr">
                  {o.order_number}
                </p>
                <p className="text-xs text-muted-foreground">
                  {o.branches ? pick(o.branches.name_ar, o.branches.name_en) : ""} ·{" "}
                  {formatDateTime(o.created_at, lang)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-accent px-3 py-1 text-[11px] font-bold">{o.status}</span>
                <span className="font-semibold">{money(Number(o.total), lang)}</span>
              </div>
            </div>
          ))}
          {orders.data && !orders.data.length ? (
            <p className="py-16 text-center text-sm text-muted-foreground">
              {pick("لا توجد طلبات", "No orders")}
            </p>
          ) : null}
        </div>
      ) : null}
    </ConsoleShell>
  );
}

/* ------------------------------ menu ------------------------------ */

function MenuTab({
  restaurantId,
  branches,
  categories,
  products,
  availability,
  onChanged,
}: {
  restaurantId: string;
  branches: Row[];
  categories: Row[];
  products: Row[];
  availability: Row[];
  onChanged: () => void;
}) {
  const { pick, lang } = useI18n();
  const [editing, setEditing] = useState<Row | null>(null);
  const [creating, setCreating] = useState(false);

  const discount = useMutation({
    mutationFn: (v: { productId: string; discountPercent: number }) =>
      setProductDiscount({ data: { ...v, restaurantId } }),
    onSuccess: onChanged,
    onError: (e: Error) => toast.error(e.message),
  });
  const available = useMutation({
    mutationFn: (v: { productId: string; isAvailable: boolean }) =>
      setProductAvailable({ data: { ...v, restaurantId } }),
    onSuccess: onChanged,
    onError: (e: Error) => toast.error(e.message),
  });
  const stock = useMutation({
    mutationFn: (v: { productId: string; branchId: string; outOfStock: boolean }) =>
      setOutOfStockToday({ data: { ...v, restaurantId } }),
    onSuccess: onChanged,
    onError: (e: Error) => toast.error(e.message),
  });
  const assign = useMutation({
    mutationFn: (v: { productId: string; branchIds: string[] }) =>
      setProductBranches({ data: { ...v, restaurantId } }),
    onSuccess: onChanged,
    onError: (e: Error) => toast.error(e.message),
  });

  const today = todayISO();
  const branchIdsOf = (productId: string) =>
    availability.filter((a) => a["product_id"] === productId).map((a) => a["branch_id"] as string);
  const outToday = (productId: string, branchId: string) =>
    availability.some(
      (a) =>
        a["product_id"] === productId && a["branch_id"] === branchId && a["out_of_stock_on"] === today,
    );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          {pick(
            "أضف الأصناف، عدّل الأسعار والخصومات، وحدّد الفروع التي تقدّمها.",
            "Add items, edit prices and discounts, and choose which branches serve them.",
          )}
        </p>
        <button
          onClick={() => {
            setEditing(null);
            setCreating((v) => !v);
          }}
          className="rounded-full bg-[image:var(--gradient-brass)] px-5 py-2.5 text-sm font-bold text-primary-foreground"
        >
          {pick("صنف جديد", "New item")}
        </button>
      </div>

      <Modal
        open={creating || editing !== null}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        title={editing ? pick("تعديل الصنف", "Edit item") : pick("صنف جديد", "New item")}
        subtitle={pick("تفاصيل الصنف والسعر والفروع.", "Item details, price and branches.")}
      >
        <ProductForm
          key={(editing?.["id"] as string | undefined) ?? "new"}
          restaurantId={restaurantId}
          categories={categories}
          branches={branches}
          product={editing}
          initialBranchIds={editing ? branchIdsOf(editing["id"] as string) : branches.map((b) => b["id"] as string)}
          onDone={() => {
            setCreating(false);
            setEditing(null);
            onChanged();
          }}
          onCancel={() => {
            setCreating(false);
            setEditing(null);
          }}
        />
      </Modal>

      <div className="space-y-2">
        {products.map((p) => {
          const id = p["id"] as string;
          const price = Number(p["price"]);
          const dp = Number(p["discount_percent"] ?? 0);
          const serving = branchIdsOf(id);
          return (
            <div key={id} className="rounded-2xl border border-border p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold">{pick(p["name_ar"] as string, p["name_en"] as string)}</p>
                  <p className="text-xs text-muted-foreground">
                    {hasDiscount(p as never) ? (
                      <>
                        <span className="line-through">{money(price, lang)}</span>{" "}
                        <span className="font-bold text-primary">{money(effectivePrice(p as never), lang)}</span>
                      </>
                    ) : (
                      money(price, lang)
                    )}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    {pick("خصم %", "Discount %")}
                    <input
                      type="number"
                      dir="ltr"
                      defaultValue={dp}
                      min={0}
                      max={90}
                      onBlur={(e) =>
                        discount.mutate({ productId: id, discountPercent: Number(e.target.value) })
                      }
                      className="h-9 w-20 rounded-xl border border-border bg-elevated px-2 text-sm"
                    />
                  </label>
                  <button
                    onClick={() => available.mutate({ productId: id, isAvailable: !p["is_available"] })}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-xs font-semibold",
                      p["is_available"] ? "bg-success/15 text-success" : "bg-destructive/12 text-destructive",
                    )}
                  >
                    {p["is_available"] ? pick("متاح", "Available") : pick("موقوف", "Paused")}
                  </button>
                  <button
                    onClick={() => {
                      setCreating(false);
                      setEditing(p);
                    }}
                    className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold"
                  >
                    {pick("تعديل", "Edit")}
                  </button>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {branches.map((b) => {
                  const bid = b["id"] as string;
                  const on = serving.includes(bid);
                  const out = outToday(id, bid);
                  return (
                    <div key={bid} className="flex items-center gap-1">
                      <button
                        onClick={() =>
                          assign.mutate({
                            productId: id,
                            branchIds: on ? serving.filter((x) => x !== bid) : [...serving, bid],
                          })
                        }
                        className={cn(
                          "rounded-full border px-3 py-1 text-[11px] font-semibold",
                          on ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground",
                        )}
                      >
                        {pick(b["name_ar"] as string, b["name_en"] as string)}
                      </button>
                      {on ? (
                        <button
                          onClick={() => stock.mutate({ productId: id, branchId: bid, outOfStock: !out })}
                          className={cn(
                            "rounded-full px-2.5 py-1 text-[10px] font-bold",
                            out ? "bg-destructive/12 text-destructive" : "bg-muted text-muted-foreground",
                          )}
                        >
                          {out ? pick("نفد اليوم", "Out today") : pick("نفد اليوم؟", "Out today?")}
                        </button>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
        {!products.length ? (
          <p className="py-16 text-center text-sm text-muted-foreground">
            {pick("لا توجد أصناف", "No items")}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function ProductForm({
  restaurantId,
  categories,
  branches,
  product,
  initialBranchIds,
  onDone,
  onCancel,
}: {
  restaurantId: string;
  categories: Row[];
  branches: Row[];
  product: Row | null;
  initialBranchIds: string[];
  onDone: () => void;
  onCancel: () => void;
}) {
  const { pick } = useI18n();
  const [form, setForm] = useState({
    name_ar: (product?.["name_ar"] as string) ?? "",
    name_en: (product?.["name_en"] as string) ?? "",
    description_ar: (product?.["description_ar"] as string) ?? "",
    description_en: (product?.["description_en"] as string) ?? "",
    price: String(product?.["price"] ?? ""),
    discount_percent: String(product?.["discount_percent"] ?? "0"),
    category_id: (product?.["category_id"] as string) ?? ((categories[0]?.["id"] as string) ?? ""),
    image_url: (product?.["image_url"] as string) ?? "latte",
  });
  const [branchIds, setBranchIds] = useState<string[]>(initialBranchIds);

  const save = useMutation({
    mutationFn: () =>
      saveProduct({
        data: {
          restaurantId,
          id: (product?.["id"] as string) ?? null,
          category_id: form.category_id,
          name_ar: form.name_ar,
          name_en: form.name_en,
          description_ar: form.description_ar,
          description_en: form.description_en,
          price: Number(form.price),
          discount_percent: Number(form.discount_percent),
          image_url: form.image_url,
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
    <div className="rounded-3xl border border-border p-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <input className={input} placeholder={pick("الاسم (عربي)", "Name (Arabic)")} value={form.name_ar} onChange={(e) => setForm({ ...form, name_ar: e.target.value })} />
        <input className={input} dir="ltr" placeholder="Name (English)" value={form.name_en} onChange={(e) => setForm({ ...form, name_en: e.target.value })} />
        <input className={input} placeholder={pick("الوصف (عربي)", "Description (Arabic)")} value={form.description_ar} onChange={(e) => setForm({ ...form, description_ar: e.target.value })} />
        <input className={input} dir="ltr" placeholder="Description (English)" value={form.description_en} onChange={(e) => setForm({ ...form, description_en: e.target.value })} />
        <input className={input} dir="ltr" type="number" placeholder={pick("السعر", "Price")} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
        <input className={input} dir="ltr" type="number" placeholder={pick("الخصم %", "Discount %")} value={form.discount_percent} onChange={(e) => setForm({ ...form, discount_percent: e.target.value })} />
        <select className={input} value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
          {categories.map((c) => (
            <option key={c["id"] as string} value={c["id"] as string}>
              {pick(c["name_ar"] as string, c["name_en"] as string)}
            </option>
          ))}
        </select>
        <input className={input} dir="ltr" placeholder="image key (latte, gelato…)" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {branches.map((b) => {
          const bid = b["id"] as string;
          const on = branchIds.includes(bid);
          return (
            <button
              key={bid}
              onClick={() => setBranchIds(on ? branchIds.filter((x) => x !== bid) : [...branchIds, bid])}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-semibold",
                on ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground",
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

/* ---------------------------- branches ---------------------------- */

function BranchesTab({
  restaurantId,
  branches,
  onChanged,
}: {
  restaurantId: string;
  branches: Row[];
  onChanged: () => void;
}) {
  const { pick } = useI18n();
  const [editing, setEditing] = useState<Row | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          {pick("الفروع والمواقع وأوقات العمل.", "Branches, locations and opening hours.")}
        </p>
        <button
          onClick={() => {
            setEditing(null);
            setCreating((v) => !v);
          }}
          className="rounded-full bg-[image:var(--gradient-brass)] px-5 py-2.5 text-sm font-bold text-primary-foreground"
        >
          {pick("فرع جديد", "New branch")}
        </button>
      </div>

      <Modal
        open={creating || editing !== null}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        title={editing ? pick("تعديل الفرع", "Edit branch") : pick("فرع جديد", "New branch")}
        subtitle={pick("بيانات الفرع والموقع وأوقات العمل.", "Branch details, location and opening hours.")}
      >
        <BranchForm
          key={(editing?.["id"] as string | undefined) ?? "new"}
          restaurantId={restaurantId}
          branch={editing}
          onDone={() => {
            setCreating(false);
            setEditing(null);
            onChanged();
          }}
          onCancel={() => {
            setCreating(false);
            setEditing(null);
          }}
        />
      </Modal>

      <div className="grid gap-3 sm:grid-cols-2">
        {branches.map((b) => (
          <div key={b["id"] as string} className="rounded-2xl border border-border p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold">{pick(b["name_ar"] as string, b["name_en"] as string)}</p>
                <p className="text-xs text-muted-foreground" dir="ltr">
                  {(b["code"] as string) ?? ""} · {(b["phone"] as string) ?? "—"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {pick(b["address_ar"] as string, b["address_en"] as string) || "—"}
                </p>
              </div>
              <button
                onClick={() => {
                  setCreating(false);
                  setEditing(b);
                }}
                className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold"
              >
                {pick("تعديل", "Edit")}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BranchForm({
  restaurantId,
  branch,
  onDone,
  onCancel,
}: {
  restaurantId: string;
  branch: Row | null;
  onDone: () => void;
  onCancel: () => void;
}) {
  const { pick } = useI18n();
  const [f, setF] = useState({
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
    opens_at: ((branch?.["opens_at"] as string) ?? "07:00:00").slice(0, 5),
    closes_at: ((branch?.["closes_at"] as string) ?? "00:00:00").slice(0, 5),
    is_open: (branch?.["is_open"] as boolean) ?? true,
  });

  const save = useMutation({
    mutationFn: () =>
      saveBranch({
        data: {
          restaurantId,
          id: (branch?.["id"] as string) ?? null,
          name_ar: f.name_ar,
          name_en: f.name_en,
          code: f.code,
          city_ar: f.city_ar,
          city_en: f.city_en,
          address_ar: f.address_ar,
          address_en: f.address_en,
          maps_url: f.maps_url,
          lat: f.lat ? Number(f.lat) : null,
          lng: f.lng ? Number(f.lng) : null,
          phone: f.phone,
          opens_at: `${f.opens_at}:00`,
          closes_at: `${f.closes_at}:00`,
          is_open: f.is_open,
        },
      }),
    onSuccess: () => {
      toast.success(pick("تم الحفظ", "Saved"));
      onDone();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2">
        <input className={input} placeholder={pick("اسم الفرع (عربي)", "Branch name (Arabic)")} value={f.name_ar} onChange={(e) => setF({ ...f, name_ar: e.target.value })} />
        <input className={input} dir="ltr" placeholder="Branch name (English)" value={f.name_en} onChange={(e) => setF({ ...f, name_en: e.target.value })} />
        <input className={input} dir="ltr" placeholder={pick("الرمز", "Code")} value={f.code} onChange={(e) => setF({ ...f, code: e.target.value })} />
        <input className={input} dir="ltr" placeholder={pick("الهاتف", "Phone")} value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
        <input className={input} placeholder={pick("المدينة (عربي)", "City (Arabic)")} value={f.city_ar} onChange={(e) => setF({ ...f, city_ar: e.target.value })} />
        <input className={input} dir="ltr" placeholder="City (English)" value={f.city_en} onChange={(e) => setF({ ...f, city_en: e.target.value })} />
        <input className={input} placeholder={pick("العنوان (عربي)", "Address (Arabic)")} value={f.address_ar} onChange={(e) => setF({ ...f, address_ar: e.target.value })} />
        <input className={input} dir="ltr" placeholder="Address (English)" value={f.address_en} onChange={(e) => setF({ ...f, address_en: e.target.value })} />
        <input className={input} dir="ltr" placeholder="Google Maps URL" value={f.maps_url} onChange={(e) => setF({ ...f, maps_url: e.target.value })} />
        <div className="grid grid-cols-2 gap-3">
          <input className={input} dir="ltr" placeholder="lat" value={f.lat} onChange={(e) => setF({ ...f, lat: e.target.value })} />
          <input className={input} dir="ltr" placeholder="lng" value={f.lng} onChange={(e) => setF({ ...f, lng: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <input className={input} dir="ltr" type="time" value={f.opens_at} onChange={(e) => setF({ ...f, opens_at: e.target.value })} />
          <input className={input} dir="ltr" type="time" value={f.closes_at} onChange={(e) => setF({ ...f, closes_at: e.target.value })} />
        </div>
        <button
          onClick={() => setF({ ...f, is_open: !f.is_open })}
          className={cn(
            "h-11 rounded-xl px-3 text-sm font-semibold",
            f.is_open ? "bg-success/15 text-success" : "bg-destructive/12 text-destructive",
          )}
        >
          {f.is_open ? pick("الفرع مفتوح", "Branch open") : pick("الفرع مغلق", "Branch closed")}
        </button>
      </div>
      <div className="mt-5 flex gap-2 border-t border-border pt-4">
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

/* ----------------------------- contact ---------------------------- */

function ContactTab({
  restaurant,
  branches,
  onChanged,
}: {
  restaurant: Row;
  branches: Row[];
  onChanged: () => void;
}) {
  const { pick } = useI18n();
  const [f, setF] = useState({
    name_ar: (restaurant["name_ar"] as string) ?? "",
    name_en: (restaurant["name_en"] as string) ?? "",
    slug: (restaurant["slug"] as string) ?? "",
    currency: (restaurant["currency"] as string) ?? "QAR",
  });

  const save = useMutation({
    mutationFn: () =>
      saveRestaurant({
        data: {
          id: restaurant["id"] as string,
          slug: f.slug,
          name_en: f.name_en,
          name_ar: f.name_ar,
          currency: f.currency,
        },
      }),
    onSuccess: () => {
      toast.success(pick("تم الحفظ", "Saved"));
      onChanged();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-border p-5">
        <h2 className="font-display text-lg font-bold">{pick("بيانات المطعم", "Restaurant details")}</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <input className={input} placeholder={pick("الاسم (عربي)", "Name (Arabic)")} value={f.name_ar} onChange={(e) => setF({ ...f, name_ar: e.target.value })} />
          <input className={input} dir="ltr" placeholder="Name (English)" value={f.name_en} onChange={(e) => setF({ ...f, name_en: e.target.value })} />
          <input className={input} dir="ltr" placeholder="slug" value={f.slug} onChange={(e) => setF({ ...f, slug: e.target.value })} />
          <input className={input} dir="ltr" placeholder="QAR" value={f.currency} onChange={(e) => setF({ ...f, currency: e.target.value })} />
        </div>
        <button
          onClick={() => save.mutate()}
          disabled={save.isPending}
          className="mt-4 rounded-full bg-[image:var(--gradient-brass)] px-6 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-50"
        >
          {pick("حفظ", "Save")}
        </button>
      </div>

      <div className="rounded-3xl border border-border p-5">
        <h2 className="font-display text-lg font-bold">{pick("هواتف الفروع", "Branch phones")}</h2>
        <div className="mt-3 divide-y divide-border">
          {branches.map((b) => (
            <div key={b["id"] as string} className="flex items-center justify-between gap-3 py-2.5 text-sm">
              <span>{pick(b["name_ar"] as string, b["name_en"] as string)}</span>
              <span dir="ltr" className="text-muted-foreground">
                {(b["phone"] as string) || "—"}
              </span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          {pick("تُعدّل الأرقام من تبويب الفروع.", "Edit numbers in the Branches tab.")}
        </p>
      </div>
    </div>
  );
}
