import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { productQuery, productsQuery } from "@/lib/menu-data";
import { useI18n, money } from "@/lib/i18n";
import { useCart, type CartOption } from "@/lib/cart";
import { foodImage } from "@/lib/food-images";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/product/$productId")({
  head: () => ({
    meta: [
      { title: "Product — MASAR Grill" },
      { name: "description", content: "Customise your item and add it to your drive-thru order." },
      { property: "og:title", content: "Product — MASAR Grill" },
      { property: "og:description", content: "Customise your item and add it to your order." },
    ],
  }),
  component: ProductPage,
});

function ProductPage() {
  const { productId } = Route.useParams();
  const { t, pick, lang, dir } = useI18n();
  const { add } = useCart();
  const navigate = useNavigate();
  const router = useRouter();

  const product = useQuery(productQuery(productId));
  const all = useQuery(productsQuery);
  const [quantity, setQuantity] = useState(1);
  const [chosen, setChosen] = useState<Record<string, string[]>>({});

  const Back = dir === "rtl" ? ChevronRight : ChevronLeft;

  const modifiers = useMemo(
    () =>
      [...(product.data?.product_modifiers ?? [])].sort(
        (a, b) => a.sort_order - b.sort_order,
      ),
    [product.data],
  );

  const selectedOptions: CartOption[] = useMemo(() => {
    const out: CartOption[] = [];
    for (const m of modifiers) {
      const ids = chosen[m.id] ?? m.modifier_options.filter((o) => o.is_default).map((o) => o.id);
      for (const id of ids) {
        const opt = m.modifier_options.find((o) => o.id === id);
        if (opt) out.push({ name_en: opt.name_en, name_ar: opt.name_ar, price_delta: Number(opt.price_delta) });
      }
    }
    return out;
  }, [modifiers, chosen]);

  if (product.isLoading) {
    return (
      <div className="mx-auto w-full max-w-2xl p-5">
        <Skeleton className="h-64 w-full rounded-3xl" />
        <Skeleton className="mt-4 h-8 w-2/3" />
        <Skeleton className="mt-2 h-4 w-full" />
      </div>
    );
  }

  if (!product.data) {
    return (
      <div className="mx-auto w-full max-w-2xl p-10 text-center">
        <p className="font-display text-xl">{t("somethingWrong")}</p>
      </div>
    );
  }

  const p = product.data;
  const unit = Number(p.price) + selectedOptions.reduce((s, o) => s + o.price_delta, 0);
  const name = pick(p.name_ar, p.name_en);

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

  // Smart combo: suggest fries + drink upgrade when ordering a single main.
  const fries = (all.data ?? []).find((x) => x.name_en === "Classic Fries");
  const cola = (all.data ?? []).find((x) => x.name_en === "Cola");
  const upsellPrice = fries && cola ? Number(fries.price) + Number(cola.price) : 0;
  const showCombo = !!fries && !!cola && Number(p.price) >= 22 && p.image_url !== "meal";

  const recommendations = (all.data ?? [])
    .filter((x) => x.id !== p.id && (x.image_url === "fries" || x.image_url === "drink"))
    .slice(0, 3);

  const addLine = (extra?: { withCombo?: boolean }) => {
    add({
      productId: p.id,
      nameEn: p.name_en,
      nameAr: p.name_ar,
      image: p.image_url,
      basePrice: Number(p.price),
      quantity,
      options: selectedOptions,
    });
    if (extra?.withCombo && fries && cola) {
      add({
        productId: fries.id,
        nameEn: fries.name_en,
        nameAr: fries.name_ar,
        image: fries.image_url,
        basePrice: Number(fries.price),
        quantity,
        options: [],
      });
      add({
        productId: cola.id,
        nameEn: cola.name_en,
        nameAr: cola.name_ar,
        image: cola.image_url,
        basePrice: Number(cola.price),
        quantity,
        options: [],
      });
    }
    toast.success(name);
    navigate({ to: "/menu" });
  };

  return (
    <div className="mx-auto w-full max-w-2xl bg-background pb-40">
      <div className="relative h-72 w-full overflow-hidden">
        <img
          src={foodImage(p.image_url)}
          alt={name}
          width={800}
          height={800}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-[linear-gradient(to_top,var(--background),transparent_55%)]" />
        <button
          onClick={() => router.history.back()}
          aria-label={t("back")}
          className="absolute top-5 grid h-10 w-10 place-items-center rounded-full border border-border bg-card/90 backdrop-blur ltr:left-5 rtl:right-5"
        >
          <Back className="h-5 w-5" aria-hidden />
        </button>
      </div>

      <div className="animate-rise -mt-8 px-5">
        <h1 className="font-display text-2xl font-bold">{name}</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {pick(p.description_ar, p.description_en)}
        </p>
        <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="font-display text-lg font-semibold text-primary">
            {money(Number(p.price), lang)}
          </span>
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
            <section key={m.id} className="mt-6">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-base font-semibold">
                  {pick(m.name_ar, m.name_en)}
                </h2>
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
                            : "border-border bg-card text-muted-foreground hover:text-foreground",
                        )}
                      >
                        <span className="flex items-center gap-2 font-medium">
                          <span
                            className={cn(
                              "grid h-4 w-4 place-items-center rounded-full border",
                              on ? "border-primary bg-primary" : "border-muted-foreground",
                            )}
                          >
                            {on && <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />}
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

        {showCombo && (
          <section className="surface mt-6 rounded-2xl border-primary/30 bg-primary/5 p-4">
            <p className="font-display text-base font-semibold">{t("makeItMeal")}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("mealUpsell")} {money(upsellPrice - 3, lang)} ·{" "}
              <span className="font-semibold text-success">
                {t("save")} {money(3, lang)}
              </span>
            </p>
            <button
              onClick={() => addLine({ withCombo: true })}
              className="mt-3 w-full rounded-full border border-primary px-4 py-2.5 text-sm font-semibold text-primary hover:bg-primary/10"
            >
              {t("add")} + {money(upsellPrice - 3, lang)}
            </button>
          </section>
        )}

        {recommendations.length ? (
          <section className="mt-6">
            <h2 className="font-display text-base font-semibold">{t("completeMeal")}</h2>
            <div className="hide-scrollbar -mx-5 mt-2 flex gap-3 overflow-x-auto px-5">
              {recommendations.map((r) => (
                <button
                  key={r.id}
                  onClick={() => {
                    add({
                      productId: r.id,
                      nameEn: r.name_en,
                      nameAr: r.name_ar,
                      image: r.image_url,
                      basePrice: Number(r.price),
                      quantity: 1,
                      options: [],
                    });
                    toast.success(pick(r.name_ar, r.name_en));
                  }}
                  className="surface w-32 shrink-0 rounded-2xl p-2 text-start"
                >
                  <img
                    src={foodImage(r.image_url)}
                    alt={pick(r.name_ar, r.name_en)}
                    loading="lazy"
                    width={800}
                    height={800}
                    className="h-20 w-full rounded-xl object-cover"
                  />
                  <p className="mt-2 truncate text-xs font-semibold">
                    {pick(r.name_ar, r.name_en)}
                  </p>
                  <p className="text-[11px] text-primary">{money(Number(r.price), lang)}</p>
                </button>
              ))}
            </div>
          </section>
        ) : null}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-2xl border-t border-border bg-card/95 p-4 backdrop-blur">
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
            onClick={() => addLine()}
            disabled={!p.is_available}
            className="flex flex-1 items-center justify-between rounded-full bg-[image:var(--gradient-brass)] px-5 py-3.5 font-semibold text-primary-foreground disabled:opacity-50"
          >
            <span>{t("addToCart")}</span>
            <span className="font-display">{money(unit * quantity, lang)}</span>
          </button>
        </div>
        <div className="h-[env(safe-area-inset-bottom)]" />
      </div>
    </div>
  );
}
