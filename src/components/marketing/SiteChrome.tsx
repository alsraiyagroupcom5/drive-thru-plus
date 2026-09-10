import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { ChevronDown, Instagram, Mail, Menu, Moon, Phone, Sun, X } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { useSite } from "@/lib/site-content";
import logo from "@/assets/qr-spring-logo.png.asset.json";

type SiteLinkProps = {
  to: string;
  className?: string;
  children: ReactNode;
  onClick?: () => void;
  activeOptions?: { exact?: boolean };
  activeProps?: { className?: string };
};

/** Link that accepts an admin-editable path string. */
export function SiteLink(props: SiteLinkProps) {
  const L = Link as unknown as (p: SiteLinkProps) => ReactNode;
  return <L {...props} />;
}

export function SiteHeader() {
  const { pick, toggle } = useI18n();
  const { theme, toggle: toggleTheme } = useTheme();
  const site = useSite();
  const [openNav, setOpenNav] = useState(false);
  const [openAccess, setOpenAccess] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const logoUrl = site.brand.logoUrl ?? logo.url;
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const luxury = site.theme === "luxury" && pathname === "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!openNav) return;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [openNav]);

  return (
    <header className={cn(luxury ? "luxury-nav" : "sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur", scrolled && luxury && "is-scrolled")}>
      <div className={cn("flex items-center justify-between gap-3", luxury ? "luxury-shell min-h-[76px]" : "mx-auto max-w-6xl px-5 py-3")}>
        <Link to="/" className="flex items-center gap-2">
          <img
            src={logoUrl}
            alt={pick(site.brand.name.ar, site.brand.name.en)}
            width={site.brand.logoWidth}
            height={site.brand.logoHeight}
            style={{ width: site.brand.logoWidth, height: site.brand.logoHeight }}
            className={cn("object-contain", luxury && "luxury-nav-logo")}
          />
          {site.brand.showName ? (
            <span className="font-display text-lg font-bold">
              {pick(site.brand.name.ar, site.brand.name.en)}
            </span>
          ) : null}
        </Link>

        <nav className={cn("hidden items-center md:flex", luxury ? "luxury-nav-links" : "gap-1")}>
          {site.nav.map((n) => (
            <SiteLink
              key={n.to}
              to={n.to}
              activeOptions={{ exact: n.to === "/" }}
              {...(!luxury ? { activeProps: { className: "bg-accent text-accent-foreground" } } : {})}
              className={luxury ? "luxury-nav-link" : "rounded-full px-3.5 py-2 text-sm font-semibold text-muted-foreground transition hover:text-foreground"}
            >
              {pick(n.label.ar, n.label.en)}
            </SiteLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            aria-label={theme === "light" ? "Dark mode" : "Light mode"}
            className={cn("rounded-full border p-2", luxury ? "border-luxury-hairline text-luxury-ink" : "border-border")}
          >
            {theme === "light" ? (
              <Moon className="h-4 w-4" aria-hidden />
            ) : (
              <Sun className="h-4 w-4" aria-hidden />
            )}
          </button>
          <button
            onClick={toggle}
            className={cn("rounded-full border px-3 py-1.5 text-xs font-semibold", luxury ? "border-luxury-hairline text-luxury-ink" : "border-border")}
          >
            {pick("English", "العربية")}
          </button>

          <div className="relative hidden sm:block">
            <button
              onClick={() => setOpenAccess((v) => !v)}
              className={cn("inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold", luxury ? "luxury-nav-cta" : "rounded-full bg-[image:var(--gradient-brass)] text-primary-foreground")}
            >
              {pick("دخول المنصة", "Sign in")}
              <ChevronDown className="h-3.5 w-3.5" aria-hidden />
            </button>
            {openAccess ? (
              <div
                className={cn("absolute end-0 mt-2 w-52 overflow-hidden p-1.5", luxury ? "luxury-access-menu" : "surface rounded-2xl")}
                onMouseLeave={() => setOpenAccess(false)}
              >
                {site.access.map((a) => (
                  <SiteLink
                    key={a.to}
                    to={a.to}
                    onClick={() => setOpenAccess(false)}
                    className="block rounded-xl px-3 py-2 text-sm font-semibold hover:bg-accent"
                  >
                    {pick(a.label.ar, a.label.en)}
                  </SiteLink>
                ))}
              </div>
            ) : null}
          </div>

          <button
            onClick={() => setOpenNav((v) => !v)}
            aria-label="Menu"
            className={cn("rounded-full border p-2 md:hidden", luxury ? "border-luxury-hairline text-luxury-ink" : "border-border")}
          >
            {openNav ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {openNav ? (
        <div className={cn("px-5 py-3 md:hidden", luxury ? "luxury-mobile-sheet" : "border-t border-border")}>
          <div className="grid gap-1">
            {site.nav.map((n) => (
              <SiteLink
                key={n.to}
                to={n.to}
                onClick={() => setOpenNav(false)}
                className="rounded-xl px-3 py-2 text-sm font-semibold"
              >
                {pick(n.label.ar, n.label.en)}
              </SiteLink>
            ))}
          </div>
          <p className="mt-3 px-3 text-[11px] font-bold uppercase text-muted-foreground">
            {pick("دخول المنصة", "Sign in")}
          </p>
          <div className="grid gap-1">
            {site.access.map((a) => (
              <SiteLink
                key={a.to}
                to={a.to}
                onClick={() => setOpenNav(false)}
                className="rounded-xl px-3 py-2 text-sm text-muted-foreground"
              >
                {pick(a.label.ar, a.label.en)}
              </SiteLink>
            ))}
          </div>
        </div>
      ) : null}
    </header>
  );
}

export function SiteFooter() {
  const { pick } = useI18n();
  const site = useSite();
  const logoUrl = site.brand.logoUrl ?? logo.url;
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const luxury = site.theme === "luxury" && pathname === "/";
  return (
    <footer className={cn("border-t", luxury ? "luxury-footer" : "border-border bg-card/40")}>
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 md:grid-cols-3">
        <div>
          <div className="flex items-center">
            <img
              src={logoUrl}
              alt=""
              width={site.brand.logoWidth}
              height={site.brand.logoHeight}
              style={{ width: site.brand.logoWidth, height: site.brand.logoHeight }}
              className="object-contain"
            />
          </div>
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            {pick(site.footer.tagline.ar, site.footer.tagline.en)}
          </p>
          <p className="mt-3 text-xs text-muted-foreground">
            {pick(site.contact.hours.ar, site.contact.hours.en)}
          </p>
        </div>

        <div>
          <p className="font-display text-sm font-bold">
            {pick(site.footer.websiteTitle.ar, site.footer.websiteTitle.en)}
          </p>
          <div className="mt-3 grid gap-2 text-sm text-muted-foreground">
            {site.nav.map((n) => (
              <SiteLink key={n.to} to={n.to} className="hover:text-foreground">
                {pick(n.label.ar, n.label.en)}
              </SiteLink>
            ))}
          </div>
        </div>

        <div>
          <p className="font-display text-sm font-bold">
            {pick(site.footer.contactTitle.ar, site.footer.contactTitle.en)}
          </p>
          <div className="mt-3 grid gap-2 text-sm text-muted-foreground">
            {site.contact.branches.map((b) => (
              <a
                key={b.phone}
                href={`tel:+974${b.phone}`}
                className="flex items-center gap-2 hover:text-foreground"
              >
                <Phone className="h-3.5 w-3.5" aria-hidden />
                <span dir="ltr">{b.phone}</span>
                <span className="text-xs">· {pick(b.name.ar, b.name.en)}</span>
              </a>
            ))}
            <a
              href={`mailto:${site.contact.email}`}
              className="flex items-center gap-2 hover:text-foreground"
            >
              <Mail className="h-3.5 w-3.5" aria-hidden />
              <span dir="ltr">{site.contact.email}</span>
            </a>
            <a
              href={site.contact.instagram}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 hover:text-foreground"
            >
              <Instagram className="h-3.5 w-3.5" aria-hidden />
              {site.contact.instagramLabel}
            </a>
          </div>
        </div>
      </div>
      <div className="border-t border-border py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {pick(site.footer.copyright.ar, site.footer.copyright.en)}
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
