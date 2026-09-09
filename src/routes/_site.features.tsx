import { createFileRoute, Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { FEATURES, ROLES } from "@/lib/marketing";
import { SectionTitle } from "@/components/marketing/SiteChrome";

export const Route = createFileRoute("/_site/features")({
  head: () => ({
    meta: [
      { title: "Platform features — ordering, kitchen screen, branch control | Origami" },
      {
        name: "description",
        content:
          "Every feature of the Origami ordering platform: customer app, live kitchen display, branch and menu control, discounts, staff privileges and reporting.",
      },
      { property: "og:title", content: "Platform features — Origami" },
      {
        property: "og:description",
        content: "Customer app, kitchen display, branch and menu control, discounts and reporting.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FeaturesPage,
});

function FeaturesPage() {
  const { pick, dir } = useI18n();

  return (
    <>
      <section className="mx-auto max-w-6xl px-5 py-14">
        <SectionTitle
          eyebrow={pick("المزايا", "Features")}
          title={pick("منصة واحدة تدير الطلب من السيارة حتى المطبخ", "One platform from the car to the kitchen")}
          subtitle={pick(
            "كل أداة مصممة لثلاثة أهداف: تجربة عميل ممتازة، سرعة في الطلب، ووضوح تشغيلي كامل.",
            "Every tool is built for three goals: a great customer experience, order speed and complete operational visibility.",
          )}
        />
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {FEATURES.map((f) => (
            <div key={f.en} className="surface rounded-3xl p-6">
              <div className="flex items-start gap-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/10">
                  <f.icon className="h-5 w-5 text-primary" aria-hidden />
                </span>
                <div>
                  <h3 className="font-display text-base font-bold">{pick(f.ar, f.en)}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">{pick(f.descAr, f.descEn)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-card/50 py-14">
        <div className="mx-auto max-w-6xl px-5">
          <SectionTitle
            eyebrow={pick("الصلاحيات", "Permissions")}
            title={pick("ماذا يستطيع كل دور أن يفعل", "What each role can do")}
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
                  {...(r.to === "/" ? { search: { branch: undefined } } : {})}
                  className="mt-6 rounded-full border border-primary px-5 py-2.5 text-center text-sm font-bold text-primary"
                >
                  {pick(r.linkLabelAr, r.linkLabelEn)}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5 py-14 text-center">
        <h2 className="font-display text-2xl font-bold">
          {pick("جاهز لتشغيل مطعمك على المنصة؟", "Ready to run your restaurant on the platform?")}
        </h2>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            to="/business/contact"
            className="rounded-full bg-[image:var(--gradient-brass)] px-6 py-3.5 font-display text-sm font-bold text-primary-foreground"
          >
            {pick("اطلب حسابك", "Request your account")}
          </Link>
          <Link to="/business/pricing" className="rounded-full border border-border px-6 py-3.5 text-sm font-semibold">
            {pick("عرض الأسعار", "View pricing")}
          </Link>
        </div>
      </section>
    </>
  );
}
