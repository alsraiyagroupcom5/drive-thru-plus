import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { DEFAULT_SITE_CONTENT, siteContentQuery, siteIcon, useSite } from "@/lib/site-content";
import { RequestForm } from "@/components/marketing/RequestForm";
import heroImage from "@/assets/business-hero.jpg";
import qrSpringLogoAsset from "@/assets/qr-spring-logo.png.asset.json";

const qrSpringLogo = qrSpringLogoAsset.url;

export const Route = createFileRoute("/_site/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(siteContentQuery),
  head: ({ loaderData }) => {
    const seo = loaderData?.seo ?? DEFAULT_SITE_CONTENT.seo;
    return {
      meta: [
        { title: seo.home.title },
        { name: "description", content: seo.home.description },
        { property: "og:title", content: seo.home.title },
        { property: "og:description", content: seo.home.description },
        { property: "og:type", content: "website" },
        { property: "og:url", content: "https://drive-thru-plus.lovable.app/" },
        { property: "og:image", content: seo.ogImage },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:image", content: seo.ogImage },
      ],
      links: [{ rel: "canonical", href: "https://drive-thru-plus.lovable.app/" }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "QR-Spring",
            applicationCategory: "BusinessApplication",
            operatingSystem: "Web",
            url: "https://drive-thru-plus.lovable.app/",
            image: seo.ogImage,
            description: seo.home.description,
          }),
        },
      ],
    };
  },
  component: BusinessHome,
});

/* ---------- Section heading (editorial, hairline rule) ---------- */
function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block text-[11px] font-bold uppercase tracking-[0.28em] text-site-teal">
      {children}
    </span>
  );
}

