import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock, Instagram, Mail, MapPin, Phone } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { CONTACT } from "@/lib/marketing";
import { SectionTitle } from "@/components/marketing/SiteChrome";
import { RequestForm } from "@/components/marketing/RequestForm";

const OG_IMAGE =
  "https://drive-thru-plus.lovable.app/__l5e/assets-v1/0cec0fac-0bcd-4383-8e30-8462ae4a84b5/qr-spring-og.jpg";

export const Route = createFileRoute("/_site/contact")({
  head: () => ({
    meta: [
      { title: "Contact us — QR-Spring, Doha Qatar" },
      {
        name: "description",
        content:
          "Talk to the QR-Spring team: Duhail Night Market 60020078, Aspire Downtown 66741689, Lusail Marina 51358247. Open daily 7AM to 12AM.",
      },
      { property: "og:title", content: "Contact us — QR-Spring" },
      {
        property: "og:description",
        content: "Phone, email and Instagram for the QR-Spring ordering platform team in Qatar.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://drive-thru-plus.lovable.app/contact" },
      { property: "og:image", content: OG_IMAGE },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: OG_IMAGE },
    ],
    links: [{ rel: "canonical", href: "https://drive-thru-plus.lovable.app/contact" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "QR-Spring",
          url: "https://drive-thru-plus.lovable.app/",
          logo: "https://drive-thru-plus.lovable.app/__l5e/assets-v1/7373a51e-6b9f-410b-86c2-a88175ed136a/qr-spring-logo.png",
          areaServed: "QA",
          contactPoint: [
            { "@type": "ContactPoint", telephone: "+97460020078", contactType: "customer service" },
          ],
        }),
      },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const { pick } = useI18n();

  return (
    <>
      <section className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-2">
        <div>
          <SectionTitle
            eyebrow={pick("تواصل معنا", "Contact")}
            title={pick("نسعد بالحديث عن مطعمك", "We'd love to hear about your restaurant")}
            subtitle={pick(
              "اتصل بأي فرع أو أرسل طلبك وسنعاود التواصل خلال يوم عمل واحد.",
              "Call any branch or send a request and we'll get back to you within one business day.",
            )}
          />

          <div className="mt-8 grid gap-3">
            {CONTACT.branches.map((b) => (
              <div key={b.phone} className="surface flex items-center justify-between rounded-2xl p-4">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10">
                    <MapPin className="h-4 w-4 text-primary" aria-hidden />
                  </span>
                  <div>
                    <p className="text-sm font-bold">{pick(b.ar, b.en)}</p>
                    <p className="text-xs text-muted-foreground" dir="ltr">
                      +974 {b.phone}
                    </p>
                  </div>
                </div>
                <a
                  href={`tel:+974${b.phone}`}
                  className="rounded-full border border-primary px-4 py-2 text-xs font-bold text-primary"
                >
                  {pick("اتصال", "Call")}
                </a>
              </div>
            ))}

            <div className="surface flex items-center gap-3 rounded-2xl p-4">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10">
                <Clock className="h-4 w-4 text-primary" aria-hidden />
              </span>
              <p className="text-sm font-semibold">{pick(CONTACT.hoursAr, CONTACT.hoursEn)}</p>
            </div>

            <a href={`mailto:${CONTACT.email}`} className="surface flex items-center gap-3 rounded-2xl p-4">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10">
                <Mail className="h-4 w-4 text-primary" aria-hidden />
              </span>
              <p className="text-sm font-semibold" dir="ltr">
                {CONTACT.email}
              </p>
            </a>

            <a
              href={CONTACT.instagram}
              target="_blank"
              rel="noreferrer"
              className="surface flex items-center gap-3 rounded-2xl p-4"
            >
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10">
                <Instagram className="h-4 w-4 text-primary" aria-hidden />
              </span>
              <p className="text-sm font-semibold" dir="ltr">
                @origami.qa
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
            {pick("اطلب حساب مطعمك", "Request your restaurant account")}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {pick(
              "املأ البيانات وسيتواصل فريقنا لإنشاء حسابك وفروعك.",
              "Fill in your details and our team will set up your account and branches.",
            )}
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
