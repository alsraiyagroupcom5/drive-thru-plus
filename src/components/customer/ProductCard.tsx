import { Link } from "@tanstack/react-router";
import { Flame, Sparkles, Star } from "lucide-react";
import { useI18n, money } from "@/lib/i18n";
import { foodImage } from "@/lib/food-images";
import type { Product } from "@/lib/menu-data";
import { cn } from "@/lib/utils";
import { effectivePrice } from "@/lib/pricing";

export function ProductCard({
  product,
  soldOutToday = false,
}: {
  product: Product;
  soldOutToday?: boolean;
}) {
  const { pick, lang, t } = useI18n();
  const name = pick(product.name_ar, product.name_en);
  const discount = Number(product.discount_percent ?? 0);
  const price = effectivePrice(product.price, discount);
  const available = product.is_available && !soldOutToday;

  return (
    <Link
      to="/product/$productId"
      params={{ productId: product.id }}
      disabled={!available}
      className={cn(
        "group surface flex gap-3 overflow-hidden rounded-2xl p-3 transition-transform duration-300",
        available ? "hover:-translate-y-0.5" : "opacity-55",
      )}
    >
      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-elevated">
        <img
          src={foodImage(product.image_url)}
          alt={name}
          loading="lazy"
          width={800}
          height={800}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <h3 className="truncate text-[15px] font-semibold leading-tight">{name}</h3>
          {product.is_popular && <Badge icon={Star} label={t("popular")} tone="primary" />}
          {product.is_new && <Badge icon={Sparkles} label={t("new")} tone="accent" />}
          {product.is_spicy && <Badge icon={Flame} label={t("spicy")} tone="destructive" />}
        </div>
        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
          {pick(product.description_ar, product.description_en)}
        </p>
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="flex items-baseline gap-1.5">
            <span className="font-display text-base font-semibold text-primary">
              {money(price, lang)}
            </span>
            {discount > 0 && (
              <>
                <span className="text-[11px] text-muted-foreground line-through">
                  {money(Number(product.price), lang)}
                </span>
                <span className="rounded-full bg-success/15 px-1.5 py-0.5 text-[10px] font-bold text-success">
                  -{discount}%
                </span>
              </>
            )}
          </span>
          {product.calories ? (
            <span className="text-[11px] text-muted-foreground">
              {product.calories} {t("calories")}
            </span>
          ) : null}
        </div>
        {!available && (
          <span className="mt-1 inline-block text-[11px] font-semibold text-destructive">
            {t("unavailable")}
          </span>
        )}
      </div>
    </Link>
  );
}

function Badge({
  icon: Icon,
  label,
  tone,
}: {
  icon: typeof Star;
  label: string;
  tone: "primary" | "accent" | "destructive";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold",
        tone === "primary" && "bg-primary/15 text-primary",
        tone === "accent" && "bg-success/15 text-success",
        tone === "destructive" && "bg-destructive/15 text-destructive",
      )}
    >
      <Icon className="h-2.5 w-2.5" aria-hidden />
      {label}
    </span>
  );
}
