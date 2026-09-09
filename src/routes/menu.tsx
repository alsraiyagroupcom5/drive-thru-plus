import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search, ShoppingBag } from "lucide-react";
import { AppShell, LanguageToggle } from "@/components/customer/AppShell";
import { ProductCard } from "@/components/customer/ProductCard";
import { categoriesQuery, productsQuery } from "@/lib/menu-data";
import { useI18n, money } from "@/lib/i18n";
import { useCart } from "@/lib/cart";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/menu")({
  head: () => ({
    meta: [
      { title: "Menu — Origami Qatar" },
      {
        name: "description",
        content: "Burgers, chicken, meals, sides, drinks and desserts. Order ahead and collect.",
      },
      { property: "og:title", content: "Menu — Origami Qatar" },
      { property: "og:description", content: "Browse the full Origami Qatar menu." },
    ],
  }),
  component: MenuPage,
});

function MenuPage() {
  const { t, pick, lang } = useI18n();
  const { count, subtotal } = useCart();
  const [active, setActive] = useState<string>("all");
  const [term, setTerm] = useState("");

  const categories = useQuery(categoriesQuery);
  const products = useQuery(productsQuery);

  const filtered = useMemo(() => {
    const list = products.data ?? [];
    const q = term.trim().toLowerCase();
    return list.filter((p) => {
      if (active !== "all" && p.category_id !== active) return false;
      if (!q) return true;
      const priceMatch = q.match(/(\d+)/);
      const wantsCheap = /under|أقل|اقل|تحت/.test(q) && priceMatch;
      if (wantsCheap && Number(p.price) > Number(priceMatch![1])) return false;
      if (/spicy|حار/.test(q) && !p.is_spicy) return false;
      const haystack =
        `${p.name_en} ${p.name_ar} ${p.description_en ?? ""} ${p.description_ar ?? ""}`.toLowerCase();
      if (wantsCheap || /spicy|حار/.test(q)) return true;
      return haystack.includes(q);
    });
  }, [products.data, active, term]);

  return (
    <AppShell
      header={
        <header className="sticky top-0 z-30 border-b border-border bg-background/95 px-5 pb-3 pt-5 backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <h1 className="font-display text-2xl font-bold">{t("menu")}</h1>
            <LanguageToggle />
          </div>
          <div className="relative mt-3">
            <Search
              className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground ltr:left-3 rtl:right-3"
              aria-hidden
            />
            <input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder={t("searchPlaceholder")}
              aria-label={t("search")}
              className="h-11 w-full rounded-full border border-border bg-card text-sm outline-none ring-ring/40 transition focus:ring-2 ltr:pl-9 ltr:pr-4 rtl:pr-9 rtl:pl-4"
            />
          </div>
          <div className="hide-scrollbar -mx-5 mt-3 flex gap-2 overflow-x-auto px-5">
            <Chip active={active === "all"} onClick={() => setActive("all")} label={t("all")} />
            {(categories.data ?? []).map((c) => (
              <Chip
                key={c.id}
                active={active === c.id}
                onClick={() => setActive(c.id)}
                label={pick(c.name_ar, c.name_en)}
              />
            ))}
          </div>
        </header>
      }
    >
      <div className="space-y-3 px-5 pt-4">
        {products.isLoading
          ? [0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28 w-full rounded-2xl" />)
          : filtered.length
            ? filtered.map((p) => <ProductCard key={p.id} product={p} />)
            : (
                <div className="py-20 text-center">
                  <p className="font-display text-lg font-semibold">{t("noResults")}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{t("searchPlaceholder")}</p>
                </div>
              )}
      </div>

      {count > 0 && (
        <div className="fixed inset-x-0 bottom-[76px] z-40 mx-auto w-full max-w-2xl px-5">
          <Link
            to="/cart"
            className="flex items-center justify-between rounded-full bg-[image:var(--gradient-brass)] px-5 py-3.5 font-semibold text-primary-foreground shadow-[var(--shadow-lift)]"
          >
            <span className="inline-flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" aria-hidden />
              {count} · {t("cart")}
            </span>
            <span className="font-display">{money(subtotal, lang)}</span>
          </Link>
        </div>
      )}
    </AppShell>
  );
}

function Chip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "shrink-0 rounded-full border px-4 py-2 text-xs font-semibold transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
}
