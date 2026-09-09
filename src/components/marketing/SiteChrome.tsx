import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronDown, Instagram, Mail, Menu, Phone, X } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { CONTACT } from "@/lib/marketing";
import logo from "@/assets/origami-logo.jpg.asset.json";

const NAV = [
  { to: "/business" as const, ar: "الرئيسية", en: "Home" },
  { to: "/business/features" as const, ar: "المزايا", en: "Features" },
  { to: "/business/pricing" as const, ar: "الأسعار", en: "Pricing" },
  { to: "/business/contact" as const, ar: "تواصل معنا", en: "Contact" },
];

const ACCESS = [
  { to: "/admin" as const, ar: "المسؤول العام", en: "Platform admin" },
  { to: "/owner" as const, ar: "مالك المطعم", en: "Restaurant owner" },
  { to: "/auth" as const, ar: "فريق الفرع", en: "Branch team" },
  { to: "/" as const, ar: "تطبيق العملاء", en: "Customer app" },
];

export function SiteHeader() {
  const { pick, toggle } = useI18n();
  const { theme, toggle: toggleTheme } = useTheme();
  const [openNav, setOpenNav] = useState(false);
  const [openAccess, setOpenAccess] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-3">
        <Link to="/business" className="flex items-center gap-2.5">
          <img
            src={logo.url}
            alt="Origami Platform"
            width={36}
            height={36}
            className="h-9 w-9 rounded-xl border border-border bg-white object-contain p-0.5"
          />
          <span className="font-display text-base font-bold">
            {pick("منصة أوريغامي", "Origami Platform")}
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              activeOptions={{ exact: n.to === "/business" }}
              activeProps={{ className: "bg-accent text-accent-foreground" }}
              className="rounded-full px-3.5 py-2 text-sm font-semibold text-muted-foreground transition hover:text-foreground"
            >
              {pick(n.ar, n.en)}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            aria-label={theme === "light" ? "Dark mode" : "Light mode"}
            className="rounded-full border border-border px-3 py-1.5 text-xs"
          >
            {theme === "light" ? "🌙" : "☀️"}
          </button>
          <button
            onClick={toggle}
            className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold"
          >
            {pick("English", "العربية")}
          </button>

          <div className="relative hidden sm:block">
            <button
              onClick={() => setOpenAccess((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-full bg-[image:var(--gradient-brass)] px-4 py-2 text-xs font-bold text-primary-foreground"
            >
              {pick("دخول المنصة", "Sign in")}
              <ChevronDown className="h-3.5 w-3.5" aria-hidden />
            </button>
            {openAccess ? (
              <div
                className="surface absolute end-0 mt-2 w-52 overflow-hidden rounded-2xl p-1.5"
                onMouseLeave={() => setOpenAccess(false)}
              >
                {ACCESS.map((a) => (
                  <Link
                    key={a.to}
                    to={a.to}
                    onClick={() => setOpenAccess(false)}
                    className="block rounded-xl px-3 py-2 text-sm font-semibold hover:bg-accent"
                  >
                    {pick(a.ar, a.en)}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>

          <button
            onClick={() => setOpenNav((v) => !v)}
            aria-label="Menu"
            className="rounded-full border border-border p-2 md:hidden"
          >
            {openNav ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {openNav ? (
        <div className="border-t border-border px-5 py-3 md:hidden">
          <div className="grid gap-1">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setOpenNav(false)}
                className="rounded-xl px-3 py-2 text-sm font-semibold"
              >
                {pick(n.ar, n.en)}
              </Link>
            ))}
          </div>
          <p className="mt-3 px-3 text-[11px] font-bold uppercase text-muted-foreground">
            {pick("دخول المنصة", "Sign in")}
          </p>
          <div className="grid gap-1">
            {ACCESS.map((a) => (
              <Link
                key={a.to}
                to={a.to}
                onClick={() => setOpenNav(false)}
                className="rounded-xl px-3 py-2 text-sm text-muted-foreground"
              >
                {pick(a.ar, a.en)}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </header>
  );
}

export function SiteFooter() {
  const { pick } = useI18n();
  return (
    <footer className="border-t border-border bg-card/40">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2.5">
            <img
              src={logo.url}
              alt=""
              width={32}
              height={32}
              className="h-8 w-8 rounded-lg border border-border bg-white object-contain p-0.5"
            />
            <span className="font-display font-bold">{pick("منصة أوريغامي", "Origami Platform")}</span>
          </div>
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            {pick(
              "منصة طلب ذكية للمطاعم والدرايف ثرو في قطر.",
              "A smart ordering platform for restaurants and drive-thrus in Qatar.",
            )}
          </p>
          <p className="mt-3 text-xs text-muted-foreground">{pick(CONTACT.hoursAr, CONTACT.hoursEn)}</p>
        </div>

        <div>
          <p className="font-display text-sm font-bold">{pick("الموقع", "Website")}</p>
          <div className="mt-3 grid gap-2 text-sm text-muted-foreground">
            {NAV.map((n) => (
              <Link key={n.to} to={n.to} className="hover:text-foreground">
                {pick(n.ar, n.en)}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <p className="font-display text-sm font-bold">{pick("تواصل", "Get in touch")}</p>
          <div className="mt-3 grid gap-2 text-sm text-muted-foreground">
            {CONTACT.branches.map((b) => (
              <a key={b.phone} href={`tel:+974${b.phone}`} className="flex items-center gap-2 hover:text-foreground">
                <Phone className="h-3.5 w-3.5" aria-hidden />
                <span dir="ltr">{b.phone}</span>
                <span className="text-xs">· {pick(b.ar, b.en)}</span>
              </a>
            ))}
            <a href={`mailto:${CONTACT.email}`} className="flex items-center gap-2 hover:text-foreground">
              <Mail className="h-3.5 w-3.5" aria-hidden />
              <span dir="ltr">{CONTACT.email}</span>
            </a>
            <a
              href={CONTACT.instagram}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 hover:text-foreground"
            >
              <Instagram className="h-3.5 w-3.5" aria-hidden />
              origami.qa
            </a>
          </div>
        </div>
      </div>
      <div className="border-t border-border py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Origami Platform
      </div>
    </footer>
  );
}

export function SectionTitle({
  eyebrow,
  title,
  subtitle,
  className,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  className?: string;
}) {
  return (
    <div className={cn("max-w-2xl", className)}>
      {eyebrow ? (
        <span className="text-xs font-bold uppercase tracking-widest text-primary">{eyebrow}</span>
      ) : null}
      <h2 className="mt-2 font-display text-2xl font-bold md:text-3xl">{title}</h2>
      {subtitle ? <p className="mt-3 text-sm text-muted-foreground md:text-base">{subtitle}</p> : null}
    </div>
  );
}
