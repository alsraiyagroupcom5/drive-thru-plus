import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock, Instagram, Mail, MapPin, Phone } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { DEFAULT_SITE_CONTENT, siteContentQuery, useSite } from "@/lib/site-content";
import { SectionTitle } from "@/components/marketing/SiteChrome";
import { RequestForm } from "@/components/marketing/RequestForm";

export const Route = createFileRoute("/_site/contact")({
  loader: ({ context }) => context.queryClient.ensureQueryData(siteContentQuery),
  head: ({ loaderData }) => {
    const site = loaderData ?? DEFAULT_SITE_CONTENT;
    const seo = site.seo;
    return {
      meta: [
        { title: seo.contact.title },
        { name: "description", content: seo.contact.description },
        { property: "og:title", content: seo.contact.title },
        { property: "og:description", content: seo.contact.description },
        { property: "og:type", content: "website" },
        { property: "og:url", content: "https://drive-thru-plus.lovable.app/contact" },
        { property: "og:image", content: seo.ogImage },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:image", content: seo.ogImage },
      ],
      links: [{ rel: "canonical", href: "https://drive-thru-plus.lovable.app/contact" }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: site.brand.name.en,
            url: "https://drive-thru-plus.lovable.app/",
            email: site.contact.email,
            areaServed: "QA",
          }),
        },
      ],
    };
  },
  component: ContactPage,
});

function ContactPage() {
  const { pick } = useI18n();
  const site = useSite();

  return (
    <>
      <section className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-2">
        <div>
          <SectionTitle
            eyebrow={pick("تواصل معنا", "Contact")}
            title={pick(site.contact.title.ar, site.contact.title.en)}
            subtitle={pick(site.contact.subtitle.ar, site.contact.subtitle.en)}
          />

          <div className="mt-8 grid gap-3">
            <div className="surface flex items-center gap-3 rounded-2xl p-4">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10">
                <Clock className="h-4 w-4 text-primary" aria-hidden />
              </span>
              <p className="text-sm font-semibold">{pick(site.contact.hours.ar, site.contact.hours.en)}</p>
            </div>

            <a href={`mailto:${site.contact.email}`} className="surface flex items-center gap-3 rounded-2xl p-4">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10">
                <Mail className="h-4 w-4 text-primary" aria-hidden />
              </span>
              <p className="text-sm font-semibold" dir="ltr">
                {site.contact.email}
              </p>
            </a>

            <a
              href={site.contact.instagram}
              target="_blank"
              rel="noreferrer"
              className="surface flex items-center gap-3 rounded-2xl p-4"
            >
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10">
                <Instagram className="h-4 w-4 text-primary" aria-hidden />
              </span>
              <p className="text-sm font-semibold" dir="ltr">
                @{site.contact.instagramLabel}
              </p>
            </a>

            <div className="surface flex items-center gap-3 rounded-2xl p-4">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10">
                <Phone className="h-4 w-4 text-primary" aria-hidden />
              </span>
              <p className="text-sm text-muted-foreground">
                {pick("للمبيعات وطلبات المنصة", "For sales and platform requests")}
              </p>
            </div>
          </div>
        </div>

        <div className="surface h-fit rounded-3xl p-6 md:p-8">
          <h2 className="font-display text-2xl font-bold">
            {pick(site.request.title.ar, site.request.title.en)}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {pick(site.request.subtitle.ar, site.request.subtitle.en)}
          </p>
          <div className="mt-6">
            <RequestForm />
          </div>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            {pick("لديك حساب بالفعل؟", "Already have an account?")}{" "}
            <Link to="/auth" className="text-primary underline underline-offset-4">
              {pick("دخول الفريق", "Team login")}
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
