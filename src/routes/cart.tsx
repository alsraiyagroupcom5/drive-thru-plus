import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { AppShell } from "@/components/customer/AppShell";
import { useCart, lineUnitPrice } from "@/lib/cart";
import { useI18n, money } from "@/lib/i18n";
import { foodImage } from "@/lib/food-images";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your cart — QR-Spring" },
      { name: "description", content: "Review your drive-thru order before checkout." },
      { property: "og:title", content: "Your cart — QR-Spring" },
      { property: "og:description", content: "Review your drive-thru order before checkout." },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { t, pick, lang } = useI18n();
  const { lines, setQuantity, remove, subtotal } = useCart();

  return (
    <AppShell
      header={
        <header className="border-b border-border px-5 pb-3 pt-6">
          <h1 className="font-display text-2xl font-bold">{t("cart")}</h1>
        </header>
      }
    >
      {lines.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-5 py-24 text-center">
          <span className="grid h-16 w-16 place-items-center rounded-2xl bg-elevated">
            <ShoppingBag className="h-7 w-7 text-muted-foreground" aria-hidden />
          </span>
          <p className="mt-4 font-display text-lg font-semibold">{t("emptyCart")}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t("emptyCartHint")}</p>
          <Link
            to="/menu"
            className="mt-6 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
          >
            {t("viewMenu")}
          </Link>
        </div>
      ) : (
        <>
          <ul className="space-y-3 px-5 pt-4">
            {lines.map((line) => (
              <li key={line.key} className="surface flex gap-3 rounded-2xl p-3">
                <img
                  src={foodImage(line.image)}
                  alt={pick(line.nameAr, line.nameEn)}
                  loading="lazy"
                  width={800}
                  height={800}
                  className="h-20 w-20 shrink-0 rounded-xl object-cover"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate text-sm font-semibold">
                      {pick(line.nameAr, line.nameEn)}
                    </p>
                    <button
                      onClick={() => remove(line.key)}
                      aria-label="remove"
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                  {line.options.length ? (
                    <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                      {line.options.map((o) => pick(o.name_ar, o.name_en)).join(" • ")}
                    </p>
                  ) : null}
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-1 rounded-full border border-border p-0.5">
                      <button
                        onClick={() => setQuantity(line.key, line.quantity - 1)}
                        aria-label="minus"
                        className="grid h-7 w-7 place-items-center rounded-full hover:bg-accent"
                      >
                        <Minus className="h-3.5 w-3.5" aria-hidden />
                      </button>
                      <span className="w-5 text-center text-sm font-semibold">{line.quantity}</span>
                      <button
                        onClick={() => setQuantity(line.key, line.quantity + 1)}
                        aria-label="plus"
                        className="grid h-7 w-7 place-items-center rounded-full hover:bg-accent"
                      >
                        <Plus className="h-3.5 w-3.5" aria-hidden />
                      </button>
                    </div>
                    <span className="font-display text-sm font-semibold text-primary">
                      {money(lineUnitPrice(line) * line.quantity, lang)}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="surface mx-5 mt-5 space-y-2 rounded-2xl p-4 text-sm">
            <Row label={t("subtotal")} value={money(subtotal, lang)} />
            <Row label={t("tax")} value={money(0, lang)} />
            <div className="border-t border-border pt-2">
              <Row
                label={t("total")}
                value={money(subtotal, lang)}
                strong
              />
            </div>
          </div>

          <div className="fixed inset-x-0 bottom-[76px] z-40 mx-auto w-full max-w-2xl px-5">
            <Link
              to="/checkout"
              className="flex items-center justify-between rounded-full bg-[image:var(--gradient-brass)] px-5 py-3.5 font-semibold text-primary-foreground shadow-[var(--shadow-lift)]"
            >
              {t("checkout")}
              <span className="font-display">{money(subtotal, lang)}</span>
            </Link>
          </div>
        </>
      )}
    </AppShell>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={strong ? "font-display font-semibold" : "text-muted-foreground"}>
        {label}
      </span>
      <span className={strong ? "font-display text-lg font-bold text-primary" : "font-medium"}>
        {value}
      </span>
    </div>
  );
}
