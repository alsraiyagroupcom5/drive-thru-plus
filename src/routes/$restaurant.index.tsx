import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Phone, ArrowLeft, ArrowRight, Store } from "lucide-react";
import { restaurantBySlugQuery } from "@/lib/restaurant-link";
import { useI18n } from "@/lib/i18n";
import { LanguageToggle } from "@/components/customer/AppShell";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/$restaurant/")({
  loader: ({ params, context }) =>
    context.queryClient.ensureQueryData(restaurantBySlugQuery(params.restaurant)),
  head: ({ loaderData }) => {
    const r = loaderData?.restaurant;
    const name = r ? `${r.name_en} — ${r.name_ar}` : "Restaurant";
    return {
      meta: [
        { title: name },
        { name: "description", content: r ? `Order ahead from ${r.name_en} — choose your branch and skip the line.` : "Restaurant" },
        { property: "og:title", content: name },
        { property: "og:description", content: r ? `Order ahead from ${r.name_en} — choose your branch.` : "Restaurant" },
      ],
    };
  },
  component: RestaurantPage,
  notFoundComponent: RestaurantNotFound,
});

function RestaurantNotFound() {
  const { pick } = useI18n();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      <Store className="h-10 w-10 text-muted-foreground" />
      <h1 className="text-xl font-bold">{pick("المطعم غير موجود", "Restaurant not found")}</h1>
      <p className="text-sm text-muted-foreground">
        {pick("تأكد من الرابط أو تواصل مع المطعم.", "Check the link or contact the restaurant.")}
      </p>
      <Link to="/" className="rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground">
        {pick("الصفحة الرئيسية", "Home")}
      </Link>
    </div>
  );
}

function RestaurantPage() {
  const { restaurant: slug } = Route.useParams();
  const { pick, dir } = useI18n();
  const { data, isLoading } = useQuery(restaurantBySlugQuery(slug));
  const Arrow = dir === "rtl" ? ArrowLeft : ArrowRight;

  if (isLoading || !data) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 px-5 py-16">
        <Skeleton className="h-24 w-24 rounded-3xl" />
        <Skeleton className="h-8 w-56 rounded-full" />
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 rounded-3xl" />
          ))}
        </div>
      </div>
    );
  }

  const { restaurant, branches } = data;

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background" dir={dir}>
      <header className="mx-auto flex max-w-3xl items-center justify-between px-5 pt-6">
        <span className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
          {pick("اطلب مسبقاً · استلم بسرعة", "Order ahead · Skip the line")}
        </span>
        <LanguageToggle />
      </header>

      <main className="mx-auto max-w-3xl px-5 pb-16 pt-10">
        <div className="flex flex-col items-center text-center">
          {restaurant.logo_url ? (
            <img
              src={restaurant.logo_url}
              alt={pick(restaurant.name_ar, restaurant.name_en)}
              className="h-24 w-24 rounded-3xl border border-border bg-card object-cover shadow-xl shadow-primary/10"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-primary text-3xl font-black text-primary-foreground shadow-xl shadow-primary/20">
              {restaurant.name_en.charAt(0)}
            </div>
          )}
          <h1 className="mt-5 text-3xl font-black tracking-tight">{pick(restaurant.name_ar, restaurant.name_en)}</h1>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
            {pick(
              "اختر الفرع الأقرب إليك واطلب مسبقاً — سيكون طلبك جاهزاً عند وصولك.",
              "Choose your nearest branch and order ahead — your order will be ready when you arrive.",
            )}
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {branches.map((b) => (
            <Link
              key={b.id}
              to="/$restaurant/$branch"
              params={{ restaurant: slug, branch: b.code }}
              className="group relative overflow-hidden rounded-3xl border border-border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  {b.logo_url ? (
                    <img src={b.logo_url} alt="" className="h-12 w-12 rounded-2xl border border-border object-cover" />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Store className="h-5 w-5" />
                    </div>
                  )}
                  <div>
                    <h2 className="font-bold leading-tight">{pick(b.name_ar, b.name_en)}</h2>
                    {(b.city_en || b.city_ar) && (
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {pick(b.city_ar ?? "", b.city_en ?? "")}
                      </p>
                    )}
                  </div>
                </div>
                <span
                  className={
                    b.is_open
                      ? "rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-600"
                      : "rounded-full bg-muted px-2.5 py-1 text-[10px] font-bold text-muted-foreground"
                  }
                >
                  {b.is_open ? pick("مفتوح", "Open") : pick("مغلق", "Closed")}
                </span>
              </div>
              {(b.address_en || b.address_ar) && (
                <p className="mt-3 line-clamp-1 text-xs text-muted-foreground">{pick(b.address_ar ?? "", b.address_en ?? "")}</p>
              )}
              <div className="mt-4 flex items-center justify-between">
                {b.phone ? (
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground" dir="ltr">
                    <Phone className="h-3 w-3" />
                    {b.phone}
                  </span>
                ) : (
                  <span />
                )}
                <span className="flex items-center gap-1.5 text-sm font-bold text-primary transition group-hover:gap-2.5">
                  {pick("اطلب من هذا الفرع", "Order from this branch")}
                  <Arrow className="h-4 w-4" />
                </span>
              </div>
            </Link>
          ))}
        </div>

        {branches.length === 0 && (
          <p className="mt-10 text-center text-sm text-muted-foreground">
            {pick("لا توجد فروع متاحة حالياً.", "No branches available yet.")}
          </p>
        )}
      </main>
    </div>
  );
}
