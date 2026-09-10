import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { orderControlSettings, setOrderOverride } from "@/lib/owner.functions";

/**
 * Settings card that turns "change any order's status" on or off.
 * scope "admin" = platform-wide (super admin), scope "owner" = one restaurant.
 */
export function OrderOverrideCard({
  scope,
  restaurantId,
}: {
  scope: "admin" | "owner";
  restaurantId?: string | null;
}) {
  const { pick } = useI18n();
  const qc = useQueryClient();
  const rid = restaurantId ?? null;

  const settings = useQuery({
    queryKey: ["order-control", rid],
    queryFn: () => orderControlSettings({ data: { restaurantId: rid } }),
  });

  const enabled =
    scope === "admin" ? !!settings.data?.adminOverride : !!settings.data?.ownerOverride;

  const mutation = useMutation({
    mutationFn: (next: boolean) =>
      setOrderOverride({ data: { scope, enabled: next, restaurantId: rid } }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["order-control"] });
      toast.success(pick("تم حفظ الإعداد", "Setting saved"));
    },
    onError: () => toast.error(pick("تعذر حفظ الإعداد", "Could not save the setting")),
  });

  return (
    <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
      <p className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-primary">
        <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
        {pick("صلاحيات الطلبات", "Order permissions")}
      </p>
      <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-2xl">
          <h3 className="font-display text-xl font-bold">
            {pick("تغيير حالة أي طلب", "Change any order's status")}
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {scope === "admin"
              ? pick(
                  "عند التفعيل يستطيع مدير المنصة تغيير حالة أي طلب في أي فرع وأي مطعم.",
                  "When on, the platform admin can change the status of any order, in any branch of any restaurant.",
                )
              : pick(
                  "عند التفعيل يستطيع مالك المطعم تغيير حالة أي طلب في أي فرع من فروع مطعمه.",
                  "When on, the restaurant owner can change the status of any order in any branch of this restaurant.",
                )}
          </p>
        </div>
        <button
          type="button"
          disabled={settings.isLoading || mutation.isPending}
          onClick={() => mutation.mutate(!enabled)}
          aria-pressed={enabled}
          className={cn(
            "inline-flex h-11 shrink-0 items-center gap-3 rounded-full px-5 text-sm font-bold transition disabled:opacity-50",
            enabled
              ? "bg-primary text-primary-foreground"
              : "border border-border bg-elevated text-muted-foreground",
          )}
        >
          <span
            className={cn(
              "h-2.5 w-2.5 rounded-full",
              enabled ? "bg-primary-foreground" : "bg-muted-foreground",
            )}
          />
          {enabled ? pick("مفعّل", "Enabled") : pick("معطّل", "Disabled")}
        </button>
      </div>
    </section>
  );
}
