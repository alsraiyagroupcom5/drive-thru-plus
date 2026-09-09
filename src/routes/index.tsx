import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Clock, MapPin, Repeat, Gift } from "lucide-react";
import { AppShell, BrandMark, LanguageToggle } from "@/components/customer/AppShell";
import { ProductCard } from "@/components/customer/ProductCard";
import { branchesQuery, productsQuery } from "@/lib/menu-data";
import { useI18n, money } from "@/lib/i18n";
import { useCart } from "@/lib/cart";
import { useCustomerAuth } from "@/lib/customer-auth";
import { getMe } from "@/lib/customer.functions";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>) => ({
    branch: typeof search["branch"] === "string" ? (search["branch"] as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Origami Qatar — Specialty Coffee, Ice Cream & Desserts" },
      {
        name: "description",
        content:
          "Order specialty coffee, gelato and desserts ahead and collect in minutes at Duhail Night Market, Aspire Downtown or Lusail Marina. Open daily 7AM–12AM.",
      },
      { property: "og:title", content: "Origami Qatar — Specialty Coffee & Ice Cream" },
      {
        property: "og:description",
        content: "Order ahead and collect in minutes across three Doha locations.",
      },
    ],
  }),

  component: Landing,
});

function greetingKey() {
  const h = new Date().getHours();
  if (h < 12) return "goodMorning" as const;
  if (h < 17) return "goodAfternoon" as const;
  return "goodEvening" as const;
}