function SiteSlides({ slides, logoUrl, brandName }: {
  slides: typeof DEFAULT_SITE_CONTENT.slides;
  logoUrl?: string | null;
  brandName: { ar: string; en: string };
}) {
  const { pick, dir } = useI18n();
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const scrollTo = useCallback((index: number) => {
    const track = trackRef.current;
    if (!track || !track.children[index]) return;
    const card = track.children[index] as HTMLElement;
    const gap = 24;
    const scrollLeft = dir === "rtl"
      ? track.scrollWidth - card.offsetLeft - card.offsetWidth - gap * index
      : card.offsetLeft + gap * index;
    track.scrollTo({ left: scrollLeft, behavior: "smooth" });
    setActive(index);
  }, [dir]);

  const next = useCallback(() => {
    scrollTo((active + 1) % slides.length);
  }, [active, slides.length, scrollTo]);

  const prev = useCallback(() => {
    scrollTo((active - 1 + slides.length) % slides.length);
  }, [active, slides.length, scrollTo]);

  useEffect(() => {
    if (slides.length <= 1 || isHovering) return;
    const id = setInterval(next, 5000);
    return () => clearInterval(id);
  }, [next, slides.length, isHovering]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const onScroll = () => {
      const card = track.children[0] as HTMLElement | undefined;
      if (!card) return;
      const gap = 24;
      const scrollPos = dir === "rtl" ? track.scrollWidth - track.scrollLeft - track.clientWidth : track.scrollLeft;
      const approxIndex = Math.round(scrollPos / (card.offsetWidth + gap));
      setActive(Math.max(0, Math.min(slides.length - 1, approxIndex)));
    };
    track.addEventListener("scroll", onScroll, { passive: true });
    return () => track.removeEventListener("scroll", onScroll);
  }, [dir, slides.length]);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.changedTouches[0]?.screenX ?? null;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null) return;
    const endX = e.changedTouches[0]?.screenX;
    if (endX == null) return;
    const diff = touchStartX.current - endX;
    if (Math.abs(diff) > 40) diff > 0 ? next() : prev();
    touchStartX.current = null;
  };

  if (!slides.length) return null;

  return (
    <section className="border-y border-border bg-card py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div
          className="group relative"
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          <div className="mb-10 flex items-end justify-between gap-6">
            <div>
              <Eyebrow>{pick("لقطات من المنصة", "Inside the platform")}</Eyebrow>
              <h2 className="mt-3 font-display text-3xl font-bold tracking-tight md:text-4xl">
                {pick("تجربة متكاملة من المسح حتى التسليم", "From scan to handover")}
              </h2>
            </div>
            <div className="hidden gap-2 md:flex">
              <button
                type="button"
                onClick={prev}
                aria-label={pick("الشريحة السابقة", "Previous slide")}
                className="grid h-11 w-11 place-items-center border border-border text-foreground transition-colors hover:bg-site-ink hover:text-site-ink-foreground"
              >
                <ChevronLeft className={cn("h-5 w-5", dir === "rtl" && "rotate-180")} aria-hidden />
              </button>
              <button
                type="button"
                onClick={next}
                aria-label={pick("الشريحة التالية", "Next slide")}
                className="grid h-11 w-11 place-items-center border border-border text-foreground transition-colors hover:bg-site-ink hover:text-site-ink-foreground"
              >
                <ChevronRight className={cn("h-5 w-5", dir === "rtl" && "rotate-180")} aria-hidden />
              </button>
            </div>
          </div>

          <div
            ref={trackRef}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            className="flex snap-x snap-mandatory gap-6 overflow-x-auto pb-2"
          >
            {slides.map((s, i) => (
              <article
                key={i}
                className="group/card relative w-[86%] shrink-0 snap-center border border-border bg-background sm:w-[62%] lg:w-[46%]"
              >
                <div className="relative overflow-hidden">
                  {s.imageUrl ? (
                    <img
                      src={s.imageUrl}
                      alt={pick(s.title.ar, s.title.en)}
                      className="h-64 w-full object-cover grayscale transition-all duration-700 group-hover/card:scale-[1.03] group-hover/card:grayscale-0"
                    />
                  ) : (
                    <div className="h-64 w-full bg-site-sand" />
                  )}
                  <img
                    src={logoUrl ?? qrSpringLogo}
                    alt={pick(brandName.ar, brandName.en)}
                    className="absolute start-5 top-5 h-10 w-auto object-contain drop-shadow-[0_2px_10px_rgba(0,0,0,0.35)]"
                  />
                </div>
                <div className="border-t border-border p-7">
                  <h3 className="font-display text-xl font-bold">{pick(s.title.ar, s.title.en)}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {pick(s.text.ar, s.text.en)}
                  </p>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-6 flex justify-center gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => scrollTo(i)}
                aria-label={pick(`انتقل إلى الشريحة ${i + 1}`, `Go to slide ${i + 1}`)}
                className={cn(
                  "h-[3px] transition-all duration-300",
                  active === i ? "w-10 bg-site-teal" : "w-4 bg-border hover:bg-muted-foreground/60"
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function BusinessHome() {
  const { pick, dir } = useI18n();
  const site = useSite();
  const hero = site.hero;

  return (
    <>
      {/* ---------- Hero: architectural split with sand block ---------- */}
      <section className="relative overflow-hidden bg-background pb-28 pt-16 md:pt-24">
        <div className="absolute inset-y-0 end-0 -z-10 hidden w-1/2 bg-site-sand lg:block" aria-hidden />
        <div className="mx-auto grid max-w-7xl items-center gap-16 px-6 lg:grid-cols-2">
          <div className="z-10 space-y-8">
            {hero.badge.ar || hero.badge.en ? (
              <span className="inline-flex items-center gap-2 border border-site-teal/30 bg-site-teal/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-site-teal">
                <Clock className="h-3.5 w-3.5" aria-hidden />
                {pick(hero.badge.ar, hero.badge.en)}
              </span>
            ) : null}
            <h1 className="font-display text-5xl font-bold leading-[1.08] tracking-tight md:text-7xl">
              {pick(hero.title.ar, hero.title.en)}
            </h1>
            <p className="max-w-lg text-lg leading-relaxed text-muted-foreground md:text-xl">
              {pick(hero.subtitle.ar, hero.subtitle.en)}
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <SiteLinkButton to={hero.primary.to} variant="solid">
                {pick(hero.primary.label.ar, hero.primary.label.en)}
                <ArrowRight className={cn("h-4 w-4", dir === "rtl" && "rotate-180")} aria-hidden />
              </SiteLinkButton>
              <SiteLinkButton to={hero.secondary.to} variant="outline">
                {pick(hero.secondary.label.ar, hero.secondary.label.en)}
              </SiteLinkButton>
            </div>
            <dl className="grid max-w-lg grid-cols-3 gap-8 border-t border-border pt-10">
              {hero.stats.map((s) => (
                <div key={s.label.en + s.value}>
                  <dt className="font-display text-3xl font-bold text-site-teal">{s.value}</dt>
                  <dd className="mt-1 text-xs text-muted-foreground">{pick(s.label.ar, s.label.en)}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="relative">
            <img
              src={hero.imageUrl ?? heroImage}
              alt={pick(hero.imageAlt.ar, hero.imageAlt.en)}
              width={1600}
              height={2000}
              className="aspect-[4/5] w-full object-cover shadow-[var(--shadow-lift)] grayscale transition-all duration-700 hover:grayscale-0"
            />
            <div className="absolute -bottom-8 -start-8 -z-10 hidden h-56 w-56 bg-site-teal/10 lg:block" aria-hidden />
          </div>
        </div>
      </section>

      {/* ---------- Slides ---------- */}
      {site.slides.length ? (
        <SiteSlides slides={site.slides} logoUrl={site.brand.logoUrl} brandName={site.brand.name} />
      ) : null}

      {/* ---------- Features: hairline grid ---------- */}
      <section className="bg-background py-28">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-16 max-w-2xl">
            <Eyebrow>{pick(site.features.eyebrow.ar, site.features.eyebrow.en)}</Eyebrow>
            <h2 className="mt-4 font-display text-4xl font-bold tracking-tight md:text-5xl">
              {pick(site.features.title.ar, site.features.title.en)}
            </h2>
          </div>
          <div className="grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
            {site.features.items.slice(0, 8).map((f) => {
              const Icon = siteIcon(f.icon);
              return (
                <div
                  key={f.title.en}
                  className="group bg-background p-8 transition-colors duration-300 hover:bg-card"
                >
                  <div className="mb-8 grid h-12 w-12 place-items-center bg-site-teal/10 transition-colors group-hover:bg-site-teal">
                    <Icon className="h-5 w-5 text-site-teal transition-colors group-hover:text-white" aria-hidden />
                  </div>
                  <p className="font-display text-base font-bold leading-snug">{pick(f.title.ar, f.title.en)}</p>
                </div>
              );
            })}
          </div>
          <Link
            to="/features"
            className="mt-10 inline-flex items-center gap-2 border-b border-site-teal pb-1 text-sm font-bold text-site-teal"
          >
            {pick("استعرض كل المزايا", "Explore all features")}
            <ArrowRight className={cn("h-4 w-4", dir === "rtl" && "rotate-180")} aria-hidden />
          </Link>
        </div>
      </section>

      {/* ---------- Roles: ink band, numbered list ---------- */}
      <section className="bg-site-ink py-28 text-site-ink-foreground">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-16 lg:grid-cols-2 lg:items-start">
            <div>
              <Eyebrow>{pick(site.roles.eyebrow.ar, site.roles.eyebrow.en)}</Eyebrow>
              <h2 className="mt-4 font-display text-4xl font-bold leading-tight md:text-5xl">
                {pick(site.roles.title.ar, site.roles.title.en)}
              </h2>
              <p className="mt-6 max-w-lg leading-relaxed text-site-ink-foreground/60">
                {pick(site.roles.subtitle.ar, site.roles.subtitle.en)}
              </p>
            </div>
            <div>
              {site.roles.items.map((r, i) => (
                <div key={r.title.en} className="flex gap-6 border-b border-white/10 py-8 first:pt-0">
                  <div className="flex-none font-display text-lg font-bold text-site-teal">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-display text-xl font-semibold">{pick(r.title.ar, r.title.en)}</h3>
                    <ul className="mt-3 space-y-2 text-sm text-site-ink-foreground/60">
                      {r.points.map((p) => (
                        <li key={p.en} className="flex items-start gap-2">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-site-teal" aria-hidden />
                          {pick(p.ar, p.en)}
                        </li>
                      ))}
                    </ul>
                    <SiteLinkPlain to={r.to}>{pick(r.linkLabel.ar, r.linkLabel.en)}</SiteLinkPlain>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Steps: ghost numerals on sand ---------- */}
      <section className="bg-site-sand py-28">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="mb-20 max-w-2xl font-display text-4xl font-bold tracking-tight md:text-5xl">
            {pick(site.steps.title.ar, site.steps.title.en)}
          </h2>
          <ol className="grid gap-14 md:grid-cols-3">
            {site.steps.items.map((s, i) => (
              <li key={s.title.en} className="relative">
                <span
                  className="pointer-events-none absolute -top-12 end-0 font-display text-8xl font-bold text-site-teal/10"
                  aria-hidden
                >
                  {i + 1}
                </span>
                <h3 className="relative z-10 font-display text-xl font-bold">{pick(s.title.ar, s.title.en)}</h3>
                <p className="relative z-10 mt-3 text-sm leading-relaxed text-muted-foreground">
                  {pick(s.desc.ar, s.desc.en)}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ---------- Pricing teaser: teal band ---------- */}
      <section className="bg-background py-28">
        <div className="mx-auto max-w-7xl px-6">
          <div className="relative overflow-hidden bg-site-teal p-10 text-white md:p-16">
            <div className="absolute -end-20 -top-20 h-96 w-96 rounded-full bg-white/5" aria-hidden />
            <div className="absolute -bottom-20 -start-20 h-64 w-64 rounded-full bg-black/10" aria-hidden />
            <div className="relative z-10">
              <Eyebrow>
                <span className="text-white/70">{pick(site.pricing.eyebrow.ar, site.pricing.eyebrow.en)}</span>
              </Eyebrow>
              <div className="mt-4 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
                <div className="max-w-2xl">
                  <h2 className="font-display text-4xl font-bold tracking-tight">
                    {pick(site.pricing.title.ar, site.pricing.title.en)}
                  </h2>
                  <p className="mt-4 text-lg text-white/80">
                    {pick(site.pricing.subtitle.ar, site.pricing.subtitle.en)}
                  </p>
                </div>
                <Link
                  to="/pricing"
                  className="whitespace-nowrap bg-white px-10 py-5 text-center font-display text-sm font-bold uppercase tracking-widest text-site-teal transition-colors hover:bg-site-ink hover:text-white"
                >
                  {pick("عرض كل الباقات", "View all plans")}
                </Link>
              </div>
              <div className="mt-12 grid gap-px border border-white/20 bg-white/20 md:grid-cols-3">
                {site.pricing.plans.map((p) => (
                  <div key={p.name.en} className="bg-site-teal p-8">
                    <h3 className="font-display text-base font-bold uppercase tracking-widest text-white/80">
                      {pick(p.name.ar, p.name.en)}
                    </h3>
                    <p className="mt-4 font-display text-4xl font-bold">
                      {p.price}
                      <span className="ms-2 text-sm font-medium text-white/70">
                        {p.price === "—" ? "" : pick("ر.ق", "QAR")}
                      </span>
                    </p>
                    <p className="mt-1 text-xs text-white/70">{pick(p.per.ar, p.per.en)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Request ---------- */}
      <section className="border-t border-border bg-background py-28">
        <div className="mx-auto grid max-w-6xl gap-16 px-6 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <h2 className="font-display text-4xl font-bold leading-tight tracking-tight">
              {pick(site.request.title.ar, site.request.title.en)}
            </h2>
            <p className="mt-6 leading-relaxed text-muted-foreground">
              {pick(site.request.subtitle.ar, site.request.subtitle.en)}
            </p>
          </div>
          <div className="border border-border bg-card p-8 shadow-[var(--shadow-soft)] md:p-10 lg:col-span-3">
            <RequestForm />
          </div>
        </div>
      </section>
    </>
  );
}

/* ---------- Local link buttons (square, editorial) ---------- */
function SiteLinkButton({
  to,
  variant,
  children,
}: {
  to: string;
  variant: "solid" | "outline";
  children: React.ReactNode;
}) {
  return (
    <a
      href={to}
      className={cn(
        "inline-flex items-center gap-2 px-8 py-4 font-display text-sm font-bold transition-colors duration-300",
        variant === "solid"
          ? "bg-site-teal text-white hover:bg-site-ink"
          : "border border-foreground text-foreground hover:bg-foreground hover:text-background"
      )}
    >
      {children}
    </a>
  );
}

function SiteLinkPlain({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <a
      href={to}
      className="mt-4 inline-block border-b border-site-teal pb-0.5 text-sm font-bold text-site-teal"
    >
      {children}
    </a>
  );
}
