import { createFileRoute, Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { PLANS } from "@/lib/marketing";
import { SectionTitle } from "@/components/marketing/SiteChrome";
import { RequestForm } from "@/components/marketing/RequestForm";

const OG_IMAGE =
  "https://drive-thru-plus.lovable.app/__l5e/assets-v1/0cec0fac-0bcd-4383-8e30-8462ae4a84b5/qr-spring-og.jpg";

export const Route = createFileRoute("/_site/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — from QAR 349 per branch monthly | QR-Spring" },
      {
        name: "description",
        content:
          "Simple per-branch pricing for restaurant ordering with QR-Spring: Starter QAR 349, Growth QAR 649, Enterprise custom. Hosting, updates and support included.",
      },
      { property: "og:title", content: "Pricing — QR-Spring" },
      {
        property: "og:description",
        content: "Starter QAR 349, Growth QAR 649 per branch monthly, Enterprise custom pricing.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://drive-thru-plus.lovable.app/pricing" },
      { property: "og:image", content: OG_IMAGE },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: OG_IMAGE },
    ],
    links: [{ rel: "canonical", href: "https://drive-thru-plus.lovable.app/pricing" }],
  }),
  component: PricingPage,
});

const FAQ = [
  {
    qAr: "هل هناك رسوم إعداد؟",
    qEn: "Is there a setup fee?",
    aAr: "لا. الإعداد وإنشاء الحسابات ورفع المنيو الأول مشمولة.",
    aEn: "No. Setup, account creation and your first menu upload are included.",
  },
  {
    qAr: "هل أستطيع إضافة فروع لاحقاً؟",
    qEn: "Can I add branches later?",
    aAr: "نعم، تُضاف الفروع في أي وقت وتُحتسب شهرياً لكل فرع.",
    aEn: "Yes, branches can be added anytime and are billed monthly per branch.",
  },
  {
    qAr: "هل يدعم النظام العربية؟",
    qEn: "Does the system support Arabic?",
    aAr: "كل الشاشات ثنائية اللغة عربي/إنجليزي مع وضع فاتح وداكن.",
    aEn: "Every screen is bilingual Arabic/English with light and dark modes.",
  },
  {
    qAr: "هل يمكن الربط مع نقاط البيع؟",
    qEn: "Can it integrate with our POS?",
    aAr: "متاح ضمن باقة المؤسسات حسب مزود نقاط البيع لديك.",
    aEn: "Available on the Enterprise plan, depending on your POS provider.",
  },
];

function PricingPage() {
  const { pick, dir } = useI18n();

  return (
    <>
      <section className="mx-auto max-w-6xl px-5 py-14">
        <SectionTitle
          eyebrow={pick("الأسعار", "Pricing")}
          title={pick("ادفع لكل فرع، بدون عقود معقدة", "Pay per branch, no complicated contracts")}
          subtitle={pick(
            "الأسعار بالريال القطري شهرياً وتشمل الاستضافة والتحديثات والدعم.",
            "Prices are monthly in Qatari Riyal and include hosting, updates and support.",
          )}
        />
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {PLANS.map((p) => (
            <div
              key={p.id}
              className={cn(
                "surface flex flex-col rounded-3xl p-6",
                p.highlight && "ring-2 ring-primary shadow-[var(--shadow-lift)]",
              )}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg font-bold">{pick(p.ar, p.en)}</h3>
                {p.highlight ? (
                  <span className="rounded-full bg-primary/15 px-2.5 py-1 text-[10px] font-bold text-primary">
                    {pick("الأكثر اختياراً", "Most popular")}
                  </span>
                ) : null}
              </div>
              <p className="mt-3 font-display text-4xl font-bold">
                {p.price}
                <span className="ms-1 text-sm font-semibold text-muted-foreground">
                  {p.price === "—" ? "" : pick("ر.ق", "QAR")}
                </span>
              </p>
              <p className="text-xs text-muted-foreground">{pick(p.perAr, p.perEn)}</p>
              <ul className="mt-5 flex-1 space-y-2 text-sm">
                {(dir === "rtl" ? p.featuresAr : p.featuresEn).map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                to="/contact"
                className={cn(
                  "mt-6 rounded-full py-3 text-center text-sm font-bold",
                  p.highlight
                    ? "bg-[image:var(--gradient-brass)] text-primary-foreground"
                    : "border border-border",
                )}
              >
                {pick("اختر هذه الباقة", "Choose this plan")}
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-card/50 py-14">
        <div className="mx-auto max-w-4xl px-5">
          <SectionTitle title={pick("أسئلة شائعة", "Frequently asked")} />
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {FAQ.map((f) => (
              <div key={f.qEn} className="surface rounded-2xl p-5">
                <p className="font-display text-sm font-bold">{pick(f.qAr, f.qEn)}</p>
                <p className="mt-2 text-sm text-muted-foreground">{pick(f.aAr, f.aEn)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5 py-14">
        <div className="surface rounded-3xl p-6 md:p-8">
          <h2 className="font-display text-2xl font-bold">{pick("ابدأ الآن", "Get started")}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {pick(
              "اختر الباقة وأرسل بياناتك، ونتولى الباقي.",
              "Pick a plan, send your details, and we handle the rest.",
            )}
          </p>
          <div className="mt-6">
            <RequestForm />
          </div>
        </div>
      </section>
    </>
  );
}
