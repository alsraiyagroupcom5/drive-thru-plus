import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Minus, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { productQuery } from "@/lib/menu-data";
import { useI18n, money } from "@/lib/i18n";
import { useCart, type CartOption } from "@/lib/cart";
import { foodImage } from "@/lib/food-images";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { effectivePrice } from "@/lib/pricing";

/**
 * Luxury bottom-sheet popup: pick add-ons / modifiers, quantity, then add to cart.
 * Opened from the menu when a customer taps an item.
 */
export function ProductCustomizer({
  productId,
  onClose,
}: {
  productId: string | null;
  onClose: () => void;
}) {
  const { t, pick, lang } = useI18n();
  const { add } = useCart();
  const open = !!productId;

  const product = useQuery({
    ...productQuery(productId ?? ""),
    enabled: open,
  });

  const [quantity, setQuantity] = useState(1);
  const [chosen, setChosen] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (open) {
      setQuantity(1);
      setChosen({});
    }
  }, [productId, open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  const modifiers = useMemo(
    () => [...(product.data?.product_modifiers ?? [])].sort((a, b) => a.sort_order - b.sort_order),
    [product.data],
  );

  const selectedOptions: CartOption[] = useMemo(() => {
    const out: CartOption[] = [];
    for (const m of modifiers) {
      const ids = chosen[m.id] ?? m.modifier_options.filter((o) => o.is_default).map((o) => o.id);
      for (const id of ids) {
        const opt = m.modifier_options.find((o) => o.id === id);
        if (opt)
          out.push({
            name_en: opt.name_en,
            name_ar: opt.name_ar,
            price_delta: Number(opt.price_delta),
          });
      }
    }
    return out;
  }, [modifiers, chosen]);

  if (!open) return null;

  const p = product.data;
  const base = p ? effectivePrice(p.price, p.discount_percent) : 0;
  const discount = p ? Number(p.discount_percent ?? 0) : 0;
  const unit = base + selectedOptions.reduce((s, o) => s + o.price_delta, 0);
  const name = p ? pick(p.name_ar, p.name_en) : "";

  const toggle = (modifierId: string, optionId: string, kind: string, max: number) => {
    setChosen((prev) => {
      const current =
        prev[modifierId] ??
        modifiers
          .find((m) => m.id === modifierId)
          ?.modifier_options.filter((o) => o.is_default)
          .map((o) => o.id) ??
        [];
      if (kind === "single") return { ...prev, [modifierId]: [optionId] };
      const has = current.includes(optionId);
      const next = has
        ? current.filter((id) => id !== optionId)
        : [...current, optionId].slice(-max);
      return { ...prev, [modifierId]: next };
    });
  };

  const addLine = () => {
    if (!p) return;
    add({
      productId: p.id,
      nameEn: p.name_en,
      nameAr: p.name_ar,
      image: p.image_url,
      basePrice: base,
      quantity,
      options: selectedOptions,
    });
    toast.success(name);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <button
        aria-label={pick("إغلاق", "Close")}
        onClick={onClose}
        className="absolute inset-0 bg-foreground/45 backdrop-blur-sm"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={name || t("menu")}
        className="relative flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-card shadow-lift animate-rise sm:rounded-3xl"
      >
        {/* Image header */}
        <div className="relative h-44 w-full shrink-0 overflow-hidden bg-elevated">
          {p ? (
            <img
              src={foodImage(p.image_url)}
              alt={name}
              width={800}
              height={800}
              className="h-full w-full object-cover"
            />
          ) : (
            <Skeleton className="h-full w-full" />
          )}
          <div className="absolute inset-0 bg-[linear-gradient(to_top,var(--card),transparent_55%)]" />
          <button
            onClick={onClose}
            aria-label={pick("إغلاق", "Close")}
            className="absolute top-4 grid h-9 w-9 place-items-center rounded-full border border-border bg-card/90 backdrop-blur ltr:right-4 rtl:left-4"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        {/* Body */}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">
          {product.isLoading || !p ? (
            <div className="space-y-3 pt-1">
              <Skeleton className="h-7 w-2/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          ) : (
            <>
              <h2 className="font-display text-xl font-bold">{name}</h2>
              {pick(p.description_ar, p.description_en) ? (
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {pick(p.description_ar, p.description_en)}
                </p>
              ) : null}
              <div className="mt-2.5 flex flex-wrap items-center gap-2.5 text-xs text-muted-foreground">
                <span className="font-display text-lg font-semibold text-primary">
                  {money(base, lang)}
                </span>
                {discount > 0 && (
                  <>
                    <span className="line-through">{money(Number(p.price), lang)}</span>
                    <span className="rounded-full bg-success/15 px-2 py-0.5 font-bold text-success">
                      -{discount}%
                    </span>
                  </>
                )}
                {p.calories ? (
                  <span>
                    {p.calories} {t("calories")}
                  </span>
                ) : null}
              </div>

              {modifiers.map((m) => {
                const current =
                  chosen[m.id] ?? m.modifier_options.filter((o) => o.is_default).map((o) => o.id);
                return (
                  <section key={m.id} className="mt-5">
                    <div className="flex items-center justify-between">
                      <h3 className="font-display text-sm font-semibold">
                        {pick(m.name_ar, m.name_en)}
                      </h3>
                      <span className="text-[11px] font-semibold text-muted-foreground">
                        {m.is_required ? t("required") : t("optional")}
                      </span>
                    </div>
                    <div className="mt-2 space-y-2">
                      {[...m.modifier_options]
                        .sort((a, b) => a.sort_order - b.sort_order)
                        .map((o) => {
                          const on = current.includes(o.id);
                          return (
                            <button
                              key={o.id}
                              onClick={() => toggle(m.id, o.id, m.kind, m.max_select)}
                              aria-pressed={on}
                              className={cn(
                                "flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm transition-colors",
                                on
                                  ? "border-primary bg-primary/10 text-foreground"
                                  : "border-border bg-background text-muted-foreground hover:text-foreground",
                              )}
                            >
                              <span className="flex items-center gap-2 font-medium">
                                <span
                                  className={cn(
                                    "grid h-4 w-4 place-items-center rounded-full border",
                                    on ? "border-primary bg-primary" : "border-muted-foreground",
                                  )}
                                >
                                  {on && (
                                    <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />
                                  )}
                                </span>
                                {pick(o.name_ar, o.name_en)}
                              </span>
                              {Number(o.price_delta) > 0 && (
                                <span className="text-xs font-semibold text-primary">
                                  +{money(Number(o.price_delta), lang)}
                                </span>
                              )}
                            </button>
                          );
                        })}
                    </div>
                  </section>
                );
              })}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-border bg-card px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 rounded-full border border-border p-1">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                aria-label="minus"
                className="grid h-9 w-9 place-items-center rounded-full hover:bg-accent"
              >
                <Minus className="h-4 w-4" aria-hidden />
              </button>
              <span className="w-6 text-center font-display font-semibold">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => Math.min(20, q + 1))}
                aria-label="plus"
                className="grid h-9 w-9 place-items-center rounded-full hover:bg-accent"
              >
                <Plus className="h-4 w-4" aria-hidden />
              </button>
            </div>
            <button
              onClick={addLine}
              disabled={!p || !p.is_available}
              className="flex flex-1 items-center justify-between rounded-full bg-[image:var(--gradient-brass)] px-5 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-lift)] disabled:opacity-50"
            >
              <span>{t("addToCart")}</span>
              <span className="font-display">{money(unit * quantity, lang)}</span>
            </button>
          </div>
          <div className="h-[env(safe-area-inset-bottom)]" />
        </div>
      </div>
    </div>
  );
}
