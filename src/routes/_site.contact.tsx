import { createFileRoute } from "@tanstack/react-router";
import { Clock, Instagram, Mail, Phone } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { DEFAULT_SITE_CONTENT, siteContentQuery, useSite } from "@/lib/site-content";
import { SiteLink } from "@/components/marketing/SiteChrome";
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
    <div className="spring-page">
      <section className="spring-section spring-contact-band">
        <div className="spring-shell spring-contact-layout">
          <div>
            <span className="spring-kicker">{pick("تواصل معنا", "Contact")}</span>
            <h1 className="spring-display">{pick(site.contact.title.ar, site.contact.title.en)}</h1>
            <p className="spring-lead">{pick(site.contact.subtitle.ar, site.contact.subtitle.en)}</p>

            <div className="spring-contact-list">
            <div>
              <span><Clock aria-hidden /></span>
              <p>{pick(site.contact.hours.ar, site.contact.hours.en)}</p>
            </div>

            <a href={`mailto:${site.contact.email}`}>
              <span><Mail aria-hidden /></span>
              <p dir="ltr">{site.contact.email}</p>
            </a>

            <a
              href={site.contact.instagram}
              target="_blank"
              rel="noreferrer"
            >
              <span><Instagram aria-hidden /></span>
              <p dir="ltr">@{site.contact.instagramLabel}</p>
            </a>

            <div>
              <span><Phone aria-hidden /></span>
              <p>{pick("للمبيعات وطلبات المنصة", "For sales and platform requests")}</p>
            </div>
          </div>
        </div>

        <div className="spring-form-panel">
          <h2>
            {pick(site.request.title.ar, site.request.title.en)}
          </h2>
          <p>
            {pick(site.request.subtitle.ar, site.request.subtitle.en)}
          </p>
          <div className="spring-form-body">
            <RequestForm />
          </div>
          <p className="spring-login-note">
            {pick("لديك حساب بالفعل؟", "Already have an account?")}{" "}
            <SiteLink to="/auth">
              {pick("دخول الفريق", "Team login")}
            </SiteLink>
          </p>
        </div>
        </div>
      </section>
    </div>
  );
}
