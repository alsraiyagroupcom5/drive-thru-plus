import { Link, useRouterState } from "@tanstack/react-router";
import { Home, UtensilsCrossed, ShoppingBag, ReceiptText, Languages, Moon, Sun } from "lucide-react";
import type { ReactNode } from "react";
import { useI18n } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { useCart } from "@/lib/cart";
import { cn } from "@/lib/utils";
import logo from "@/assets/qr-spring-logo.png.asset.json";

export function BrandMark({ className }: { className?: string }) {
  const { t } = useI18n();
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <img
        src={logo.url}
        alt="QR-Spring"
        width={40}
        height={40}
        className="h-10 w-10 rounded-xl border border-border bg-white object-contain p-0.5"
      />
      <span className="flex flex-col leading-tight">
        <span className="font-display text-lg font-semibold tracking-wide">{t("brandFull")}</span>
        <span className="text-[10px] text-muted-foreground">{t("tagline")}</span>
      </span>
    </div>
  );
}

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const { t } = useI18n();
  return (
    <button
      onClick={toggle}
      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-accent"
      aria-label={theme === "light" ? t("darkMode") : t("lightMode")}
    >
      {theme === "light" ? (
        <Moon className="h-4 w-4" aria-hidden />
      ) : (
        <Sun className="h-4 w-4" aria-hidden />
      )}
    </button>
  );
}

export function LanguageToggle() {
  const { t, toggle } = useI18n();
  return (
    <div className="flex items-center gap-2">
      <ThemeToggle />
      <button
        onClick={toggle}
        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-accent"
        aria-label="Switch language"
      >
        <Languages className="h-3.5 w-3.5" aria-hidden />
        {t("language")}
      </button>
    </div>
  );
}


export function AppShell({
  children,
  header,
  hideNav,
  branchCode,
}: {
  children: ReactNode;
  header?: ReactNode;
  hideNav?: boolean;
  branchCode?: string | null;
}) {
  const { t } = useI18n();
  const { count } = useCart();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const items = [
    { to: "/app", icon: Home, label: t("home") },
    { to: "/menu", icon: UtensilsCrossed, label: t("menu") },
    { to: "/cart", icon: ShoppingBag, label: t("cart"), badge: count },
    { to: "/orders", icon: ReceiptText, label: t("orders") },
  ] as const;

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col bg-background">
      {header}
      <main className={cn("flex-1", hideNav ? "pb-8" : "pb-28")}>{children}</main>
      {!hideNav && (
        <nav
          className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-2xl border-t border-border bg-card/95 backdrop-blur"
          aria-label="Main"
        >
          <ul className="grid grid-cols-4">
            {items.map((item) => {
              const active = item.to === "/app" ? pathname === "/app" : pathname.startsWith(item.to);
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    search={item.to === "/app" && branchCode ? { branch: branchCode } : {}}
                    className={cn(
                      "relative flex flex-col items-center gap-1 py-3 text-[11px] font-medium transition-colors",
                      active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <item.icon className="h-5 w-5" aria-hidden />
                    {item.label}
                    {"badge" in item && item.badge ? (
                      <span className="absolute top-1.5 ltr:right-1/4 rtl:left-1/4 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                        {item.badge}
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="h-[env(safe-area-inset-bottom)]" />
        </nav>
      )}
    </div>
  );
}
