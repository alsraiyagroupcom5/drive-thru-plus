import { useState, type ComponentType, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Bell, Globe, LogOut, Menu, Search, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { LanguageToggle } from "@/components/customer/AppShell";
import { cn } from "@/lib/utils";

export type ConsoleNavItem = {
  id: string;
  label: string;
  hint?: string;
  icon: ComponentType<{ className?: string }>;
  badge?: number | null;
};

export type ConsoleQuickLink = { to: string; label: string };

/**
 * Dashboard frame: a dark floating rail on the side and a single light panel
 * for the page content. Shared by the admin and owner consoles.
 */
export function ConsoleShell({
  title,
  subtitle,
  items,
  active,
  onSelect,
  quickLinks = [],
  search,
  onSearchChange,
  searchPlaceholder,
  actions,
  aside,
  backTo,
  backLabel,
  secondary,
  secondaryTitle,
  children,
}: {
  title: string;
  subtitle: string;
  items: ConsoleNavItem[];
  active: string;
  onSelect: (id: string) => void;
  quickLinks?: ConsoleQuickLink[];
  search?: string;
  onSearchChange?: (v: string) => void;
  searchPlaceholder?: string;
  actions?: ReactNode;
  aside?: ReactNode;
  backTo?: string;
  backLabel?: string;
  secondary?: ReactNode;
  secondaryTitle?: string;
  children: ReactNode;
}) {
  const { pick } = useI18n();
  const [open, setOpen] = useState(false);
  const current = items.find((i) => i.id === active);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleSignOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  const rail = (
    <div className="flex h-full flex-col items-stretch gap-6 px-3 py-6 text-console-rail-foreground">
      <div className="px-2 text-center">
        <div className="mx-auto grid h-11 w-11 place-items-center rounded-2xl bg-console-rail-foreground/12 font-display text-base font-black">
          {title.trim().charAt(0)}
        </div>
        <p className="mt-2 truncate text-[10px] font-semibold text-console-rail-muted">{title}</p>
      </div>

      <nav className="flex flex-1 flex-col gap-1.5 overflow-y-auto hide-scrollbar">
        {items.map((item) => {
          const isActive = item.id === active;
          return (
            <button
              key={item.id}
              onClick={() => {
                onSelect(item.id);
                setOpen(false);
              }}
              aria-current={isActive ? "page" : undefined}
              title={item.label}
              className={cn(
                "relative flex flex-col items-center gap-1.5 rounded-2xl px-1.5 py-3 text-[10px] font-semibold leading-tight transition",
                isActive
                  ? "bg-console-rail-foreground text-console-rail shadow-lg"
                  : "text-console-rail-muted hover:bg-console-rail-foreground/10 hover:text-console-rail-foreground",
              )}
            >
              <item.icon className="h-5 w-5" aria-hidden />
              <span className="line-clamp-2 text-center">{item.label}</span>
              {item.badge ? (
                <span
                  className="absolute top-1.5 rounded-full bg-primary px-1.5 text-[9px] font-bold text-primary-foreground ltr:right-1.5 rtl:left-1.5"
                  dir="ltr"
                >
                  {item.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>

      {quickLinks.length ? (
        <div className="space-y-1 border-t border-console-rail-foreground/15 pt-3">
          {quickLinks.map((q) => (
            <Link
              key={q.to}
              to={q.to}
              className="block truncate rounded-xl px-2 py-1.5 text-center text-[10px] font-semibold text-console-rail-muted transition hover:bg-console-rail-foreground/10 hover:text-console-rail-foreground"
            >
              {q.label}
            </Link>
          ))}
        </div>
      ) : null}

      <button
        onClick={() => void handleSignOut()}
        title={pick("تسجيل الخروج", "Sign out")}
        className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-console-rail-foreground/12 text-console-rail-foreground transition hover:bg-console-rail-foreground/25"
      >
        <LogOut className="h-4 w-4" aria-hidden />
        <span className="sr-only">{pick("تسجيل الخروج", "Sign out")}</span>
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-console-canvas p-0 lg:p-4">
      <div className="flex gap-4">
        <aside className="sticky top-4 hidden h-[calc(100vh-2rem)] w-24 shrink-0 rounded-3xl bg-console-rail shadow-lift lg:block">
          {rail}
        </aside>

        {open ? (
          <div className="fixed inset-0 z-40 lg:hidden">
            <button
              aria-label={pick("إغلاق", "Close")}
              onClick={() => setOpen(false)}
              className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
            />
            <aside className="absolute inset-y-0 w-28 bg-console-rail shadow-2xl ltr:left-0 rtl:right-0">
              <button
                onClick={() => setOpen(false)}
                aria-label={pick("إغلاق", "Close")}
                className="absolute top-3 z-10 rounded-full bg-console-rail-foreground/15 p-1.5 text-console-rail-foreground ltr:right-3 rtl:left-3"
              >
                <X className="h-3.5 w-3.5" aria-hidden />
              </button>
              {rail}
            </aside>
          </div>
        ) : null}

        <div className="min-w-0 flex-1 lg:flex lg:gap-4">
          <main className="min-w-0 flex-1 rounded-none bg-card shadow-soft lg:rounded-3xl">
            <header className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-4 sm:px-6">
              <button
                onClick={() => setOpen(true)}
                aria-label={pick("القائمة", "Menu")}
                className="rounded-xl border border-border p-2 lg:hidden"
              >
                <Menu className="h-4 w-4" aria-hidden />
              </button>

              <div className="min-w-0 flex-1">
                {backTo ? (
                  <Link to={backTo} className="text-[11px] font-semibold text-primary hover:underline">
                    ← {backLabel ?? pick("رجوع", "Back")}
                  </Link>
                ) : null}
                <h1 className="truncate font-display text-lg font-bold leading-tight sm:text-xl">
                  {current?.label ?? title}
                </h1>
                <p className="truncate text-[11px] text-muted-foreground">
                  {current?.hint ?? subtitle}
                </p>
              </div>

              {onSearchChange ? (
                <label className="relative hidden items-center sm:flex">
                  <Search
                    className="pointer-events-none absolute h-4 w-4 text-muted-foreground ltr:left-3 rtl:right-3"
                    aria-hidden
                  />
                  <input
                    value={search ?? ""}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder={searchPlaceholder ?? pick("بحث…", "Search…")}
                    className="h-10 w-52 rounded-full border border-border bg-elevated text-sm outline-none ring-ring/40 focus:ring-2 ltr:pl-9 ltr:pr-4 rtl:pr-9 rtl:pl-4"
                  />
                </label>
              ) : null}

              {actions}

              <a
                href="/"
                target="_blank"
                rel="noreferrer"
                title={pick("معاينة الموقع", "Preview website")}
                aria-label={pick("معاينة الموقع", "Preview website")}
                className="grid h-10 w-10 place-items-center rounded-full border border-border text-muted-foreground transition hover:text-foreground"
              >
                <Globe className="h-4 w-4" aria-hidden />
              </a>
              <button
                className="grid h-10 w-10 place-items-center rounded-full border border-border text-muted-foreground"
                aria-label={pick("التنبيهات", "Notifications")}
              >
                <Bell className="h-4 w-4" aria-hidden />
              </button>
              <LanguageToggle />
            </header>

            {secondary ? (
              <div className="border-b border-border bg-elevated/40 px-4 py-3 sm:px-6">
                {secondaryTitle ? (
                  <p className="pb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {secondaryTitle}
                  </p>
                ) : null}
                <div className="overflow-x-auto pb-1">{secondary}</div>
              </div>
            ) : null}

            <div className="px-4 py-5 sm:px-6">{children}</div>
          </main>

          {aside ? (
            <aside className="w-full shrink-0 rounded-3xl bg-card p-4 shadow-soft xl:w-80 xl:sticky xl:top-4 xl:h-[calc(100vh-2rem)] xl:overflow-y-auto">
              {aside}
            </aside>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/** Coloured status chip used above dashboard lists. */
export function StatusChip({
  label,
  count,
  tone = "neutral",
  active,
  onClick,
}: {
  label: string;
  count?: number;
  tone?: "neutral" | "warning" | "info" | "success" | "danger";
  active?: boolean;
  onClick?: () => void;
}) {
  const tones: Record<string, string> = {
    neutral: "bg-muted text-muted-foreground",
    warning: "bg-warning/15 text-warning",
    info: "bg-primary/12 text-primary",
    success: "bg-success/15 text-success",
    danger: "bg-destructive/12 text-destructive",
  };
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition",
        tones[tone],
        active ? "ring-2 ring-ring/60" : "opacity-80 hover:opacity-100",
      )}
    >
      {label}
      {count !== undefined ? (
        <span className="rounded-full bg-card/70 px-1.5 text-[10px]" dir="ltr">
          {count}
        </span>
      ) : null}
    </button>
  );
}
