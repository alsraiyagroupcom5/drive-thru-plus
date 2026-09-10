import { useMutation } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  LayoutGrid,
  Plus,
  Sparkles,
  Tag,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { saveCategory, setProductLayout } from "@/lib/owner.functions";
import { Modal } from "@/components/console/Modal";

const input =
  "h-11 w-full rounded-xl border border-border bg-elevated px-3 text-sm outline-none ring-ring/40 focus:ring-2";

type Row = Record<string, unknown>;

/** Controls how the menu looks to customers: section order, visibility, item order and highlights. */
export function DesignTab({
  categories,
  products,
  onChanged,
  restaurantId,
}: {
  categories: Row[];
  products: Row[];
  onChanged: () => void;
  restaurantId?: string | null;
}) {
  const { pick, lang } = useI18n();
  const rid = restaurantId ?? null;
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Row | null>(null);

  const sortedCats = useMemo(
    () => [...categories].sort((a, b) => Number(a["sort_order"]) - Number(b["sort_order"])),
    [categories],
  );

  const cat = useMutation({
    mutationFn: (v: {
      id?: string | null;
      name_en: string;
      name_ar: string;
      sort_order?: number;
      is_active?: boolean;
    }) => saveCategory({ data: { ...v, restaurantId: rid } }),
    onSuccess: () => {
      toast.success(pick("تم الحفظ", "Saved"));
      setModalOpen(false);
      setEditingCategory(null);
      onChanged();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const layout = useMutation({
    mutationFn: (v: { productId: string; sortOrder?: number; isPopular?: boolean; isNew?: boolean }) =>
      setProductLayout({ data: { ...v, restaurantId: rid } }),
    onSuccess: onChanged,
    onError: (e: Error) => toast.error(e.message),
  });

  const selectedCategory = sortedCats.find((c) => c["id"] === selectedCategoryId) ?? null;
  const categoryProducts = useMemo(() => {
    if (!selectedCategoryId) return [];
    return [...products]
      .filter((p) => p["category_id"] === selectedCategoryId)
      .sort((a, b) => Number(a["sort_order"] ?? 0) - Number(b["sort_order"] ?? 0));
  }, [products, selectedCategoryId]);

  const openNew = () => {
    setEditingCategory(null);
    setModalOpen(true);
  };

  const openEdit = (c: Row) => {
    setEditingCategory(c);
    setModalOpen(true);
  };

  if (!selectedCategory) {
    return (
      <div className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-5">
          <div>
            <p className="text-xs font-bold uppercase text-primary">{pick("شكل المنيو", "Menu layout")}</p>
            <h2 className="mt-1 font-display text-2xl font-bold">{pick("الأقسام", "Sections")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {pick(
                "اختر قسماً لترتيب أصنافه وإبرازها للعميل.",
                "Choose a section to arrange and highlight its items for customers.",
              )}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-border bg-elevated px-4 py-3 text-end">
              <p className="text-[11px] text-muted-foreground">{pick("إجمالي الأقسام", "Total sections")}</p>
              <p className="font-display text-xl font-bold" dir="ltr">
                {sortedCats.length}
              </p>
            </div>
            <button
              onClick={openNew}
              className="inline-flex items-center gap-2 rounded-full bg-[image:var(--gradient-brass)] px-5 py-2.5 text-sm font-bold text-primary-foreground"
            >
              <Plus className="h-4 w-4" aria-hidden />
              {pick("قسم جديد", "New section")}
            </button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {sortedCats.map((c) => {
            const id = c["id"] as string;
            const active = Boolean(c["is_active"]);
            const items = products.filter((p) => p["category_id"] === id).length;
            return (
              <button
                key={id}
                onClick={() => setSelectedCategoryId(id)}
                className="group overflow-hidden rounded-2xl border border-border bg-card text-start shadow-sm transition duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lift"
              >
                <div className="flex items-start justify-between gap-3 border-b border-border bg-elevated p-5">
                  <div
                    className={cn(
                      "grid h-12 w-12 place-items-center rounded-2xl shadow-sm",
                      active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                    )}
                  >
                    <Tag className="h-5 w-5" aria-hidden />
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-3 py-1 text-[11px] font-bold",
                      active ? "bg-success/15 text-success" : "bg-destructive/12 text-destructive",
                    )}
                  >
                    {active ? pick("ظاهر", "Visible") : pick("مخفي", "Hidden")}
                  </span>
                </div>
                <div className="p-5">
                  <h3 className={cn("font-display text-lg font-bold", !active && "text-muted-foreground line-through")}>
                    {pick(c["name_ar"] as string, c["name_en"] as string)}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground" dir="ltr">
                    {pick("الترتيب", "Order")}: {Number(c["sort_order"] ?? 0)}
                  </p>
                  <div className="mt-5 grid grid-cols-2 gap-2">
                    <div className="rounded-xl bg-elevated p-3">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <LayoutGrid className="h-3.5 w-3.5" aria-hidden />
                        <span className="text-[10px]">{pick("الأصناف", "Items")}</span>
                      </div>
                      <p className="mt-1 font-display text-lg font-bold" dir="ltr">
                        {items}
                      </p>
                    </div>
                    <div className="rounded-xl bg-elevated p-3">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Sparkles className="h-3.5 w-3.5" aria-hidden />
                        <span className="text-[10px]">{pick("الأكثر طلباً", "Popular")}</span>
                      </div>
                      <p className="mt-1 font-display text-lg font-bold" dir="ltr">
                        {products.filter((p) => p["category_id"] === id && p["is_popular"]).length}
                      </p>
                    </div>
                  </div>
                  <div className="mt-5 flex items-center justify-between border-t border-border pt-4 text-xs font-bold text-primary">
                    <span>{pick("فتح تخطيط القسم", "Open section layout")}</span>
                    {lang === "ar" ? (
                      <ArrowLeft className="h-4 w-4 transition group-hover:-translate-x-1" aria-hidden />
                    ) : (
                      <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" aria-hidden />
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {!sortedCats.length ? (
          <div className="rounded-2xl border border-dashed border-border py-16 text-center">
            <Tag className="mx-auto h-7 w-7 text-muted-foreground" aria-hidden />
            <p className="mt-3 text-sm font-semibold">{pick("لا توجد أقسام", "No sections")}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {pick("أضف أول قسم لترتيب المنيو.", "Add your first section to organize the menu.")}
            </p>
          </div>
        ) : null}

        <CategoryModal
          open={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setEditingCategory(null);
          }}
          category={editingCategory}
          nextOrder={sortedCats.length + 1}
          onSave={(v) => cat.mutate(v)}
          isPending={cat.isPending}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <nav
        aria-label={pick("التنقل بين الأقسام", "Category navigation")}
        className="-mx-1 flex gap-2 overflow-x-auto border-b border-border px-1 pb-4"
      >
        {sortedCats.map((c) => {
          const id = c["id"] as string;
          const active = id === selectedCategoryId;
          const items = products.filter((p) => p["category_id"] === id).length;
          return (
            <button
              key={id}
              onClick={() => setSelectedCategoryId(id)}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex shrink-0 items-center gap-3 rounded-xl border px-4 py-2.5 text-start transition",
                active
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
              )}
            >
              <span
                className={cn(
                  "grid h-8 w-8 place-items-center rounded-lg",
                  active ? "bg-primary-foreground/15" : "bg-elevated",
                )}
              >
                <Tag className="h-4 w-4" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block max-w-40 truncate text-xs font-bold">
                  {pick(c["name_ar"] as string, c["name_en"] as string)}
                </span>
                <span className={cn("block text-[10px]", active ? "text-primary-foreground/75" : "text-muted-foreground")}>
                  <span dir="ltr">{items}</span> {pick("صنف", "items")}
                </span>
              </span>
            </button>
          );
        })}
      </nav>

      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
        <div className="flex min-w-0 items-center gap-3">
          <button
            onClick={() => setSelectedCategoryId(null)}
            aria-label={pick("العودة إلى الأقسام", "Back to sections")}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-border bg-card text-muted-foreground transition hover:border-primary/40 hover:text-primary"
          >
            {lang === "ar" ? (
              <ArrowRight className="h-4 w-4" aria-hidden />
            ) : (
              <ArrowLeft className="h-4 w-4" aria-hidden />
            )}
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="truncate font-display text-xl font-bold">
                {pick(selectedCategory["name_ar"] as string, selectedCategory["name_en"] as string)}
              </h2>
              <span
                className={cn(
                  "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold",
                  selectedCategory["is_active"]
                    ? "bg-success/15 text-success"
                    : "bg-destructive/12 text-destructive",
                )}
              >
                {selectedCategory["is_active"] ? pick("ظاهر", "Visible") : pick("مخفي", "Hidden")}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {pick("رتّب الأصناف داخل القسم وأبرز الأكثر طلباً والجديد.",
                "Arrange items inside this section and highlight popular and new ones.")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => openEdit(selectedCategory)}
            className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold"
          >
            {pick("تعديل القسم", "Edit section")}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {categoryProducts.map((p) => {
          const id = p["id"] as string;
          return (
            <div key={id} className="rounded-2xl border border-border p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold">{pick(p["name_ar"] as string, p["name_en"] as string)}</p>
                  <p className="text-xs text-muted-foreground" dir="ltr">
                    {pick("الترتيب", "Order")}: {Number(p["sort_order"] ?? 0)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    {pick("الترتيب", "Order")}
                    <input
                      type="number"
                      min={0}
                      defaultValue={Number(p["sort_order"] ?? 0)}
                      onBlur={(e) => layout.mutate({ productId: id, sortOrder: Number(e.target.value) })}
                      className="h-9 w-16 rounded-xl border border-border bg-elevated px-2 text-sm"
                    />
                  </label>
                  <button
                    onClick={() => layout.mutate({ productId: id, isPopular: !p["is_popular"] })}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold",
                      p["is_popular"]
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground",
                    )}
                  >
                    <Sparkles className="h-3 w-3" aria-hidden />
                    {pick("الأكثر طلباً", "Popular")}
                  </button>
                  <button
                    onClick={() => layout.mutate({ productId: id, isNew: !p["is_new"] })}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-semibold",
                      p["is_new"] ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground",
                    )}
                  >
                    {pick("جديد", "New")}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        {!categoryProducts.length ? (
          <div className="rounded-2xl border border-dashed border-border py-16 text-center">
            <LayoutGrid className="mx-auto h-7 w-7 text-muted-foreground" aria-hidden />
            <p className="mt-3 text-sm font-semibold">{pick("لا توجد أصناف في هذا القسم", "No items in this section")}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {pick("أضف أصنافاً من تبويب المنيو.", "Add items from the Menu tab.")}
            </p>
          </div>
        ) : null}
      </div>

      <CategoryModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingCategory(null);
        }}
        category={editingCategory}
        nextOrder={sortedCats.length + 1}
        onSave={(v) => cat.mutate(v)}
        isPending={cat.isPending}
      />
    </div>
  );
}

function CategoryModal({
  open,
  onClose,
  category,
  nextOrder,
  onSave,
  isPending,
}: {
  open: boolean;
  onClose: () => void;
  category: Row | null;
  nextOrder: number;
  onSave: (v: {
    id?: string | null;
    name_en: string;
    name_ar: string;
    sort_order?: number;
    is_active?: boolean;
  }) => void;
  isPending: boolean;
}) {
  const { pick } = useI18n();
  const [form, setForm] = useState({
    name_ar: "",
    name_en: "",
    sort_order: String(nextOrder),
    is_active: true,
  });

  // Reset form when modal opens/closes or category changes
  const [lastOpen, setLastOpen] = useState(open);
  const [lastId, setLastId] = useState<string | undefined>(category?.["id"] as string | undefined);
  if (open !== lastOpen || (category?.["id"] as string | undefined) !== lastId) {
    setLastOpen(open);
    setLastId(category?.["id"] as string | undefined);
    setForm({
      name_ar: (category?.["name_ar"] as string) ?? "",
      name_en: (category?.["name_en"] as string) ?? "",
      sort_order: String(category?.["sort_order"] ?? nextOrder),
      is_active: (category?.["is_active"] as boolean) ?? true,
    });
  }

  const submit = () => {
    onSave({
      id: (category?.["id"] as string) ?? null,
      name_ar: form.name_ar,
      name_en: form.name_en,
      sort_order: Number(form.sort_order),
      is_active: form.is_active,
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={category ? pick("تعديل القسم", "Edit section") : pick("قسم جديد", "New section")}
      subtitle={pick("اسم القسم وترتيبه وظهوره في المنيو.", "Section name, order and visibility in the menu.")}
    >
      <div className="space-y-4">
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
            dir="ltr"
            type="number"
            min={0}
            placeholder={pick("الترتيب", "Order")}
            value={form.sort_order}
            onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
          />
          <button
            onClick={() => setForm({ ...form, is_active: !form.is_active })}
            className={cn(
              "flex h-11 items-center justify-center gap-2 rounded-xl text-sm font-semibold",
              form.is_active ? "bg-success/15 text-success" : "bg-destructive/12 text-destructive",
            )}
          >
            {form.is_active ? <Eye className="h-4 w-4" aria-hidden /> : <EyeOff className="h-4 w-4" aria-hidden />}
            {form.is_active ? pick("ظاهر في المنيو", "Visible in menu") : pick("مخفي", "Hidden")}
          </button>
        </div>
        <div className="flex gap-2 border-t border-border pt-4">
          <button
            onClick={submit}
            disabled={isPending}
            className="rounded-full bg-[image:var(--gradient-brass)] px-6 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-50"
          >
            {pick("حفظ", "Save")}
          </button>
          <button onClick={onClose} className="rounded-full border border-border px-6 py-2.5 text-sm">
            {pick("إلغاء", "Cancel")}
          </button>
        </div>
      </div>
    </Modal>
  );
}
