import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { siteContentQuery, useSite } from "@/lib/site-content";
import { cn } from "@/lib/utils";
import { SiteFooter, SiteHeader } from "@/components/marketing/SiteChrome";

export const Route = createFileRoute("/_site")({
  loader: ({ context }) => context.queryClient.ensureQueryData(siteContentQuery),
  component: MarketingLayout,
});

function MarketingLayout() {
  const { dir } = useI18n();
  const site = useSite();
  return (
    <div dir={dir} className={cn("min-h-screen bg-background text-foreground", site.theme === "luxury" && "spring-public")}>
      <SiteHeader />
      <main>
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  );
}
