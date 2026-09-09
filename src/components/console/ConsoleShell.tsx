import { useState, type ComponentType, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { LogOut, Menu, X } from "lucide-react";
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
 * Luxury side-navigation shell shared by the admin and owner consoles.
 * Sidebar is permanent from `lg` up and slides over on smaller screens.
 */
export function ConsoleShell({
  title,
  subtitle,
  items,
  active,
  onSelect,
  quickLinks = [],
  children,
}: {
  title: string;
  subtitle: string;
  items: ConsoleNavItem[];
  active: string;
  onSelect: (id: string) => void;
  quickLinks?: ConsoleQuickLink[];
  children: ReactNode;
}) {
  const { pick } = useI18n();
  const [open, setOpen] = useState(false);
  const current = items.find((i) => i.id === active);

  const nav = (
    <div className="flex h-full flex-col gap-6 p-5">
      <div>
        <p className="font-display text-lg font-bold leading-tight">{title}</p>
        <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{subtitle}</p>
      </div>

      <nav className="flex flex-col gap-1.5">
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
              className={cn(
                "group relative flex items-center gap-3 rounded-2xl px-3.5 py-3 text-start text-sm font-semibold transition",
                isActive
                  ? "bg-[image:var(--gradient-brass)] text-primary-foreground shadow-lg shadow-primary/20"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              <item.icon className="h-4.5 w-4.5 shrink-0" aria-hidden />
              <span className="flex-1 leading-tight">
                {item.label}
                {item.hint ? (
                  <span
                    className={cn(
                      "block text-[10px] font-medium",
                      isActive ? "text-primary-foreground/75" : "text-muted-foreground/70",
                    )}
                  >
                    {item.hint}
                  </span>
                ) : null}
              </span>
              {item.badge ? (
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-bold",
                    isActive ? "bg-primary-foreground/20" : "bg-primary text-primary-foreground",
                  )}
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
        <div className="space-y-1.5 border-t border-border pt-4">
          <p className="px-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {pick("اختصارات", "Shortcuts")}
          </p>
          {quickLinks.map((q) => (
            <Link
              key={q.to}
              to={q.to}
              className="block rounded-xl px-3 py-2 text-xs font-semibold text-muted-foreground transition hover:bg-accent hover:text-foreground"
            >
              {q.label}
            </Link>
          ))}
        </div>
      ) : null}

      <button
        onClick={() => supabase.auth.signOut()}
        className="mt-auto inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2.5 text-xs font-semibold text-muted-foreground transition hover:bg-accent hover:text-foreground"
      >
        <LogOut className="h-3.5 w-3.5" aria-hidden />
        {pick("تسجيل الخروج", "Sign out")}
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 z-30 hidden w-[17rem] border-e border-border bg-elevated/70 backdrop-blur lg:block ltr:left-0 rtl:right-0">
        {nav}
      </aside>

      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            aria-label={pick("إغلاق", "Close")}
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
          />
          <aside className="absolute inset-y-0 w-[17rem] border-e border-border bg-background shadow-2xl ltr:left-0 rtl:right-0">
            <button
              onClick={() => setOpen(false)}
              aria-label={pick("إغلاق", "Close")}
              className="absolute top-4 z-10 rounded-full border border-border p-1.5 ltr:right-4 rtl:left-4"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
            {nav}
          </aside>
        </div>
      ) : null}

      <div className="lg:ms-[17rem]">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-border bg-background/85 px-4 py-3.5 backdrop-blur sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setOpen(true)}
              aria-label={pick("القائمة", "Menu")}
              className="rounded-xl border border-border p-2 lg:hidden"
            >
              <Menu className="h-4 w-4" aria-hidden />
            </button>
            <div>
              <h1 className="font-display text-lg font-bold leading-tight sm:text-xl">
                {current?.label ?? title}
              </h1>
              {current?.hint ? (
                <p className="text-[11px] text-muted-foreground">{current.hint}</p>
              ) : null}
            </div>
          </div>
          <LanguageToggle />
        </header>

        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
