import { createFileRoute } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { DEFAULT_SITE_CONTENT, siteContentQuery, useSite } from "@/lib/site-content";
import { SiteLink } from "@/components/marketing/SiteChrome";
import { RequestForm } from "@/components/marketing/RequestForm";

export const Route = createFileRoute("/_site/pricing")({
  loader: ({ context }) => context.queryClient.ensureQueryData(siteContentQuery),
  head: ({ loaderData }) => {
    const seo = loaderData?.seo ?? DEFAULT_SITE_CONTENT.seo;
    return {
      meta: [
        { title: seo.pricing.title },
        { name: "description", content: seo.pricing.description },
        { property: "og:title", content: seo.pricing.title },
        { property: "og:description", content: seo.pricing.description },
        { property: "og:type", content: "website" },
        { property: "og:url", content: "https://drive-thru-plus.lovable.app/pricing" },
        { property: "og:image", content: seo.ogImage },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:image", content: seo.ogImage },
      ],
      links: [{ rel: "canonical", href: "https://drive-thru-plus.lovable.app/pricing" }],
    };
  },
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
  const { pick } = useI18n();
  const site = useSite();

  return (
    <div className="spring-page">
      <section className="spring-page-hero spring-page-hero-centered">
        <div className="spring-shell">
          <span className="spring-kicker">{pick(site.pricing.eyebrow.ar, site.pricing.eyebrow.en)}</span>
          <h1 className="spring-display">{pick(site.pricing.title.ar, site.pricing.title.en)}</h1>
          <p className="spring-lead">{pick(site.pricing.subtitle.ar, site.pricing.subtitle.en)}</p>
        </div>
      </section>

      <section className="spring-section spring-soft-band">
        <div className="spring-shell spring-pricing-grid">
          {site.pricing.plans.map((p) => (
            <article
              key={p.name.en}
              className={cn(
                "spring-price-card",
                p.highlight && "is-featured",
              )}
            >
              <div className="spring-price-head">
                <h2>{pick(p.name.ar, p.name.en)}</h2>
                {p.highlight ? (
                  <span>
                    {pick("الأكثر اختياراً", "Most popular")}
                  </span>
                ) : null}
              </div>
              <p className="spring-price">
                {p.price}
                <span>
                  {p.price === "—" ? "" : pick("ر.ق", "QAR")}
                </span>
              </p>
              <p className="spring-price-period">{pick(p.per.ar, p.per.en)}</p>
              <ul>
                {p.features.map((f) => (
                  <li key={f.en}>
                    <Check aria-hidden />
                    {pick(f.ar, f.en)}
                  </li>
                ))}
              </ul>
              <SiteLink
                to="/contact"
                className={cn(
                  "spring-button",
                  p.highlight ? "spring-button-primary" : "spring-button-secondary",
                )}
              >
                {pick("اختر هذه الباقة", "Choose this plan")}
              </SiteLink>
            </article>
          ))}
        </div>
      </section>

      <section className="spring-section">
        <div className="spring-shell spring-faq-layout">
          <h2 className="spring-display">{pick("أسئلة شائعة", "Frequently asked")}</h2>
          <div className="spring-faq-grid">
            {FAQ.map((f) => (
              <article key={f.qEn}>
                <h3>{pick(f.qAr, f.qEn)}</h3>
                <p>{pick(f.aAr, f.aEn)}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="spring-section spring-dark-band">
        <div className="spring-shell spring-form-layout">
          <div>
            <span className="spring-kicker">{pick("ابدأ الآن", "Get started")}</span>
            <h2 className="spring-display">{pick(site.request.title.ar, site.request.title.en)}</h2>
            <p>
            {pick(
              "اختر الباقة وأرسل بياناتك، ونتولى الباقي.",
              "Pick a plan, send your details, and we handle the rest.",
            )}
            </p>
          </div>
          <div className="spring-form-panel">
            <RequestForm />
          </div>
        </div>
      </section>
    </div>
  );
}