function Landing() {
  const { branch: branchCode } = Route.useSearch();
  const { t, pick, lang, dir } = useI18n();
  const { branchId, setBranchId } = useCart();
  const { session, ready } = useCustomerAuth();
  const navigate = useNavigate();

  const branches = useQuery(branchesQuery);
  const products = useQuery(productsQuery);

  const me = useQuery({
    queryKey: ["me", session?.token],
    queryFn: () => getMe({ data: { token: session!.token } }),
    enabled: !!session?.token,
  });

  // QR deep link: /?branch=lusail selects the branch automatically.
  useEffect(() => {
    if (!branchCode || !branches.data) return;
    const match = branches.data.find((b) => b.code === branchCode);
    if (match) setBranchId(match.id);
  }, [branchCode, branches.data, setBranchId]);

  const selected = branches.data?.find((b) => b.id === branchId) ?? null;
  const Arrow = dir === "rtl" ? ArrowLeft : ArrowRight;

  const featured = (products.data ?? []).filter((p) => p.is_popular).slice(0, 4);
  const fresh = (products.data ?? []).filter((p) => p.is_new).slice(0, 3);

  return (
    <AppShell
      header={
        <header className="flex items-center justify-between gap-3 px-5 pb-2 pt-6">
          <BrandMark />
          <LanguageToggle />
        </header>
      }
    >
      <section className="animate-rise px-5 pt-4">
        <p className="text-sm text-muted-foreground">{t(greetingKey())}</p>
        <h1 className="mt-1 font-display text-3xl font-bold leading-tight">
          {ready && me.data?.fullName
            ? me.data.fullName
            : ready && session
              ? t("welcomeBack")
              : t("brandFull")}
        </h1>
        {me.data ? (
          <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
            <Gift className="h-3.5 w-3.5" aria-hidden />
            {me.data.loyaltyPoints} {t("points")}
          </div>
        ) : null}
      </section>

      {/* Branch */}
      <section className="mt-5 px-5">
        {branches.isLoading ? (
          <Skeleton className="h-28 w-full rounded-2xl" />
        ) : selected ? (
          <div className="surface flex items-center justify-between gap-3 rounded-2xl p-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 text-primary" aria-hidden />
                {t("branch")}
              </div>
              <p className="mt-1 truncate font-display text-lg font-semibold">
                {pick(selected.name_ar, selected.name_en)}
              </p>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" aria-hidden />
                {t("prepTime")}: {selected.avg_prep_minutes}–{selected.avg_prep_minutes + 4}{" "}
                {t("minutes")}
              </p>
            </div>
            <button
              onClick={() => setBranchId("")}
              className="shrink-0 rounded-full border border-border px-3 py-1.5 text-xs font-semibold hover:bg-accent"
            >
              {t("change")}
            </button>
          </div>
        ) : (
          <div>
            <h2 className="mb-3 font-display text-lg font-semibold">{t("nearbyBranches")}</h2>
            <ul className="space-y-3">
              {(branches.data ?? []).map((b) => (
                <li key={b.id}>
                  <button
                    onClick={() => {
                      setBranchId(b.id);
                      navigate({ to: "/menu" });
                    }}
                    className="surface w-full rounded-2xl p-4 text-start transition-transform hover:-translate-y-0.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-display text-base font-semibold">
                          {pick(b.name_ar, b.name_en)}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {pick(b.city_ar, b.city_en)}
                        </p>
                        {b.phone ? (
                          <span
                            dir="ltr"
                            className="mt-1 inline-block text-xs font-semibold text-primary"
                          >
                            {b.phone}
                          </span>
                        ) : null}
                      </div>


                      <span
                        className={cn(
                          "rounded-full px-2 py-1 text-[11px] font-bold",
                          b.is_open
                            ? "bg-success/15 text-success"
                            : "bg-destructive/15 text-destructive",
                        )}
                      >
                        {b.is_open ? t("open") : t("closed")}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {t("prepTime")}: {b.avg_prep_minutes}–{b.avg_prep_minutes + 4}{" "}
                        {t("minutes")}
                      </span>
                      <span className="font-semibold text-primary">
                        {b.busy_level >= 3
                          ? t("busyHigh")
                          : b.busy_level === 2
                            ? t("busyMedium")
                            : t("busyLow")}
                      </span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* Your usual */}
      {me.data?.lastOrder ? (
        <section className="mt-6 px-5">
          <div className="surface rounded-2xl bg-[image:linear-gradient(140deg,color-mix(in_oklab,var(--primary)_14%,transparent),transparent)] p-4">
            <p className="text-xs font-semibold text-primary">{t("yourUsual")}</p>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {me.data.lastOrder.order_items
                .map((i) => pick(i.name_ar, i.name_en))
                .slice(0, 3)
                .join(" • ")}
            </p>
            <div className="mt-3 flex items-center justify-between">
              <span className="font-display text-lg font-semibold">
                {money(Number(me.data.lastOrder.total), lang)}
              </span>
              <Link
                to="/orders"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
              >
                <Repeat className="h-4 w-4" aria-hidden />
                {t("orderAgain")}
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      {/* CTA */}
      <section className="mt-6 px-5">
        <Link
          to="/menu"
          className="flex items-center justify-between rounded-2xl bg-[image:var(--gradient-brass)] px-5 py-4 font-display text-lg font-bold text-primary-foreground shadow-[var(--shadow-lift)]"
        >
          {t("viewMenu")}
          <Arrow className="h-5 w-5" aria-hidden />
        </Link>
      </section>

      {/* Popular */}
      <section className="mt-8 px-5">
        <h2 className="mb-3 font-display text-lg font-semibold">{t("popular")}</h2>
        <div className="space-y-3">
          {products.isLoading
            ? [0, 1, 2].map((i) => <Skeleton key={i} className="h-28 w-full rounded-2xl" />)
            : featured.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      {fresh.length ? (
        <section className="mt-8 px-5">
          <h2 className="mb-3 font-display text-lg font-semibold">{t("new")}</h2>
          <div className="space-y-3">
            {fresh.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      ) : null}

      <p className="mt-10 px-5 text-center text-[11px] text-muted-foreground">
        <Link to="/auth" className="underline underline-offset-4">
          {t("staffLogin")}
        </Link>
      </p>
    </AppShell>
  );
}
