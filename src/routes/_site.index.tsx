import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check, Clock } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { FEATURES, PLANS, ROLES, STEPS } from "@/lib/marketing";
import { SectionTitle } from "@/components/marketing/SiteChrome";
import { RequestForm } from "@/components/marketing/RequestForm";
import heroImage from "@/assets/business-hero.jpg";

export const Route = createFileRoute("/_site/")({
  head: () => ({
    meta: [
      { title: "Origami Platform — smart drive-thru ordering for restaurants" },
      {
        name: "description",
        content:
          "Branded ordering app, live kitchen screen, branch and menu control, discounts and reporting. Plans from QAR 349 per branch monthly in Qatar.",
      },
      { property: "og:title", content: "Origami Platform — smart drive-thru ordering" },
      {
        property: "og:description",
        content: "Branded ordering app, live kitchen display and branch analytics in one platform.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BusinessHome,
});

function BusinessHome() {
  const { pick, dir } = useI18n();

  return (
    <>
      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-8 px-5 py-12 md:grid-cols-2 md:py-20">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary">
            <Clock className="h-3.5 w-3.5" aria-hidden />
            {pick("جاهز للإطلاق خلال 48 ساعة", "Live in 48 hours")}
          </span>
          <h1 className="mt-4 font-display text-4xl font-bold leading-tight md:text-5xl">
            {pick(
              "منصة الطلب الذكية للمطاعم والدرايف ثرو",
              "The smart drive-thru ordering platform for restaurants",
            )}
          </h1>
          <p className="mt-4 max-w-xl text-base text-muted-foreground">
            {pick(
              "تطبيق طلب بعلامتك التجارية، شاشة مطبخ مباشرة، تحكم كامل بالفروع والمنيو والخصومات، وتقارير لحظية — كل ذلك بحساب واحد لمطعمك.",
              "A branded ordering app, a live kitchen screen, full control of branches, menu and discounts, and real-time reporting — all in one account for your restaurant.",
            )}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 rounded-full bg-[image:var(--gradient-brass)] px-6 py-3.5 font-display text-sm font-bold text-primary-foreground shadow-[var(--shadow-lift)]"
            >
              {pick("اطلب حساب مطعمك", "Request your account")}
              <ArrowRight className={cn("h-4 w-4", dir === "rtl" && "rotate-180")} aria-hidden />
            </Link>
            <Link
              to="/app"
              search={{ branch: undefined }}
              className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3.5 text-sm font-semibold"
            >
              {pick("جرّب التطبيق الحي", "See the live demo")}
            </Link>
          </div>
          <dl className="mt-8 grid max-w-md grid-cols-3 gap-4">
            {[
              { v: "9", ar: "دقائق متوسط التحضير", en: "min average prep" },
              { v: "3×", ar: "أسرع في الطابور", en: "faster queue" },
              { v: "24/7", ar: "لوحة تحكم مباشرة", en: "live dashboard" },
            ].map((s) => (
              <div key={s.en}>
                <dt className="font-display text-2xl font-bold text-primary">{s.v}</dt>
                <dd className="text-[11px] text-muted-foreground">{pick(s.ar, s.en)}</dd>
              </div>
            ))}
          </dl>
        </div>
        <img
          src={heroImage}
          alt={pick("سيارة تستلم طلبها من نافذة الدرايف ثرو", "A car collecting an order at a drive-thru window")}
          width={1600}
          height={1008}
          className="w-full rounded-3xl border border-border object-cover shadow-[var(--shadow-lift)]"
        />
      </section>

      {/* Features preview */}
      <section className="border-y border-border bg-card/50 py-14">
        <div className="mx-auto max-w-6xl px-5">
          <SectionTitle
            eyebrow={pick("المزايا", "Features")}
            title={pick("كل ما يحتاجه مطعمك في مكان واحد", "Everything your restaurant needs, in one place")}
          />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.slice(0, 8).map((f) => (
              <div key={f.en} className="surface rounded-2xl p-5">
                <f.icon className="h-5 w-5 text-primary" aria-hidden />
                <p className="mt-3 text-sm font-semibold">{pick(f.ar, f.en)}</p>
              </div>
            ))}
          </div>
          <Link
            to="/features"
            className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-primary underline underline-offset-4"
          >
            {pick("استعرض كل المزايا", "Explore all features")}
          </Link>
        </div>
      </section>

      {/* Roles */}
      <section className="mx-auto max-w-6xl px-5 py-14">
        <SectionTitle
          eyebrow={pick("الوصول", "Access")}
          title={pick("لوحة لكل دور في مطعمك", "A console for every role in your restaurant")}
          subtitle={pick(
            "المسؤول العام ينشئ المطاعم والحسابات، المالك يدير الفروع والمنيو، والفريق يشغّل الطلبات — والعميل يطلب من جواله.",
            "The admin creates restaurants and accounts, the owner runs branches and menu, the team works the orders — and the customer orders from their phone.",
          )}
        />
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {ROLES.map((r) => (
            <div key={r.titleEn} className="surface flex flex-col rounded-3xl p-6">
              <r.icon className="h-6 w-6 text-primary" aria-hidden />
              <h3 className="mt-3 font-display text-lg font-bold">{pick(r.titleAr, r.titleEn)}</h3>
              <ul className="mt-4 flex-1 space-y-2 text-sm text-muted-foreground">
                {(dir === "rtl" ? r.pointsAr : r.pointsEn).map((p) => (
                  <li key={p} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                    {p}
                  </li>
                ))}
              </ul>
              <Link
                to={r.to}
                {...(r.to === "/app" ? { search: { branch: undefined } } : {})}
                className="mt-6 rounded-full border border-primary px-5 py-2.5 text-center text-sm font-bold text-primary"
              >
                {pick(r.linkLabelAr, r.linkLabelEn)}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Steps */}
      <section className="border-y border-border bg-card/50 py-14">
        <div className="mx-auto max-w-6xl px-5">
          <SectionTitle title={pick("ثلاث خطوات للانطلاق", "Three steps to go live")} />
          <ol className="mt-8 grid gap-4 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <li key={s.en} className="surface rounded-2xl p-5">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-primary/10 font-display font-bold text-primary">
                  {i + 1}
                </span>
                <p className="mt-3 text-sm font-semibold">{pick(s.ar, s.en)}</p>
                <p className="mt-1 text-sm text-muted-foreground">{pick(s.descAr, s.descEn)}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Pricing teaser */}
      <section className="mx-auto max-w-6xl px-5 py-14">
        <SectionTitle
          eyebrow={pick("الأسعار", "Pricing")}
          title={pick("باقات واضحة بدون مفاجآت", "Clear plans, no surprises")}
          subtitle={pick(
            "الأسعار بالريال القطري، تشمل الاستضافة والدعم.",
            "Prices in Qatari Riyal, hosting and support included.",
          )}
        />
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {PLANS.map((p) => (
            <div
              key={p.id}
              className={cn("surface flex flex-col rounded-3xl p-6", p.highlight && "ring-2 ring-primary")}
            >
              <h3 className="font-display text-lg font-bold">{pick(p.ar, p.en)}</h3>
              <p className="mt-3 font-display text-3xl font-bold">
                {p.price}
                <span className="ms-1 text-sm font-semibold text-muted-foreground">
                  {p.price === "—" ? "" : pick("ر.ق", "QAR")}
                </span>
              </p>
              <p className="text-xs text-muted-foreground">{pick(p.perAr, p.perEn)}</p>
              <Link
                to="/pricing"
                className="mt-6 rounded-full border border-border py-2.5 text-center text-sm font-bold"
              >
                {pick("تفاصيل الباقة", "Plan details")}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Request */}
      <section className="border-t border-border bg-card/50 py-14">
        <div className="mx-auto max-w-3xl px-5">
          <div className="surface rounded-3xl p-6 md:p-8">
            <h2 className="font-display text-2xl font-bold">
              {pick("اطلب حساب مطعمك", "Request your restaurant account")}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {pick(
                "املأ البيانات وسيتواصل فريقنا لإنشاء حسابك وفروعك.",
                "Fill in your details and our team will set up your account and branches.",
              )}
            </p>
            <div className="mt-6">
              <RequestForm />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
