import { createFileRoute, Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { DEFAULT_SITE_CONTENT, siteContentQuery, siteIcon, useSite } from "@/lib/site-content";
import { SectionTitle, SiteLink } from "@/components/marketing/SiteChrome";

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
  const { pick } = useI18n();
  const site = useSite();

  return (
    <>
      <section className="mx-auto max-w-6xl px-5 py-14">
        <SectionTitle
          eyebrow={pick(site.features.eyebrow.ar, site.features.eyebrow.en)}
          title={pick(site.features.title.ar, site.features.title.en)}
          subtitle={pick(site.features.subtitle.ar, site.features.subtitle.en)}
        />
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {site.features.items.map((f) => {
            const Icon = siteIcon(f.icon);
            return (
              <div key={f.title.en} className="surface rounded-3xl p-6">
                <div className="flex items-start gap-4">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" aria-hidden />
                  </span>
                  <div>
                    <h3 className="font-display text-base font-bold">{pick(f.title.ar, f.title.en)}</h3>
                    <p className="mt-1.5 text-sm text-muted-foreground">{pick(f.desc.ar, f.desc.en)}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="border-y border-border bg-card/50 py-14">
        <div className="mx-auto max-w-6xl px-5">
          <SectionTitle
            eyebrow={pick("الصلاحيات", "Permissions")}
            title={pick(site.roles.title.ar, site.roles.title.en)}
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
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5 py-14 text-center">
        <h2 className="font-display text-2xl font-bold">
          {pick("جاهز لتشغيل مطعمك على المنصة؟", "Ready to run your restaurant on the platform?")}
        </h2>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            to="/contact"
            className="rounded-full bg-[image:var(--gradient-brass)] px-6 py-3.5 font-display text-sm font-bold text-primary-foreground"
          >
            {pick("اطلب حسابك", "Request your account")}
          </Link>
          <Link to="/pricing" className="rounded-full border border-border px-6 py-3.5 text-sm font-semibold">
            {pick("عرض الأسعار", "View pricing")}
          </Link>
        </div>
      </section>
    </>
  );
}
