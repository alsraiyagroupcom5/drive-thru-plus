import { ArrowRight, BarChart3, Check, Clock3, MapPin, QrCode, Sparkles, Zap } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import type { SiteContent } from "@/lib/site-content";
import { cn } from "@/lib/utils";
import { SiteLink } from "@/components/marketing/SiteChrome";
import heroImage from "@/assets/business-hero.jpg";

export function LuxuryHome({ site }: { site: SiteContent }) {
  const { pick, dir } = useI18n();
  const hero = site.hero;

  return (
    <div className="spring-public-home">
      <section id="top" className="spring-hero spring-section">
        <div className="spring-shell spring-hero-grid">
          <div className="spring-hero-copy">
            <span className="spring-kicker">
              <Sparkles aria-hidden />
              {pick(hero.badge.ar, hero.badge.en)}
            </span>
            <h1 className="spring-display spring-hero-title">
              {pick(hero.title.ar, hero.title.en)}
              <em>{pick("تجربة أسرع في كل طلب.", "A faster experience, every order.")}</em>
            </h1>
            <p className="spring-lead">{pick(hero.subtitle.ar, hero.subtitle.en)}</p>
            <div className="spring-actions">
              <SiteLink to={hero.primary.to} className="spring-button spring-button-primary">
                {pick(hero.primary.label.ar, hero.primary.label.en)}
                <ArrowRight className={cn("h-4 w-4", dir === "rtl" && "rotate-180")} aria-hidden />
              </SiteLink>
              <SiteLink to={hero.secondary.to} className="spring-button spring-button-secondary">
                {pick(hero.secondary.label.ar, hero.secondary.label.en)}
              </SiteLink>
            </div>
            <div className="spring-proof-row">
              {hero.stats.slice(0, 3).map((stat) => (
                <div key={`${stat.value}-${stat.label.en}`}>
                  <strong>{stat.value}</strong>
                  <span>{pick(stat.label.ar, stat.label.en)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="spring-hero-visual">
            <img
              src={hero.imageUrl ?? heroImage}
              alt={pick(hero.imageAlt.ar, hero.imageAlt.en)}
              width={1600}
              height={1024}
            />
            <div className="spring-live-card">
              <span><span className="spring-live-dot" />{pick("الطلب مباشر", "Live order")}</span>
              <strong>#A1204</strong>
              <small>{pick("جاهز للاستلام خلال ٣ دقائق", "Ready for pickup in 3 min")}</small>
            </div>
          </div>
        </div>
      </section>

      <section className="spring-proof-band">
        <div className="spring-shell">
          <h2>{pick("من الطلب حتى التسليم — كل لحظة أوضح وأسرع", "From order to handover — every moment faster and clearer")}</h2>
          <div className="spring-proof-items">
            {[
              { icon: QrCode, ar: "طلب رقمي", en: "Digital ordering" },
              { icon: Zap, ar: "تشغيل لحظي", en: "Live operations" },
              { icon: MapPin, ar: "تتبع الوصول", en: "Arrival tracking" },
              { icon: BarChart3, ar: "رؤية شاملة", en: "Complete visibility" },
            ].map((item) => (
              <div key={item.en}><item.icon aria-hidden /><span>{pick(item.ar, item.en)}</span></div>
            ))}
          </div>
        </div>
      </section>

      <section className="spring-section spring-soft-band">
        <div className="spring-shell">
          <div className="spring-section-heading">
            <div>
              <span className="spring-kicker">{pick(site.features.eyebrow.ar, site.features.eyebrow.en)}</span>
              <h2 className="spring-display">{pick(site.features.title.ar, site.features.title.en)}</h2>
            </div>
            <SiteLink to="/features" className="spring-text-link">
              {pick("استكشف كل المزايا", "Explore every feature")}
              <ArrowRight className={cn("h-4 w-4", dir === "rtl" && "rotate-180")} aria-hidden />
            </SiteLink>
          </div>
          <div className="spring-feature-grid">
            {site.features.items.slice(0, 6).map((feature) => {
              const Icon = feature.icon === "clock" ? Clock3 : feature.icon === "qr" ? QrCode : BarChart3;
              return (
                <article key={feature.title.en} className="spring-feature-card">
                  <span className="spring-feature-icon"><Icon aria-hidden /></span>
                  <h3>{pick(feature.title.ar, feature.title.en)}</h3>
                  <p>{pick(feature.desc.ar, feature.desc.en)}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="spring-section spring-workflow">
        <div className="spring-shell spring-workflow-grid">
          <div>
            <span className="spring-kicker">{pick("رحلة واحدة متصلة", "One connected journey")}</span>
            <h2 className="spring-display">{pick(site.steps.title.ar, site.steps.title.en)}</h2>
            <p className="spring-lead">{pick(site.roles.subtitle.ar, site.roles.subtitle.en)}</p>
          </div>
          <ol>
            {site.steps.items.map((step, index) => (
              <li key={step.title.en}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div><h3>{pick(step.title.ar, step.title.en)}</h3><p>{pick(step.desc.ar, step.desc.en)}</p></div>
                <Check aria-hidden />
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="spring-section">
        <div className="spring-shell spring-cta-band">
          <div>
            <span className="spring-kicker">{pick(site.pricing.eyebrow.ar, site.pricing.eyebrow.en)}</span>
            <h2 className="spring-display">{pick(site.pricing.title.ar, site.pricing.title.en)}</h2>
            <p>{pick(site.pricing.subtitle.ar, site.pricing.subtitle.en)}</p>
          </div>
          <SiteLink to="/pricing" className="spring-button spring-button-light">
            {pick("عرض الباقات", "View plans")}
            <ArrowRight className={cn("h-4 w-4", dir === "rtl" && "rotate-180")} aria-hidden />
          </SiteLink>
        </div>
      </section>
    </div>
  );
}