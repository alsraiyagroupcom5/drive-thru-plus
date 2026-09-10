import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { restaurantBySlugQuery } from "@/lib/restaurant-link";
import { useI18n } from "@/lib/i18n";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/$restaurant/$branch")({
  head: () => ({
    meta: [{ title: "Origami Qatar — Branch" }, { name: "robots", content: "noindex" }],
  }),
  component: BranchRedirect,
});

/** Pretty link /restaurant/branch → opens the ordering app with the branch preselected. */
function BranchRedirect() {
  const { restaurant: slug, branch: code } = Route.useParams();
  const { pick } = useI18n();
  const navigate = useNavigate();
  const { data, isLoading } = useQuery(restaurantBySlugQuery(slug));

  const exists = data?.branches.some((b) => b.code === code) ?? false;

  useEffect(() => {
    if (!data || !exists) return;
    navigate({ to: "/app", search: { branch: code }, replace: true });
  }, [data, exists, code, navigate]);

  if (!isLoading && data && !exists) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
        <h1 className="text-xl font-bold">{pick("الفرع غير موجود", "Branch not found")}</h1>
        <button
          onClick={() => navigate({ to: "/$restaurant", params: { restaurant: slug } })}
          className="rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground"
        >
          {pick("عرض كل الفروع", "View all branches")}
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 px-5 py-16">
      <Skeleton className="h-8 w-64 rounded-full" />
      <Skeleton className="h-40 rounded-3xl" />
      <Skeleton className="h-40 rounded-3xl" />
    </div>
  );
}
