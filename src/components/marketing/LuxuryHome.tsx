import { ArrowRight, BarChart3, QrCode, Sparkles } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import type { SiteContent } from "@/lib/site-content";
import { cn } from "@/lib/utils";
import { SiteLink } from "@/components/marketing/SiteChrome";
import mascotAsset from "@/assets/qr-spring-luxury-mascot.png.asset.json";

export function LuxuryHome({ site }: { site: SiteContent }) {
  const { pick, dir } = useI18n();
  const hero = site.hero;

  return (
    <section id="top" className="luxury-hero">
      <div className="luxury-hero-field" aria-hidden>
        <div className="luxury-hero-mesh" />
        <div className="luxury-hero-dots" />
      </div>

      <div className="luxury-shell luxury-hero-body">
        <a className="luxury-pill" href="#luxury-partners">
          <span className="luxury-pill-icon"><Sparkles aria-hidden /></span>
          {pick("الآن مع تحليلات تشغيلية ذكية", "Now with AI-powered analytics")}
        </a>

        <h1 className="luxury-title">
          {pick(hero.title.ar, hero.title.en)}
          <span>{pick("طلب أسرع. رؤية أوضح.", "Effortless operations")}</span>
        </h1>
        <p className="luxury-subtitle">{pick(hero.subtitle.ar, hero.subtitle.en)}</p>

        <div className="luxury-actions">
          <SiteLink to={hero.primary.to} className="luxury-button luxury-button-solid">
            {pick(hero.primary.label.ar, hero.primary.label.en)}
            <ArrowRight className={cn("h-4 w-4", dir === "rtl" && "rotate-180")} aria-hidden />
          </SiteLink>
          <SiteLink to={hero.secondary.to} className="luxury-button luxury-button-glass">
            <Sparkles className="h-4 w-4" aria-hidden />
            {pick(hero.secondary.label.ar, hero.secondary.label.en)}
          </SiteLink>
        </div>
        <p className="luxury-fine">
          {pick("إعداد احترافي، تجربة ثنائية اللغة، ودعم مخصص.", "Professional setup, bilingual experience and dedicated support.")}
        </p>

        <img
          src={mascotAsset.url}
          alt=""
          aria-hidden
          width={1024}
          height={1536}
          className="luxury-mascot"
        />
      </div>

      <div id="luxury-partners" className="luxury-partners luxury-shell">
        <h2 className="sr-only">{pick("منصة موثوقة للفرق", "Trusted by restaurant teams")}</h2>
        {[
          { icon: QrCode, ar: "طلب ذكي", en: "Smart ordering" },
          { icon: BarChart3, ar: "رؤية مباشرة", en: "Live insight" },
          { icon: Sparkles, ar: "تجربة راقية", en: "Premium experience" },
          { icon: ArrowRight, ar: "تشغيل أسرع", en: "Faster service" },
        ].map((item) => (
          <div key={item.en} className="luxury-partner">
            <item.icon aria-hidden />
            <span>{pick(item.ar, item.en)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}