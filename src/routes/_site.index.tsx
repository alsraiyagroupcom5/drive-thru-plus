import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check, Clock } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { DEFAULT_SITE_CONTENT, siteContentQuery, siteIcon, useSite } from "@/lib/site-content";
import { SectionTitle, SiteLink } from "@/components/marketing/SiteChrome";
import { RequestForm } from "@/components/marketing/RequestForm";
import heroImage from "@/assets/business-hero.jpg";

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

function BusinessHome() {
  const { pick, dir } = useI18n();
  const site = useSite();
  const hero = site.hero;

  return (
    <>
      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-8 px-5 py-12 md:grid-cols-2 md:py-20">
        <div>
          {hero.badge.ar || hero.badge.en ? (
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary">
              <Clock className="h-3.5 w-3.5" aria-hidden />
              {pick(hero.badge.ar, hero.badge.en)}
            </span>
          ) : null}
          <h1 className="mt-4 font-display text-4xl font-bold leading-tight md:text-5xl">
            {pick(hero.title.ar, hero.title.en)}
          </h1>
          <p className="mt-4 max-w-xl text-base text-muted-foreground">
            {pick(hero.subtitle.ar, hero.subtitle.en)}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <SiteLink
              to={hero.primary.to}
              className="inline-flex items-center gap-2 rounded-full bg-[image:var(--gradient-brass)] px-6 py-3.5 font-display text-sm font-bold text-primary-foreground shadow-[var(--shadow-lift)]"
            >
              {pick(hero.primary.label.ar, hero.primary.label.en)}
              <ArrowRight className={cn("h-4 w-4", dir === "rtl" && "rotate-180")} aria-hidden />
            </SiteLink>
            <SiteLink
              to={hero.secondary.to}
              className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3.5 text-sm font-semibold"
            >
              {pick(hero.secondary.label.ar, hero.secondary.label.en)}
            </SiteLink>
          </div>
          <dl className="mt-8 grid max-w-md grid-cols-3 gap-4">
            {hero.stats.map((s) => (
              <div key={s.label.en + s.value}>
                <dt className="font-display text-2xl font-bold text-primary">{s.value}</dt>
                <dd className="text-[11px] text-muted-foreground">{pick(s.label.ar, s.label.en)}</dd>
              </div>
            ))}
          </dl>
        </div>
        <img
          src={hero.imageUrl ?? heroImage}
          alt={pick(hero.imageAlt.ar, hero.imageAlt.en)}
          width={1600}
          height={1008}
          className="w-full rounded-3xl border border-border object-cover shadow-[var(--shadow-lift)]"
        />
      </section>

      {/* Slides */}
      {site.slides.length ? (
        <section className="border-y border-border bg-card/50 py-10">
          <div className="mx-auto max-w-6xl px-5">
            <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3">
              {site.slides.map((s, i) => (
                <article
                  key={i}
                  className="surface relative w-[85%] shrink-0 snap-center overflow-hidden rounded-3xl sm:w-[60%] lg:w-[48%]"
                >
                  {s.imageUrl ? (
                    <img
                      src={s.imageUrl}
                      alt={pick(s.title.ar, s.title.en)}
                      className="h-56 w-full object-cover"
                    />
                  ) : null}
                  <div className="p-5">
                    <h3 className="font-display text-lg font-bold">{pick(s.title.ar, s.title.en)}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{pick(s.text.ar, s.text.en)}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* Features preview */}
      <section className="border-y border-border bg-card/50 py-14">
        <div className="mx-auto max-w-6xl px-5">
          <SectionTitle
            eyebrow={pick(site.features.eyebrow.ar, site.features.eyebrow.en)}
            title={pick(site.features.title.ar, site.features.title.en)}
          />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {site.features.items.slice(0, 8).map((f) => {
              const Icon = siteIcon(f.icon);
              return (
                <div key={f.title.en} className="surface rounded-2xl p-5">
                  <Icon className="h-5 w-5 text-primary" aria-hidden />
                  <p className="mt-3 text-sm font-semibold">{pick(f.title.ar, f.title.en)}</p>
                </div>
              );
            })}
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
          eyebrow={pick(site.roles.eyebrow.ar, site.roles.eyebrow.en)}
          title={pick(site.roles.title.ar, site.roles.title.en)}
          subtitle={pick(site.roles.subtitle.ar, site.roles.subtitle.en)}
        />
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {site.roles.items.map((r) => {
            const Icon = siteIcon(r.icon);
            return (
              <div key={r.title.en} className="surface flex flex-col rounded-3xl p-6">
                <Icon className="h-6 w-6 text-primary" aria-hidden />
                <h3 className="mt-3 font-display text-lg font-bold">{pick(r.title.ar, r.title.en)}</h3>
                <ul className="mt-4 flex-1 space-y-2 text-sm text-muted-foreground">
                  {r.points.map((p) => (
                    <li key={p.en} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                      {pick(p.ar, p.en)}
                    </li>
                  ))}
                </ul>
                <SiteLink
                  to={r.to}
                  className="mt-6 rounded-full border border-primary px-5 py-2.5 text-center text-sm font-bold text-primary"
                >
                  {pick(r.linkLabel.ar, r.linkLabel.en)}
                </SiteLink>
              </div>
            );
          })}
        </div>
      </section>

      {/* Steps */}
      <section className="border-y border-border bg-card/50 py-14">
        <div className="mx-auto max-w-6xl px-5">
          <SectionTitle title={pick(site.steps.title.ar, site.steps.title.en)} />
          <ol className="mt-8 grid gap-4 md:grid-cols-3">
            {site.steps.items.map((s, i) => (
              <li key={s.title.en} className="surface rounded-2xl p-5">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-primary/10 font-display font-bold text-primary">
                  {i + 1}
                </span>
                <p className="mt-3 text-sm font-semibold">{pick(s.title.ar, s.title.en)}</p>
                <p className="mt-1 text-sm text-muted-foreground">{pick(s.desc.ar, s.desc.en)}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Pricing teaser */}
      <section className="mx-auto max-w-6xl px-5 py-14">
        <SectionTitle
          eyebrow={pick(site.pricing.eyebrow.ar, site.pricing.eyebrow.en)}
          title={pick(site.pricing.title.ar, site.pricing.title.en)}
          subtitle={pick(site.pricing.subtitle.ar, site.pricing.subtitle.en)}
        />
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {site.pricing.plans.map((p) => (
            <div
              key={p.name.en}
              className={cn("surface flex flex-col rounded-3xl p-6", p.highlight && "ring-2 ring-primary")}
            >
              <h3 className="font-display text-lg font-bold">{pick(p.name.ar, p.name.en)}</h3>
              <p className="mt-3 font-display text-3xl font-bold">
                {p.price}
                <span className="ms-1 text-sm font-semibold text-muted-foreground">
                  {p.price === "—" ? "" : pick("ر.ق", "QAR")}
                </span>
              </p>
              <p className="text-xs text-muted-foreground">{pick(p.per.ar, p.per.en)}</p>
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
              {pick(site.request.title.ar, site.request.title.en)}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {pick(site.request.subtitle.ar, site.request.subtitle.en)}
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
