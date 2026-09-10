import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  BellOff,
  Car,
  CheckCircle2,
  ChefHat,
  Clock,
  LogOut,
  MapPin,
  Navigation,
  PackageCheck,
  Phone,
  Timer,
  Wallet,
  Wifi,
  WifiOff,
} from "lucide-react";
import { formatKm } from "@/lib/geo";
import { Modal } from "@/components/console/Modal";
import { toast } from "sonner";
import {
  useLiveOrders,
  useStaffBranch,
  setOrderStatus,
  minutesSince,
  type LiveOrder,
} from "@/components/staff/useLiveOrders";
import { useBranchInfo } from "@/components/staff/useBranchInfo";
import { useNewOrderAlert } from "@/components/staff/useNewOrderAlert";
import { useI18n, money } from "@/lib/i18n";
import { LanguageToggle } from "@/components/customer/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/kitchen")({
  head: () => ({
    meta: [
      { title: "Kitchen display — Origami Qatar" },
      { name: "description", content: "Live kitchen display for drive-thru order preparation." },
      { property: "og:title", content: "Kitchen display — Origami Qatar" },
      { property: "og:description", content: "Live kitchen display for order preparation." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: KitchenPage,
});

const FLOW = ["RECEIVED", "PREPARING", "READY", "COMPLETED"] as const;

/** Transitions the database guard accepts. Keep in sync with `order_status_guard`. */
const ALLOWED: Record<string, string[]> = {
  DRAFT: ["PENDING_PAYMENT", "RECEIVED", "CANCELLED"],
  PENDING_PAYMENT: ["PAID", "PAYMENT_FAILED", "CANCELLED"],
  PAYMENT_FAILED: ["PENDING_PAYMENT", "CANCELLED"],
  PAID: ["RECEIVED", "CANCELLED", "REFUNDED"],
  RECEIVED: ["ACCEPTED", "PREPARING", "CANCELLED"],
  ACCEPTED: ["PREPARING", "CANCELLED"],
  PREPARING: ["QUALITY_CHECK", "READY", "CANCELLED"],
  QUALITY_CHECK: ["READY", "PREPARING", "CANCELLED"],
  READY: ["ARRIVING", "PICKED_UP", "COMPLETED", "CANCELLED"],
  ARRIVING: ["PICKED_UP", "COMPLETED", "CANCELLED"],
  PICKED_UP: ["COMPLETED"],
  COMPLETED: ["REFUNDED"],
  CANCELLED: [],
  REFUNDED: [],
};

/** Preferred one-tap next step for each live status. */
const NEXT_STEP: Record<string, string> = {
  PAID: "RECEIVED",
  RECEIVED: "PREPARING",
  ACCEPTED: "PREPARING",
  PREPARING: "READY",
  QUALITY_CHECK: "READY",
  READY: "COMPLETED",
  ARRIVING: "COMPLETED",
  PICKED_UP: "COMPLETED",
};

function nextOf(status: string): string | null {
  const next = NEXT_STEP[status];
  if (!next) return null;
  return (ALLOWED[status] ?? []).includes(next) ? next : null;
}

const COLUMNS = [
  {
    status: "RECEIVED",
    match: ["RECEIVED", "PAID", "ACCEPTED"],
    accent: "text-primary",
    dot: "bg-primary",
  },
  {
    status: "PREPARING",
    match: ["PREPARING", "QUALITY_CHECK"],
    accent: "text-warning",
    dot: "bg-warning",
  },
  {
    status: "READY",
    match: ["READY", "ARRIVING", "PICKED_UP"],
    accent: "text-success",
    dot: "bg-success",
  },
] as const;

function en(n: number | string) {
  return String(n);
}

function KitchenPage() {
  const { t, pick, lang } = useI18n();
  const staff = useStaffBranch();
  const branchId = staff.data?.branch_id ?? null;
  const orders = useLiveOrders(branchId);
  const branch = useBranchInfo(branchId);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [now, setNow] = useState(() => new Date());
  const [online, setOnline] = useState(true);
  const [detail, setDetail] = useState<LiveOrder | null>(null);

  // Live "new order" notification: fires as soon as an order lands, no refresh.
  const alerts = useNewOrderAlert(orders.data, (fresh) => {
    for (const o of fresh) {
      toast.success(
        pick(`طلب جديد · ${o.order_number}`, `New order · ${o.order_number}`),
        { duration: 8000 },
      );
    }
  });

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 15_000);
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    setOnline(navigator.onLine);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("online", up);
      window.removeEventListener("offline", down);
    };
  }, []);

  const advance = async (order: LiveOrder, next: string) => {
    if (next === order.status) return;
    if (!(ALLOWED[order.status] ?? []).includes(next)) {
      toast.error(
        pick(
          `لا يمكن تحويل الطلب من ${statusText(order.status, t as never)} إلى ${statusText(next, t as never)}`,
          `Cannot move this order from ${statusText(order.status, t as never)} to ${statusText(next, t as never)}`,
        ),
      );
      return;
    }
    try {
      await setOrderStatus(order.id, next);
      // Move the card to its new column immediately, then reconcile with the server.
      queryClient.setQueryData<LiveOrder[]>(["live-orders", branchId], (prev) =>
        prev
          ? prev.map((o) =>
              o.id === order.id
                ? {
                    ...o,
                    status: next,
                    ready_at: next === "READY" ? new Date().toISOString() : o.ready_at,
                  }
                : o,
            )
          : prev,
      );
      queryClient.invalidateQueries({ queryKey: ["live-orders", branchId] });
      queryClient.invalidateQueries({ queryKey: ["owner-orders"] });
      queryClient.invalidateQueries({ queryKey: ["client-orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin-orders-feed"] });
      setDetail((d) => (d && d.id === order.id ? { ...d, status: next } : d));
      toast.success(pick("تم تحديث حالة الطلب", "Order status updated"));

    } catch (e) {
      const msg = (e as { message?: string })?.message ?? "";
      toast.error(
        /transition/i.test(msg)
          ? pick("لا يمكن تنفيذ هذا التغيير للحالة", "That status change is not allowed")
          : msg || t("somethingWrong"),
      );
    }
  };

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  const all = orders.data ?? [];
  const startOfDay = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }, [now]);

  const doneToday = all.filter(
    (o) => o.status === "COMPLETED" && new Date(o.created_at).getTime() >= startOfDay,
  );
  const active = all.filter((o) => o.status !== "COMPLETED" && o.status !== "CANCELLED");
  const arrived = active.filter((o) => o.customer_arrived).length;
  const avgPrep = (() => {
    const done = doneToday.filter((o) => o.ready_at);
    if (!done.length) return null;
    const sum = done.reduce(
      (acc, o) =>
        acc + (new Date(o.ready_at!).getTime() - new Date(o.created_at).getTime()) / 60_000,
      0,
    );
    return Math.max(0, Math.round(sum / done.length));
  })();
  const salesToday = doneToday.reduce((acc, o) => acc + Number(o.total ?? 0), 0);

  const rest = branch.data?.restaurants ?? null;
  const clock = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  const day = now.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const live = online && !orders.isError;

  return (
    <div className="min-h-screen bg-console-canvas p-3 sm:p-5">
      {/* Header */}
      <header className="overflow-hidden rounded-[28px] bg-console-rail text-console-rail-foreground shadow-lift">
        <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-7">
          <div className="flex items-center gap-4">
            <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl bg-white/10">
              {branch.data?.logo_url || rest?.logo_url ? (
                <img
                  src={(branch.data?.logo_url || rest?.logo_url) as string}
                  alt={rest ? pick(rest.name_ar, rest.name_en) : "logo"}
                  className="h-full w-full object-cover"
                />
              ) : (
                <ChefHat className="h-6 w-6" aria-hidden />
              )}
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-60">
                {t("kitchen")}
              </p>
              <h1 className="font-display text-2xl font-bold leading-tight">
                {rest ? pick(rest.name_ar, rest.name_en) : "—"}
              </h1>
              <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs opacity-75">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" aria-hidden />
                  {branch.data
                    ? pick(branch.data.name_ar, branch.data.name_en)
                    : (pick(staff.data?.branches?.name_ar, staff.data?.branches?.name_en) ??
                      t("branch"))}
                </span>
                {branch.data?.code ? (
                  <span dir="ltr" className="rounded-full bg-white/10 px-2 py-0.5 font-mono">
                    {branch.data.code}
                  </span>
                ) : null}
                {branch.data?.phone ? (
                  <a
                    href={`tel:${branch.data.phone}`}
                    dir="ltr"
                    className="inline-flex items-center gap-1 hover:opacity-100"
                  >
                    <Phone className="h-3.5 w-3.5" aria-hidden />
                    {branch.data.phone}
                  </a>
                ) : null}
                {branch.data ? (
                  <span dir="ltr" className="inline-flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" aria-hidden />
                    {branch.data.opens_at?.slice(0, 5)} – {branch.data.closes_at?.slice(0, 5)}
                  </span>
                ) : null}
              </p>
              {branch.data?.address_en || branch.data?.address_ar ? (
                <p className="mt-1 text-[11px] opacity-60">
                  {pick(branch.data.address_ar, branch.data.address_en)}
                  {branch.data.city_en || branch.data.city_ar
                    ? ` · ${pick(branch.data.city_ar, branch.data.city_en)}`
                    : ""}
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-white/10 px-4 py-2 text-right">
              <p dir="ltr" className="font-display text-2xl font-bold leading-none">
                {clock}
              </p>
              <p dir="ltr" className="mt-1 text-[10px] opacity-70">
                {day}
              </p>
            </div>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold",
                live ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive",
              )}
            >
              {live ? (
                <Wifi className="h-3.5 w-3.5" aria-hidden />
              ) : (
                <WifiOff className="h-3.5 w-3.5" aria-hidden />
              )}
              {live ? pick("متصل مباشر", "Live") : pick("غير متصل", "Offline")}
            </span>
            <button
              type="button"
              onClick={() =>
                alerts.soundOn && !alerts.needsGesture
                  ? alerts.setSound(false)
                  : void alerts.enableSound()
              }
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold transition",
                alerts.soundOn && !alerts.needsGesture
                  ? "bg-success/20 text-success"
                  : "bg-white/10 text-console-rail-foreground/80 hover:bg-white/20",
              )}
            >
              {alerts.soundOn && !alerts.needsGesture ? (
                <Bell className="h-3.5 w-3.5" aria-hidden />
              ) : (
                <BellOff className="h-3.5 w-3.5" aria-hidden />
              )}
              {alerts.soundOn && !alerts.needsGesture
                ? pick("التنبيه الصوتي مفعّل", "Sound on")
                : pick("تفعيل التنبيه الصوتي", "Enable sound")}
            </button>
            <LanguageToggle />
            <button
              onClick={signOut}
              className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold transition hover:bg-white/20"
            >
              <LogOut className="h-3.5 w-3.5" aria-hidden />
              {t("signOut")}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-px bg-white/10 sm:grid-cols-5">
          {[
            { label: pick("طلبات نشطة", "Active"), value: en(active.length), icon: ChefHat },
            {
              label: pick("جاهز للاستلام", "Ready"),
              value: en(all.filter((o) => o.status === "READY").length),
              icon: PackageCheck,
            },
            { label: pick("العميل وصل", "Arrived"), value: en(arrived), icon: Car },
            {
              label: pick("مكتمل اليوم", "Done today"),
              value: en(doneToday.length),
              icon: CheckCircle2,
            },
            {
              label: pick("متوسط التحضير", "Avg prep"),
              value: avgPrep == null ? "—" : `${en(avgPrep)}m`,
              icon: Timer,
            },
          ].map((s) => (
            <div key={s.label} className="bg-console-rail px-5 py-3">
              <p className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider opacity-60">
                <s.icon className="h-3.5 w-3.5" aria-hidden />
                {s.label}
              </p>
              <p dir="ltr" className="mt-1 font-display text-xl font-bold">
                {s.value}
              </p>
            </div>
          ))}
        </div>
      </header>

      {/* Board */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {COLUMNS.map((col) => {
          const items = active.filter((o) => (col.match as readonly string[]).includes(o.status));
          return (
            <section
              key={col.status}
              className="rounded-[26px] border border-border/60 bg-card/70 p-3 shadow-sm backdrop-blur"
            >
              <div className="mb-3 flex items-center justify-between px-2 pt-1">
                <h2
                  className={cn(
                    "inline-flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wide",
                    col.accent,
                  )}
                >
                  <span className={cn("h-2 w-2 rounded-full", col.dot)} aria-hidden />
                  {col.status === "RECEIVED"
                    ? t("received")
                    : col.status === "PREPARING"
                      ? t("preparing")
                      : t("ready")}
                </h2>
                <span
                  dir="ltr"
                  className="rounded-full bg-foreground/5 px-2.5 py-0.5 text-xs font-bold"
                >
                  {en(items.length)}
                </span>
              </div>
              <ul className="space-y-3">
                {items.map((o) => (
                  <OrderCard
                    key={o.id}
                    order={o}
                    next={nextOf(o.status)}
                    onDetails={() => setDetail(o)}
                    onAdvance={() => {
                      const n = nextOf(o.status);
                      if (n) advance(o, n);
                    }}
                    onStatus={(s) => advance(o, s)}
                  />
                ))}
                {!items.length && (
                  <li className="rounded-2xl border border-dashed border-border/70 py-12 text-center text-xs text-muted-foreground">
                    {pick("لا توجد طلبات", "No orders")}
                  </li>
                )}
              </ul>
            </section>
          );
        })}
      </div>

      {/* Completed today */}
      <section className="mt-4 rounded-[26px] border border-border/60 bg-card/70 p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="inline-flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wide text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-success" aria-hidden />
            {pick("طلبات مكتملة اليوم", "Completed today")}
          </h2>
          <span dir="ltr" className="text-xs font-bold text-muted-foreground">
            {en(doneToday.length)} · {money(salesToday, lang)}
          </span>
        </div>
        {doneToday.length ? (
          <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {doneToday
              .slice()
              .reverse()
              .map((o) => (
                <li key={o.id}>
                  <button
                    onClick={() => setDetail(o)}
                    className="flex w-full items-center justify-between gap-2 rounded-2xl border border-border/60 bg-background px-3 py-2.5 text-start transition hover:border-success/40 hover:bg-accent"
                  >
                    <span>
                      <span className="block font-display text-sm font-bold">{o.order_number}</span>
                      <span dir="ltr" className="block text-[11px] text-muted-foreground">
                        {new Date(o.created_at).toLocaleTimeString("en-GB", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </span>
                    <span className="text-xs font-bold text-success">{money(o.total, lang)}</span>
                  </button>
                </li>
              ))}
          </ul>
        ) : (
          <p className="py-8 text-center text-xs text-muted-foreground">
            {pick("لا توجد طلبات مكتملة بعد", "No completed orders yet")}
          </p>
        )}
      </section>

      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title={detail ? `${t("orderDetails")} · ${detail.order_number}` : t("orderDetails")}
        {...(detail?.customer_name ? { subtitle: detail.customer_name } : {})}
      >
        {detail ? (
          <div className="space-y-4">
            <StatusFlow status={detail.status} />

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-elevated/60 p-3">
                <p className="text-[11px] font-bold text-muted-foreground">{t("timeSinceOrder")}</p>
                <p dir="ltr" className="mt-1 font-display text-lg font-bold">
                  {en(minutesSince(detail.created_at))} {t("minutes")}
                </p>
              </div>
              <div className="rounded-2xl bg-elevated/60 p-3">
                <p className="text-[11px] font-bold text-muted-foreground">{t("waitingAtBranch")}</p>
                <p className="mt-1 font-display text-lg font-bold">
                  {detail.arrived_at
                    ? `${en(minutesSince(detail.arrived_at))} ${t("minutes")}`
                    : t("notArrivedYet")}
                </p>
              </div>
            </div>

            <div className="rounded-2xl bg-elevated/60 p-3">
              <p className="inline-flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground">
                <Wallet className="h-3.5 w-3.5" aria-hidden />
                {t("paymentDetails")}
              </p>
              <p className="mt-1 font-display text-lg font-bold">{money(detail.total, lang)}</p>
              <p className="text-xs text-muted-foreground">
                {detail.payment_method === "PAY_AT_PICKUP"
                  ? t("payAtPickup")
                  : detail.payment_method === "APPLE_PAY"
                    ? t("applePay")
                    : t("card")}{" "}
                · {detail.payment_status === "PAID" ? t("paid") : t("pending")} · {t("subtotal")}{" "}
                {money(detail.subtotal, lang)} + {t("tax")} {money(detail.tax, lang)}
              </p>
            </div>

            <div className="rounded-2xl bg-elevated/60 p-3">
              <p className="inline-flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground">
                <Navigation className="h-3.5 w-3.5" aria-hidden />
                {t("customerLocation")}
              </p>
              {detail.customer_arrived ? (
                <p className="mt-1 inline-flex items-center gap-1 text-sm font-bold text-success">
                  <Car className="h-4 w-4" aria-hidden />
                  {t("customerArrived")}
                </p>
              ) : detail.distance_km != null ? (
                <p dir="ltr" className="mt-1 text-sm font-bold text-primary">
                  {formatKm(Number(detail.distance_km), lang === "ar" ? "ar" : "en")} ·{" "}
                  {detail.eta_minutes ?? "—"} {t("minutes")} {t("away")}
                </p>
              ) : (
                <p className="mt-1 text-sm text-muted-foreground">{t("noLocation")}</p>
              )}
            </div>

            {detail.customer_phone ? (
              <a
                href={`tel:${detail.customer_phone}`}
                className="flex items-center gap-2 rounded-2xl border border-border p-3 text-sm font-bold transition hover:bg-accent"
              >
                <Phone className="h-4 w-4 text-primary" aria-hidden />
                <span dir="ltr">{detail.customer_phone}</span>
              </a>
            ) : null}

            {detail.vehicle_snapshot ? (
              <p className="rounded-2xl border border-border p-3 text-sm">
                <Car className="me-1 inline h-4 w-4 text-primary" aria-hidden />
                {[detail.vehicle_snapshot.make, detail.vehicle_snapshot.model]
                  .filter(Boolean)
                  .join(" ")}{" "}
                · {detail.vehicle_snapshot.color} · {detail.vehicle_snapshot.plate}
              </p>
            ) : null}

            <ul className="space-y-1.5 rounded-2xl bg-elevated/60 p-3 text-sm">
              {detail.order_items.map((item) => (
                <li key={item.id}>
                  <span className="font-bold text-primary">{en(item.quantity)}×</span>{" "}
                  {pick(item.name_ar, item.name_en)}
                  {item.order_item_modifiers.length ? (
                    <span className="block text-[11px] text-muted-foreground">
                      {item.order_item_modifiers.map((m) => pick(m.name_ar, m.name_en)).join(" • ")}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>

            {detail.notes ? (
              <p className="rounded-xl bg-warning/10 p-2.5 text-xs text-warning">{detail.notes}</p>
            ) : null}

            {nextOf(detail.status) ? (
              <button
                onClick={() => advance(detail, nextOf(detail.status)!)}
                className="w-full rounded-full bg-primary py-3 text-sm font-bold text-primary-foreground transition hover:opacity-90"
              >
                {statusText(nextOf(detail.status)!, t)}
              </button>
            ) : null}
          </div>
        ) : null}
      </Modal>
    </div>
  );
}


function statusText(s: string, _t?: unknown) {
  void _t;
  const isEn = typeof document !== "undefined" && document.documentElement.lang === "en";
  return orderStatusLabel(s, (ar, en2) => (isEn ? en2 : ar));
}


function StatusFlow({ status, compact = false }: { status: string; compact?: boolean }) {
  const { t } = useI18n();
  const idx = Math.max(0, FLOW.indexOf(status as (typeof FLOW)[number]));
  return (
    <ol className={cn("flex items-center gap-1.5", compact ? "" : "rounded-2xl bg-elevated/60 p-3")}>
      {FLOW.map((s, i) => {
        const done = i <= idx;
        return (
          <li key={s} className="flex flex-1 items-center gap-1.5">
            <div className="flex-1">
              <div
                className={cn(
                  "h-1.5 rounded-full transition-colors",
                  done ? (i === idx ? "bg-primary" : "bg-primary/50") : "bg-foreground/10",
                )}
              />
              {compact ? null : (
                <p
                  className={cn(
                    "mt-1.5 text-[10px] font-bold",
                    done ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {statusText(s, t as never)}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function OrderCard({
  order: o,
  next,
  onDetails,
  onAdvance,
  onStatus,
}: {
  order: LiveOrder;
  next: string | null;
  onDetails: () => void;
  onAdvance: () => void;
  onStatus: (s: string) => void;
}) {
  const { t, pick, lang } = useI18n();
  const age = minutesSince(o.created_at);
  const target = o.target_prep_minutes ?? 8;
  const urgency = age >= target ? "late" : age >= target - 2 ? "soon" : "ok";

  return (
    <li
      className={cn(
        "group rounded-[22px] border bg-card p-3.5 shadow-sm transition hover:shadow-lift",
        o.status === "RECEIVED"
          ? "order-glow-new"
          : "order-glow-progress",
        o.status !== "RECEIVED" &&
          (urgency === "late"
            ? "border-destructive/60"
            : urgency === "soon"
              ? "border-warning/60"
              : ""),
      )}
    >
      <div
        className="flex cursor-pointer items-start justify-between gap-2"
        role="button"
        tabIndex={0}
        onClick={onDetails}
        onKeyDown={(e) => e.key === "Enter" && onDetails()}
      >
        <div>
          <span className="font-display text-lg font-bold">{o.order_number}</span>
          {o.customer_name ? (
            <span className="block text-[11px] text-muted-foreground">{o.customer_name}</span>
          ) : null}
        </div>
        <span
          dir="ltr"
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-bold",
            urgency === "late"
              ? "bg-destructive/10 text-destructive"
              : urgency === "soon"
                ? "bg-warning/10 text-warning"
                : "bg-foreground/5 text-muted-foreground",
          )}
        >
          <Clock className="h-3.5 w-3.5" aria-hidden />
          {age} {t("minutes")}
        </span>
      </div>

      <div className="mt-2.5">
        <StatusFlow status={o.status} compact />
      </div>

      {o.customer_arrived ? (
        <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-[11px] font-bold text-success">
          <Car className="h-3 w-3" aria-hidden />
          {t("customerArrived")}
        </p>
      ) : o.distance_km != null ? (
        <p
          dir="ltr"
          className="mt-2 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary"
        >
          <Navigation className="h-3 w-3" aria-hidden />
          {formatKm(Number(o.distance_km), lang === "ar" ? "ar" : "en")} · {o.eta_minutes ?? "—"}{" "}
          {t("minutes")}
        </p>
      ) : null}

      <ul className="mt-2.5 space-y-1 text-sm">
        {o.order_items.map((item) => (
          <li key={item.id}>
            <span className="font-bold text-primary">{item.quantity}×</span>{" "}
            {pick(item.name_ar, item.name_en)}
            {item.order_item_modifiers.length ? (
              <span className="block text-[11px] text-muted-foreground">
                {item.order_item_modifiers.map((m) => pick(m.name_ar, m.name_en)).join(" • ")}
              </span>
            ) : null}
          </li>
        ))}
      </ul>

      {o.notes ? (
        <p className="mt-2 rounded-lg bg-warning/10 p-2 text-[11px] text-warning">{o.notes}</p>
      ) : null}

      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={onDetails}
          className="rounded-full border border-border bg-background px-3 py-2.5 text-xs font-bold transition hover:bg-accent"
        >
          {t("details")}
        </button>
        {next ? (
          <button
            onClick={onAdvance}
            className="flex-1 rounded-full bg-primary py-2.5 text-sm font-bold text-primary-foreground transition hover:opacity-90"
          >
            {statusText(next, t as never)}
          </button>
        ) : null}
        <select
          aria-label={pick("تغيير حالة الطلب", "Change order status")}
          value={o.status}
          onChange={(e) => onStatus(e.target.value)}
          className="rounded-full border border-border bg-background px-2 py-2.5 text-xs font-bold outline-none"
        >
          <option value={o.status}>{statusText(o.status, t as never)}</option>
          {(ALLOWED[o.status] ?? []).map((s) => (
            <option key={s} value={s}>
              {statusText(s, t as never)}
            </option>
          ))}
        </select>
      </div>
    </li>
  );
}
