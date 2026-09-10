import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { Check, Car, ChefHat, PackageCheck, Receipt, MapPin, Navigation } from "lucide-react";
import { useArrivalTracker } from "@/components/customer/useArrivalTracker";
import {
  ReadyAlertOverlay,
  ReadySoundToggle,
  useReadyAlert,
} from "@/components/customer/ReadyAlert";
import { formatKm } from "@/lib/geo";

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
      { title: "Track your order — Origami Qatar" },
      { name: "description", content: "Live status of your drive-thru order and pickup code." },
      { property: "og:title", content: "Track your order — Origami Qatar" },
      { property: "og:description", content: "Live status and pickup code for your order." },
    ],
  }),
  component: TrackPage,
});

const STEPS = ["RECEIVED", "PREPARING", "READY", "COMPLETED"] as const;

function TrackPage() {
  const { orderId } = Route.useParams();
  const { t, pick, lang } = useI18n();
  const { session, ready, signOut } = useCustomerAuth();
  const queryClient = useQueryClient();

  const order = useQuery({
    queryKey: ["order", orderId],
    queryFn: () => getOrder({ data: { token: session!.token, orderId } }),
    enabled: !!session?.token,
    retry: false,
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

  const orderStatus = order.data?.status;
  const trackable =
    !!orderStatus && ["RECEIVED", "ACCEPTED", "PREPARING", "QUALITY_CHECK", "READY"].includes(orderStatus);

  const tracker = useArrivalTracker({
    enabled: trackable && !!session?.token,
    token: session?.token,
    orderId,
    onArrived: () => {
      toast.success(t("arrivalNotified"));
      queryClient.invalidateQueries({ queryKey: ["order", orderId] });
    },
  });

  const expired =
    order.isError &&
    order.error instanceof Error &&
    /UNAUTHENTICATED|ORDER_NOT_FOUND/.test(order.error.message);

  if ((ready && !session) || expired) {
    return (
      <AppShell>
        <div className="px-5 py-24 text-center">
          <p className="font-display text-lg font-semibold">
            {pick("سجّل دخولك برقم جوالك لعرض هذا الطلب", "Sign in with your phone to view this order")}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {pick(
              "انتهت جلستك أو أن هذا الطلب لحساب آخر.",
              "Your session expired, or this order belongs to another account.",
            )}
          </p>
          <div className="mt-5 flex flex-col items-center gap-3">
            <Link
              to="/checkout"
              onClick={() => signOut()}
              className="rounded-full bg-[image:var(--gradient-brass)] px-6 py-3 text-sm font-bold text-primary-foreground"
            >
              {pick("تسجيل الدخول", "Sign in")}
            </Link>
            <Link to="/menu" className="text-sm text-primary underline">
              {t("viewMenu")}
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  if (order.isError) {
    return (
      <AppShell>
        <div className="px-5 py-24 text-center">
          <p className="font-display text-lg font-semibold">{t("somethingWrong")}</p>
          <button
            onClick={() => order.refetch()}
            className="mt-4 rounded-full border border-primary px-6 py-2.5 text-sm font-semibold text-primary"
          >
            {t("tryAgain")}
          </button>
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

      {trackable ? (
        <section className="mx-5 mt-6 overflow-hidden rounded-3xl border border-border bg-elevated shadow-[var(--shadow-lift)]">
          <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3">
            <p className="inline-flex items-center gap-2 font-display text-sm font-bold">
              <Navigation className="h-4 w-4 text-primary" aria-hidden />
              {t("liveTracking")}
            </p>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold",
                o.customer_arrived || tracker.arrived
                  ? "bg-success/15 text-success"
                  : tracker.status === "tracking"
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground",
              )}
            >
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  o.customer_arrived || tracker.arrived
                    ? "bg-success"
                    : tracker.status === "tracking"
                      ? "animate-pulse bg-primary"
                      : "bg-muted-foreground",
                )}
              />
              {o.customer_arrived || tracker.arrived ? t("atTheBranch") : t("trackingOn")}
            </span>
          </div>

          <div className="grid grid-cols-2 divide-x divide-border rtl:divide-x-reverse">
            <div className="px-5 py-4">
              <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 text-primary" aria-hidden />
                {t("distanceToBranch")}
              </p>
              <p dir="ltr" className="mt-1 font-display text-2xl font-bold">
                {(tracker.distanceKm ?? (o.distance_km != null ? Number(o.distance_km) : null)) !=
                null
                  ? formatKm(
                      tracker.distanceKm ?? Number(o.distance_km),
                      lang === "ar" ? "ar" : "en",
                    )
                  : "—"}
              </p>
            </div>
            <div className="px-5 py-4">
              <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Car className="h-3.5 w-3.5 text-primary" aria-hidden />
                {t("arrivalEta")}
              </p>
              <p dir="ltr" className="mt-1 font-display text-2xl font-bold">
                {(tracker.etaMinutes ?? o.eta_minutes) != null
                  ? `${tracker.etaMinutes ?? o.eta_minutes} ${t("minutes")}`
                  : "—"}
              </p>
            </div>
          </div>

          {tracker.status === "denied" || !tracker.supported ? (
            <p className="border-t border-border bg-warning/10 px-5 py-3 text-[11px] font-semibold text-warning">
              {t("locationDenied")}
            </p>
          ) : null}

          <div className="px-5 pb-5 pt-1">
            <button
              onClick={() => arrive.mutate()}
              disabled={o.customer_arrived || arrive.isPending}
              className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-primary py-3.5 font-display text-base font-bold text-primary disabled:opacity-60"
            >
              <Car className="h-5 w-5" aria-hidden />
              {o.customer_arrived ? t("arrivalNotified") : t("imHere")}
            </button>
          </div>
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
