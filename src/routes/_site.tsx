import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { SiteFooter, SiteHeader } from "@/components/marketing/SiteChrome";

export const Route = createFileRoute("/_site")({
  component: MarketingLayout,
});

function MarketingLayout() {
  const { dir } = useI18n();
  return (
    <div dir={dir} className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main>
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  );
}
