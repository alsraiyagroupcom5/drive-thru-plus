import { useMutation } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Eye, EyeOff, Plus, Sparkles } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { saveCategory, setProductLayout } from "@/lib/owner.functions";

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
  const { pick } = useI18n();
  const rid = restaurantId ?? null;
  const [adding, setAdding] = useState(false);
  const [newCat, setNewCat] = useState({ name_ar: "", name_en: "" });

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

  return (
    <div className="space-y-6">
      <section className="surface rounded-3xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-bold">{pick("أقسام المنيو", "Menu sections")}</h2>
            <p className="text-xs text-muted-foreground">
              {pick(
                "رتّب الأقسام كما تظهر للعميل، وأخفِ ما لا تريد عرضه.",
                "Order the sections as customers see them, and hide what you don't serve.",
              )}
            </p>
          </div>
          <button
            onClick={() => setAdding((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-xs font-semibold"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden />
            {pick("قسم جديد", "New section")}
          </button>
        </div>

        {adding ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <input
              className={input}
              placeholder={pick("الاسم (عربي)", "Name (Arabic)")}
              value={newCat.name_ar}
              onChange={(e) => setNewCat({ ...newCat, name_ar: e.target.value })}
            />
            <input
              className={input}
              dir="ltr"
              placeholder="Name (English)"
              value={newCat.name_en}
              onChange={(e) => setNewCat({ ...newCat, name_en: e.target.value })}
            />
            <button
              onClick={() => {
                cat.mutate(
                  { ...newCat, sort_order: sortedCats.length + 1, is_active: true },
                  { onSuccess: () => setNewCat({ name_ar: "", name_en: "" }) },
                );
              }}
              className="rounded-xl bg-[image:var(--gradient-brass)] px-5 text-sm font-bold text-primary-foreground"
            >
              {pick("إضافة", "Add")}
            </button>
          </div>
        ) : null}

        <div className="mt-4 space-y-2">
          {sortedCats.map((c) => {
            const id = c["id"] as string;
            const active = Boolean(c["is_active"]);
            return (
              <div
                key={id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border px-4 py-3"
              >
                <p className={cn("font-semibold", !active && "text-muted-foreground line-through")}>
                  {pick(c["name_ar"] as string, c["name_en"] as string)}
                </p>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    {pick("الترتيب", "Order")}
                    <input
                      type="number"
                      min={0}
                      defaultValue={Number(c["sort_order"])}
                      onBlur={(e) =>
                        cat.mutate({
                          id,
                          name_ar: c["name_ar"] as string,
                          name_en: c["name_en"] as string,
                          sort_order: Number(e.target.value),
                          is_active: active,
                        })
                      }
                      className="h-9 w-16 rounded-lg border border-border bg-elevated px-2 text-sm"
                    />
                  </label>
                  <button
                    onClick={() =>
                      cat.mutate({
                        id,
                        name_ar: c["name_ar"] as string,
                        name_en: c["name_en"] as string,
                        sort_order: Number(c["sort_order"]),
                        is_active: !active,
                      })
                    }
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold",
                      active ? "border-success/40 text-success" : "border-border text-muted-foreground",
                    )}
                  >
                    {active ? <Eye className="h-3 w-3" aria-hidden /> : <EyeOff className="h-3 w-3" aria-hidden />}
                    {active ? pick("ظاهر", "Visible") : pick("مخفي", "Hidden")}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="surface rounded-3xl p-5">
        <h2 className="font-display text-lg font-bold">{pick("ترتيب وإبراز الأصناف", "Item order & highlights")}</h2>
        <p className="text-xs text-muted-foreground">
          {pick(
            "حدد ترتيب ظهور الصنف داخل قسمه، وأبرزه كـ«الأكثر طلباً» أو «جديد».",
            "Set where an item appears in its section, and highlight it as popular or new.",
          )}
        </p>

        <div className="mt-4 space-y-2">
          {[...products]
            .sort((a, b) => Number(a["sort_order"]) - Number(b["sort_order"]))
            .map((p) => {
              const id = p["id"] as string;
              return (
                <div
                  key={id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border px-4 py-3"
                >
                  <p className="font-semibold">{pick(p["name_ar"] as string, p["name_en"] as string)}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      {pick("الترتيب", "Order")}
                      <input
                        type="number"
                        min={0}
                        defaultValue={Number(p["sort_order"] ?? 0)}
                        onBlur={(e) => layout.mutate({ productId: id, sortOrder: Number(e.target.value) })}
                        className="h-9 w-16 rounded-lg border border-border bg-elevated px-2 text-sm"
                      />
                    </label>
                    <button
                      onClick={() => layout.mutate({ productId: id, isPopular: !p["is_popular"] })}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold",
                        p["is_popular"] ? "border-primary bg-primary/10 text-primary" : "border-border",
                      )}
                    >
                      <Sparkles className="h-3 w-3" aria-hidden />
                      {pick("الأكثر طلباً", "Popular")}
                    </button>
                    <button
                      onClick={() => layout.mutate({ productId: id, isNew: !p["is_new"] })}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-xs font-semibold",
                        p["is_new"] ? "border-primary bg-primary/10 text-primary" : "border-border",
                      )}
                    >
                      {pick("جديد", "New")}
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      </section>
    </div>
  );
}
