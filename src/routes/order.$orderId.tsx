import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { Check, Car, ChefHat, PackageCheck, Receipt } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/customer/AppShell";
import { useI18n, money } from "@/lib/i18n";
import { useCustomerAuth } from "@/lib/customer-auth";
import { announceArrival, getOrder } from "@/lib/customer.functions";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/order/$orderId")({
  head: () => ({
    meta: [
      { title: "Track your order — MASAR Grill" },
      { name: "description", content: "Live status of your drive-thru order and pickup code." },
      { property: "og:title", content: "Track your order — MASAR Grill" },
      { property: "og:description", content: "Live status and pickup code for your order." },
    ],
  }),
  component: TrackPage,
});

const STEPS = ["RECEIVED", "PREPARING", "READY", "COMPLETED"] as const;

function TrackPage() {
  const { orderId } = Route.useParams();
  const { t, pick, lang } = useI18n();
  const { session, ready } = useCustomerAuth();
  const queryClient = useQueryClient();

  const order = useQuery({
    queryKey: ["order", orderId],
    queryFn: () => getOrder({ data: { token: session!.token, orderId } }),
    enabled: !!session?.token,
    refetchInterval: 15_000,
  });

  useEffect(() => {
    const channel = supabase
      .channel(`order-${orderId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${orderId}` },
        () => queryClient.invalidateQueries({ queryKey: ["order", orderId] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, queryClient]);

  const arrive = useMutation({
    mutationFn: () => announceArrival({ data: { token: session!.token, orderId } }),
    onSuccess: () => {
      toast.success(t("arrivalNotified"));
      queryClient.invalidateQueries({ queryKey: ["order", orderId] });
    },
  });

  if (ready && !session) {
    return (
      <AppShell>
        <div className="px-5 py-24 text-center">
          <p className="font-display text-lg font-semibold">{t("somethingWrong")}</p>
          <Link to="/menu" className="mt-4 inline-block text-sm text-primary underline">
            {t("viewMenu")}
          </Link>
        </div>
      </AppShell>
    );
  }

  if (order.isLoading || !order.data) {
    return (
      <AppShell>
        <div className="space-y-3 p-5">
          <Skeleton className="h-40 w-full rounded-3xl" />
          <Skeleton className="h-52 w-full rounded-3xl" />
        </div>
      </AppShell>
    );
  }

  const o = order.data;
  const cancelled = o.status === "CANCELLED";
  const activeIndex = STEPS.indexOf(o.status as (typeof STEPS)[number]);
  const eta = Math.max(
    0,
    Math.round(
      (new Date(o.created_at).getTime() + (o.target_prep_minutes ?? 8) * 60_000 - Date.now()) /
        60_000,
    ),
  );

  return (
    <AppShell
      header={
        <header className="border-b border-border px-5 pb-3 pt-6">
          <h1 className="font-display text-2xl font-bold">{t("trackOrder")}</h1>
        </header>
      }
    >
      <section className="animate-rise mx-5 mt-4 rounded-3xl bg-[image:var(--gradient-brass)] p-6 text-center text-primary-foreground shadow-[var(--shadow-lift)]">
        <p className="text-xs font-semibold opacity-80">{t("orderNumber")}</p>
        <p className="font-display text-4xl font-bold tracking-wider">{o.order_number}</p>
        <div className="mt-4 rounded-2xl bg-black/20 p-3">
          <p className="text-[11px] opacity-80">{t("pickupCode")}</p>
          <p dir="ltr" className="font-display text-2xl font-bold tracking-[0.35em]">
            {o.pickup_code}
          </p>
        </div>
        {!cancelled && o.status !== "COMPLETED" && (
          <p className="mt-3 text-sm font-semibold">
            {t("estimatedReady")}: {eta} {t("minutes")}
          </p>
        )}
      </section>

      <section className="mx-5 mt-5">
        <ol className="space-y-3">
          {STEPS.map((step, i) => {
            const done = !cancelled && i <= activeIndex;
            const Icon = [Receipt, ChefHat, PackageCheck, Check][i]!;
            const label = [t("received"), t("preparing"), t("ready"), t("pickedUp")][i]!;
            return (
              <li key={step} className="flex items-center gap-3">
                <span
                  className={cn(
                    "grid h-10 w-10 shrink-0 place-items-center rounded-full border transition-colors",
                    done
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-elevated text-muted-foreground",
                    i === activeIndex && !cancelled && "animate-pulse-glow",
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <span
                  className={cn(
                    "text-sm font-semibold",
                    done ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {label}
                </span>
              </li>
            );
          })}
        </ol>
      </section>

      {o.status === "READY" || o.status === "PREPARING" ? (
        <section className="mx-5 mt-6">
          <button
            onClick={() => arrive.mutate()}
            disabled={o.customer_arrived || arrive.isPending}
            className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-primary py-4 font-display text-base font-bold text-primary disabled:opacity-60"
          >
            <Car className="h-5 w-5" aria-hidden />
            {o.customer_arrived ? t("arrivalNotified") : t("imHere")}
          </button>
        </section>
      ) : null}

      <section className="surface mx-5 mt-6 rounded-2xl p-4">
        <h2 className="font-display text-base font-semibold">{t("orders")}</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {o.order_items.map((item) => (
            <li key={item.id} className="flex items-start justify-between gap-3">
              <span>
                <span className="font-semibold">{item.quantity}×</span>{" "}
                {pick(item.name_ar, item.name_en)}
                {item.order_item_modifiers?.length ? (
                  <span className="block text-[11px] text-muted-foreground">
                    {item.order_item_modifiers
                      .map((m) => pick(m.name_ar, m.name_en))
                      .join(" • ")}
                  </span>
                ) : null}
              </span>
              <span className="shrink-0 text-muted-foreground">
                {money(Number(item.line_total), lang)}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
          <span className="font-display font-semibold">{t("total")}</span>
          <span className="font-display text-lg font-bold text-primary">
            {money(Number(o.total), lang)}
          </span>
        </div>
      </section>
    </AppShell>
  );
}
