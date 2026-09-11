import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Check } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { DEFAULT_SITE_CONTENT, siteContentQuery, siteIcon, useSite } from "@/lib/site-content";
import { SiteLink } from "@/components/marketing/SiteChrome";

export const Route = createFileRoute("/_site/features")({
  loader: ({ context }) => context.queryClient.ensureQueryData(siteContentQuery),
  head: ({ loaderData }) => {
    const seo = loaderData?.seo ?? DEFAULT_SITE_CONTENT.seo;
    return {
      meta: [
        { title: seo.features.title },
        { name: "description", content: seo.features.description },
        { property: "og:title", content: seo.features.title },
        { property: "og:description", content: seo.features.description },
        { property: "og:type", content: "website" },
        { property: "og:url", content: "https://drive-thru-plus.lovable.app/features" },
        { property: "og:image", content: seo.ogImage },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:image", content: seo.ogImage },
      ],
      links: [{ rel: "canonical", href: "https://drive-thru-plus.lovable.app/features" }],
    };
  },
  component: FeaturesPage,
});

function FeaturesPage() {
  const { pick, dir } = useI18n();
  const site = useSite();

  return (
    <div className="spring-page">
      <section className="spring-page-hero">
        <div className="spring-shell">
          <span className="spring-kicker">{pick(site.features.eyebrow.ar, site.features.eyebrow.en)}</span>
          <h1 className="spring-display">{pick(site.features.title.ar, site.features.title.en)}</h1>
          <p className="spring-lead">{pick(site.features.subtitle.ar, site.features.subtitle.en)}</p>
        </div>
      </section>

      <section className="spring-section spring-soft-band">
        <div className="spring-shell spring-feature-grid spring-feature-grid-wide">
          {site.features.items.map((f) => {
            const Icon = siteIcon(f.icon);
            return (
              <article key={f.title.en} className="spring-feature-card">
                <span className="spring-feature-icon"><Icon aria-hidden /></span>
                <h2>{pick(f.title.ar, f.title.en)}</h2>
                <p>{pick(f.desc.ar, f.desc.en)}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="spring-section spring-dark-band">
        <div className="spring-shell">
          <div className="spring-section-heading">
            <div>
              <span className="spring-kicker">{pick("صلاحيات دقيقة", "Precise access")}</span>
              <h2 className="spring-display">{pick(site.roles.title.ar, site.roles.title.en)}</h2>
            </div>
            <p>{pick(site.roles.subtitle.ar, site.roles.subtitle.en)}</p>
          </div>
          <div className="spring-role-grid">
            {site.roles.items.map((r) => {
              const Icon = siteIcon(r.icon);
              return (
                <article key={r.title.en}>
                  <Icon aria-hidden />
                  <h3>{pick(r.title.ar, r.title.en)}</h3>
                  <ul>
                    {r.points.map((p) => (
                      <li key={p.en}>
                        <Check aria-hidden />
                        {pick(p.ar, p.en)}
                      </li>
                    ))}
                  </ul>
                  <SiteLink
                    to={r.to}
                    className="spring-text-link"
                  >
                    {pick(r.linkLabel.ar, r.linkLabel.en)}
                    <ArrowRight className={cn("h-4 w-4", dir === "rtl" && "rotate-180")} aria-hidden />
                  </SiteLink>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="spring-section">
        <div className="spring-shell spring-cta-band">
          <h2 className="spring-display">{pick("جاهز لتشغيل مطعمك على المنصة؟", "Ready to run your restaurant on the platform?")}</h2>
          <SiteLink to="/contact" className="spring-button spring-button-light">
            {pick("اطلب حسابك", "Request your account")}
          </SiteLink>
        </div>
      </section>
    </div>
  );
}
