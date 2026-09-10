import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ClipboardList,
  Clock,
  LayoutGrid,
  List,
  MapPin,
  Navigation,
  PackageCheck,
  RefreshCcw,
  RotateCcw,
  Store,
  Timer,
  Wallet,
  XCircle,
} from "lucide-react";
import { useI18n, money, formatDateTime } from "@/lib/i18n";
import { Modal } from "@/components/console/Modal";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  cancelOrder,
  orderControlSettings,
  reactivateOrder,
  resetOrder,
  updateOrderStatus,
} from "@/lib/owner.functions";
import { canCancel, isCancelled, nextStage, orderGlow, orderStatusLabel } from "@/lib/order-status";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


type Row = Record<string, unknown>;

const ORDER_FILTERS = ["ALL", "IN_PROGRESS", "READY", "COMPLETED", "CANCELLED"] as const;
type Filter = (typeof ORDER_FILTERS)[number];

const IN_PROGRESS_STATUSES = ["RECEIVED", "ACCEPTED", "PREPARING", "QUALITY_CHECK", "ARRIVING"];

const FLOW = ["RECEIVED", "ACCEPTED", "PREPARING", "QUALITY_CHECK", "READY", "COMPLETED"];

function statusLabel(status: string, pick: (ar: string, en: string) => string): string {
  return orderStatusLabel(status, pick);
}


function filterLabel(f: Filter, pick: (ar: string, en: string) => string): string {
  switch (f) {
    case "ALL":
      return pick("الكل", "All");
    case "IN_PROGRESS":
      return pick("قيد التنفيذ", "In progress");
    case "READY":
      return pick("جاهز", "Ready");
    case "COMPLETED":
      return pick("مكتمل", "Completed");
    case "CANCELLED":
      return pick("ملغي", "Cancelled");
  }
}

function matchesFilter(status: string, filter: Filter): boolean {
  if (filter === "ALL") return true;
  if (filter === "IN_PROGRESS") return IN_PROGRESS_STATUSES.includes(status);
  return status === filter;
}

/** Whole minutes between two moments (never negative). */
function minutesBetween(from?: unknown, to?: unknown): number | null {
  if (!from) return null;
  const start = new Date(String(from)).getTime();
  const end = to ? new Date(String(to)).getTime() : Date.now();
  if (Number.isNaN(start) || Number.isNaN(end)) return null;
  return Math.max(0, Math.round((end - start) / 60000));
}

function statusTone(status: string): string {
  if (status === "READY") return "bg-success/15 text-success";
  if (status === "CANCELLED") return "bg-destructive/12 text-destructive";
  if (status === "COMPLETED" || status === "PICKED_UP") return "bg-primary/12 text-primary";
  return "bg-elevated";
}

function TrackingBadge({ order }: { order: Row }) {
  const { pick } = useI18n();
  const status = order["status"] as string;
  if (!IN_PROGRESS_STATUSES.includes(status) && status !== "READY") return null;

  if (order["customer_arrived"]) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2.5 py-1 text-[10px] font-bold text-success">
        <MapPin className="h-3 w-3" aria-hidden />
        {pick("العميل وصل", "Customer arrived")}
      </span>
    );
  }
  const dist = order["distance_km"];
  if (dist != null) {
    const eta = order["eta_minutes"];
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold text-primary">
        <Navigation className="h-3 w-3" aria-hidden />
        <span dir="ltr">
          {Number(dist).toFixed(1)} {pick("كم", "km")}
          {eta != null ? ` · ~${eta} ${pick("د", "min")}` : ""}
        </span>
      </span>
    );
  }
  return null;
}

/** Compact timing line: minutes since placed and minutes taken to be ready. */
function TimingLine({ order }: { order: Row }) {
  const { pick } = useI18n();
  const status = order["status"] as string;
  const since = minutesBetween(order["created_at"]);
  const prep = minutesBetween(order["created_at"], order["ready_at"]);
  const done = status === "COMPLETED" || status === "PICKED_UP" || status === "CANCELLED";
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
      {!done && since != null ? (
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3 w-3" aria-hidden />
          {pick("منذ الطلب", "Since placed")} <span dir="ltr">{since} {pick("د", "min")}</span>
        </span>
      ) : null}
      {prep != null ? (
        <span className="inline-flex items-center gap-1">
          <PackageCheck className="h-3 w-3" aria-hidden />
          {pick("جاهز خلال", "Ready in")} <span dir="ltr">{prep} {pick("د", "min")}</span>
        </span>
      ) : null}
      {order["eta_minutes"] != null && !order["customer_arrived"] ? (
        <span className="inline-flex items-center gap-1">
          <Navigation className="h-3 w-3" aria-hidden />
          {pick("العميل يبعد", "Customer away")}{" "}
          <span dir="ltr">
            {String(order["eta_minutes"])} {pick("د", "min")}
          </span>
        </span>
      ) : null}
    </div>
  );
}

/**
 * Status override control. Visible only when the platform (admin) or the
 * restaurant (owner) has the feature enabled; the server re-checks it too.
 */
function OrderStatusControl({ order }: { order: Row }) {
  const { pick, lang } = useI18n();
  const qc = useQueryClient();
  const rid = (order["restaurant_id"] as string) ?? null;
  const status = order["status"] as string;
  // Live status for the dropdown: follows fresh data (realtime refetch) and
  // moves optimistically when the user picks a new status.
  const [current, setCurrent] = useState(status);
  useEffect(() => {
    setCurrent(status);
  }, [status, order["id"]]);

  const settings = useQuery({
    queryKey: ["order-control", rid],
    queryFn: () => orderControlSettings({ data: { restaurantId: rid } }),
    staleTime: 60_000,
  });

  const refreshAll = () => {
    for (const k of [
      "owner-orders",
      "admin-orders",
      "admin-orders-feed",
      "client-orders",
      "live-orders",
      "client-summary",
    ]) {
      qc.invalidateQueries({ queryKey: [k] });
    }
  };

  const mutation = useMutation({
    mutationFn: (next: string) =>
      updateOrderStatus({ data: { orderId: order["id"] as string, status: next, restaurantId: rid } }),
    onMutate: (next: string) => {
      // Move the dropdown instantly; the server confirms or we roll back.
      setCurrent(next);
    },
    onSuccess: () => {
      refreshAll();
      toast.success(pick("تم تحديث حالة الطلب", "Order status updated"));
    },
    onError: (e: unknown) => {
      const msg = (e as { message?: string })?.message ?? "";
      // Roll back the optimistic move; the card may hold a stale status
      // (another screen already moved the order), so refresh and explain.
      setCurrent(status);
      refreshAll();
      toast.error(
        msg.includes("INVALID_TRANSITION")
          ? pick(
              "تم تغيير حالة الطلب من شاشة أخرى. تم تحديث البيانات، حاول مرة أخرى.",
              "This order was already moved from another screen. Data refreshed — please try again.",
            )
          : msg.includes("OVERRIDE_DISABLED")
            ? pick("تغيير الحالة معطّل من الإعدادات", "Status override is disabled in settings")
            : msg.includes("FORBIDDEN")
              ? pick("لا تملك صلاحية لهذا الطلب", "You are not allowed to change this order")
              : pick("تعذّر تحديث حالة الطلب", "Could not update the order status"),
      );
    },
  });


  const resetMutation = useMutation({
    mutationFn: () => resetOrder({ data: { orderId: order["id"] as string } }),
    onSuccess: () => {
      setCurrent("RECEIVED");
      refreshAll();
      toast.success(pick("تمت إعادة ضبط الطلب كطلب جديد", "Order reset as a new order"));
    },
    onError: () => {
      refreshAll();
      toast.error(pick("تعذّر إعادة ضبط الطلب", "Could not reset the order"));
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => cancelOrder({ data: { orderId: order["id"] as string } }),
    onSuccess: () => {
      setCurrent("CANCELLED");
      refreshAll();
      toast.success(pick("تم إلغاء الطلب", "Order cancelled"));
    },
    onError: () => {
      refreshAll();
      toast.error(pick("تعذّر إلغاء الطلب", "Could not cancel the order"));
    },
  });

  const reactivateMutation = useMutation({
    mutationFn: () => reactivateOrder({ data: { orderId: order["id"] as string } }),
    onSuccess: () => {
      setCurrent("RECEIVED");
      refreshAll();
      toast.success(pick("تم تفعيل الطلب من جديد", "Order re-enabled"));
    },
    onError: () => {
      refreshAll();
      toast.error(pick("تعذّر تفعيل الطلب", "Could not re-enable the order"));
    },
  });

  const canReset = settings.data?.isSuperAdmin === true;
  const canChange = settings.data?.canChangeStatus === true;
  if (!canChange && !canReset) return null;

  const cancelled = isCancelled(current);
  const next = canChange && !cancelled ? nextStage(current) : null;
  const busy = mutation.isPending || cancelMutation.isPending || reactivateMutation.isPending;

  return (
    <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-primary">
            {pick("حالة الطلب", "Order status")}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {cancelled
              ? pick("هذا الطلب ملغي", "This order is cancelled")
              : pick("انقل الطلب إلى المرحلة التالية", "Move the order to the next stage")}
          </p>
        </div>
        <Select
          key={`${order["id"] as string}-${current}`}
          value={current}
          disabled={cancelled || !next || busy}
          onValueChange={(value) => mutation.mutate(value)}
        >
          <SelectTrigger
            className={cn(
              "h-10 w-full min-w-[12rem] rounded-full border-primary/30 bg-card px-4 text-xs font-bold text-primary shadow-none focus:ring-primary/30 disabled:opacity-70",
              cancelled && "border-destructive/30 text-destructive",
              lang === "ar" && "text-right",
            )}
          >
            <SelectValue placeholder={statusLabel(current, pick)} />
          </SelectTrigger>
          <SelectContent
            className="rounded-2xl border-primary/20 bg-card p-1.5 shadow-lift"
            position="popper"
            sideOffset={6}
          >
            {/* The real status is always shown (disabled) so the dropdown
                mirrors the order's live state. */}
            <SelectItem
              value={current}
              disabled
              className="rounded-xl text-xs font-bold text-primary opacity-100"
            >
              {statusLabel(current, pick)} · {pick("الحالية", "Current")}
            </SelectItem>
            {next ? (
              <SelectItem
                value={next}
                className="rounded-xl text-xs font-semibold focus:bg-primary/10 focus:text-primary"
              >
                {statusLabel(next, pick)}
              </SelectItem>
            ) : null}
          </SelectContent>
        </Select>
      </div>

      <div className="mt-3 flex flex-col gap-2 border-t border-primary/15 pt-3 sm:flex-row sm:items-center sm:justify-end">
        {cancelled ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => reactivateMutation.mutate()}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-full bg-[image:var(--gradient-brass)] px-4 text-xs font-bold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
          >
            <RefreshCcw className="h-3.5 w-3.5" aria-hidden />
            {pick("إعادة تفعيل الطلب", "Re-enable order")}
          </button>
        ) : canCancel(current) && canChange ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => cancelMutation.mutate()}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-full border border-destructive/40 bg-card px-4 text-xs font-bold text-destructive transition hover:bg-destructive/10 disabled:opacity-60"
          >
            <XCircle className="h-3.5 w-3.5" aria-hidden />
            {pick("إلغاء الطلب", "Cancel order")}
          </button>
        ) : null}
        {canReset && !cancelled ? (
          <button
            type="button"
            disabled={resetMutation.isPending}
            onClick={() => resetMutation.mutate()}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-full border border-primary/30 bg-card px-4 text-xs font-bold text-primary transition hover:bg-primary/10 disabled:opacity-60"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden />
            {pick("إعادة ضبط الطلب", "Reset order")}
          </button>
        ) : null}
      </div>
    </div>
  );
}


/** Full order detail popup: branch, timings, process steps, items and payment. */
export function OrderDetail({
  order,
  branchName,
  onClose,
}: {
  order: Row | null;
  branchName: string;
  onClose: () => void;
}) {
  const { pick, lang } = useI18n();
  if (!order) return null;
  const status = order["status"] as string;
  const items = (order["order_items"] as Row[]) ?? [];
  const since = minutesBetween(order["created_at"]);
  const prep = minutesBetween(order["created_at"], order["ready_at"]);
  const waitAtBranch = order["arrived_at"]
    ? minutesBetween(order["arrived_at"], order["completed_at"] ?? undefined)
    : null;
  const stepIndex = FLOW.indexOf(status === "PICKED_UP" ? "COMPLETED" : status);

  const facts: { ar: string; en: string; value: string }[] = [
    { ar: "الفرع", en: "Branch", value: branchName },
    {
      ar: "وقت الطلب",
      en: "Placed at",
      value: formatDateTime(order["created_at"] as string, lang),
    },
    {
      ar: "منذ الطلب",
      en: "Since placed",
      value: since != null ? `${since} ${pick("د", "min")}` : "—",
    },
    {
      ar: "زمن التجهيز",
      en: "Prep time",
      value: prep != null ? `${prep} ${pick("د", "min")}` : pick("قيد التحضير", "In progress"),
    },
    {
      ar: "المسافة",
      en: "Distance",
      value:
        order["distance_km"] != null
          ? `${Number(order["distance_km"]).toFixed(1)} ${pick("كم", "km")}`
          : "—",
    },
    {
      ar: "وصول العميل",
      en: "Customer ETA",
      value: order["customer_arrived"]
        ? pick("وصل", "Arrived")
        : order["eta_minutes"] != null
          ? `${String(order["eta_minutes"])} ${pick("د", "min")}`
          : "—",
    },
    {
      ar: "انتظار بالموقع",
      en: "Waiting at branch",
      value: waitAtBranch != null ? `${waitAtBranch} ${pick("د", "min")}` : "—",
    },
    {
      ar: "الدفع",
      en: "Payment",
      value: `${String(order["payment_status"] ?? "")} · ${String(order["payment_method"] ?? "")}`,
    },
  ];

  return (
    <Modal
      open
      onClose={onClose}
      title={`${pick("طلب", "Order")} ${String(order["order_number"] ?? "")}`}
      subtitle={`${branchName} · ${statusLabel(status, pick)}`}
    >
      <div className="space-y-5">
        <OrderStatusControl order={order} />

        {/* process */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {pick("مسار الطلب", "Order process")}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {FLOW.map((s, i) => (
              <span
                key={s}
                className={cn(
                  "rounded-full px-3 py-1.5 text-[10px] font-bold",
                  status === "CANCELLED"
                    ? "bg-muted text-muted-foreground"
                    : i <= stepIndex && stepIndex >= 0
                      ? "bg-primary text-primary-foreground"
                      : "bg-elevated text-muted-foreground",
                )}
              >
                {statusLabel(s, pick)}
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {facts.map((f) => (
            <div key={f.en} className="rounded-xl bg-elevated p-3">
              <p className="text-[10px] text-muted-foreground">{pick(f.ar, f.en)}</p>
              <p className="mt-1 text-sm font-bold" dir="ltr">
                {f.value}
              </p>
            </div>
          ))}
        </div>

        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {pick("الأصناف", "Items")}
          </p>
          <ul className="mt-2 divide-y divide-border rounded-xl border border-border">
            {items.map((i) => (
              <li key={i["id"] as string} className="flex items-center justify-between gap-3 px-3 py-2 text-xs">
                <span className="truncate">
                  <span dir="ltr">{String(i["quantity"])}×</span>{" "}
                  {pick(i["name_ar"] as string, i["name_en"] as string)}
                </span>
                <span dir="ltr" className="font-semibold">
                  {money(Number(i["line_total"] ?? i["unit_price"] ?? 0), lang)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex items-center justify-between border-t border-border pt-3">
          <span className="text-xs text-muted-foreground">
            {(order["customer_name"] as string) || pick("عميل", "Customer")}
            {order["customer_phone"] ? ` · ${String(order["customer_phone"])}` : ""}
          </span>
          <span className="font-display text-lg font-bold text-primary" dir="ltr">
            {money(Number(order["total"]), lang)}
          </span>
        </div>
      </div>
    </Modal>
  );
}

export function LatestOrdersGrid({
  branches,
  orders,
  limit = 8,
}: {
  branches: Row[];
  orders: Row[];
  limit?: number;
}) {
  const { pick, lang } = useI18n();
  const [detail, setDetail] = useState<Row | null>(null);
  const rows = orders.slice(0, limit);
  // Keep the open dialog on live data so status changes from any window
  // (realtime refetch) update the dropdown immediately.
  const liveDetail = detail
    ? (orders.find((o) => o["id"] === detail["id"]) ?? detail)
    : null;

  const branchName = (order: Row): string => {
    const branch = branches.find((item) => item["id"] === order["branch_id"]);
    const joined = order["branches"] as Row | null;
    const source = branch ?? joined;
    return source
      ? pick(source["name_ar"] as string, source["name_en"] as string)
      : pick("فرع", "Branch");
  };

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-3 border-b border-border pb-4">
        <div>
          <p className="text-xs font-bold uppercase text-primary">{pick("الطلبات", "Orders")}</p>
          <h2 className="mt-1 font-display text-xl font-bold">{pick("أحدث الطلبات", "Latest orders")}</h2>
        </div>
        <div className="rounded-xl bg-elevated px-3 py-2 text-center">
          <p className="text-[10px] text-muted-foreground">{pick("المعروضة", "Showing")}</p>
          <p className="font-display text-lg font-bold" dir="ltr">{rows.length}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {rows.map((order) => {
          const status = order["status"] as string;
          const items = (order["order_items"] as Row[]) ?? [];
          // Brand-new orders glow red; once the team moves them forward the
          // halo turns warm orange until the order is closed. Live status comes
          // from the realtime-refetched `orders` prop, so the color flips
          // without a refresh.
          return (
            <article
              key={order["id"] as string}
              className={cn(
                "surface flex min-h-44 flex-col rounded-2xl p-4 transition duration-300 hover:-translate-y-0.5 hover:shadow-lift",
                orderGlow(status),
              )}
            >
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 border-b border-border pb-3">
                <div className="min-w-0">
                  <p className="truncate font-display text-lg font-bold" dir="ltr">{order["order_number"] as string}</p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {branchName(order)} · {(order["customer_name"] as string) || pick("عميل", "Customer")}
                  </p>
                </div>
                <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold", statusTone(status))}>
                  {statusLabel(status, pick)}
                </span>
              </div>

              <div className="flex-1 py-3">
                <p className="text-xs text-muted-foreground">{formatDateTime(order["created_at"] as string, lang)}</p>
                {items.length ? (
                  <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                    {items.map((item) => `${item["quantity"]}× ${pick(item["name_ar"] as string, item["name_en"] as string)}`).join(" • ")}
                  </p>
                ) : null}
                <div className="mt-3 space-y-2">
                  <TrackingBadge order={order} />
                  <TimingLine order={order} />
                </div>
              </div>

              <div className="flex items-end justify-between gap-3 border-t border-border pt-3">
                <button
                  onClick={() => setDetail(order)}
                  className="rounded-full border border-border px-3 py-1.5 text-[11px] font-bold text-muted-foreground transition hover:border-primary/40 hover:text-primary"
                >
                  {pick("التفاصيل", "Details")}
                </button>
                <span className="font-display text-lg font-bold text-primary" dir="ltr">{money(Number(order["total"]), lang)}</span>
              </div>
            </article>
          );
        })}
      </div>

      {!rows.length ? (
        <div className="rounded-2xl border border-dashed border-border py-12 text-center">
          <ClipboardList className="mx-auto h-7 w-7 text-muted-foreground" aria-hidden />
          <p className="mt-3 text-sm font-semibold text-muted-foreground">{pick("لا توجد طلبات", "No orders")}</p>
        </div>
      ) : null}

      <OrderDetail order={liveDetail} branchName={liveDetail ? branchName(liveDetail) : ""} onClose={() => setDetail(null)} />
    </section>
  );
}

export function BranchOrdersTab({
  branches,
  orders,
  loading,
}: {
  branches: Row[];
  orders: Row[];
  loading?: boolean;
}) {
  const { pick, lang } = useI18n();
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("ALL");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [detail, setDetail] = useState<Row | null>(null);
  // Live order for the open dialog: follows realtime refetches from any window.
  const liveDetail = detail
    ? (orders.find((o) => o["id"] === detail["id"]) ?? detail)
    : null;

  const byBranch = useMemo(() => {
    const map = new Map<string, Row[]>();
    for (const o of orders) {
      const bid = o["branch_id"] as string;
      const list = map.get(bid) ?? [];
      list.push(o);
      map.set(bid, list);
    }
    return map;
  }, [orders]);

  const branchName = (o: Row): string => {
    const b = branches.find((x) => x["id"] === o["branch_id"]);
    const joined = o["branches"] as Row | null;
    if (b) return pick(b["name_ar"] as string, b["name_en"] as string);
    if (joined) return pick(joined["name_ar"] as string, joined["name_en"] as string);
    return pick("فرع", "Branch");
  };

  const selectedBranch = branches.find((b) => b["id"] === selectedBranchId) ?? null;

  /* ------------------------- branch cards grid ------------------------- */
  if (!selectedBranch) {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3 border-b border-border pb-5 sm:flex sm:flex-wrap sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase text-primary">
              {pick("الطلبات", "Orders")}
            </p>
            <h2 className="mt-1 font-display text-2xl font-bold">
              {pick("اختر الفرع", "Choose a branch")}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {pick(
                "افتح أي فرع لمتابعة طلباته وحالة وصول العملاء.",
                "Open a branch to track its orders and customer arrivals.",
              )}
            </p>
          </div>
          <div className="shrink-0 rounded-2xl border border-border bg-elevated px-4 py-3 text-end">
            <p className="text-[11px] text-muted-foreground">
              {pick("إجمالي الطلبات", "Total orders")}
            </p>
            <p className="font-display text-xl font-bold" dir="ltr">
              {orders.length}
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {branches.map((branch) => {
            const branchId = branch["id"] as string;
            const list = byBranch.get(branchId) ?? [];
            const active = list.filter((o) =>
              IN_PROGRESS_STATUSES.includes(o["status"] as string),
            );
            const ready = list.filter((o) => o["status"] === "READY");
            const arrived = list.filter(
              (o) =>
                o["customer_arrived"] &&
                (IN_PROGRESS_STATUSES.includes(o["status"] as string) ||
                  o["status"] === "READY"),
            );
            const revenue = list
              .filter((o) => o["status"] !== "CANCELLED")
              .reduce((sum, o) => sum + Number(o["total"] ?? 0), 0);
            const isOpen = Boolean(branch["is_open"]);
            return (
              <button
                key={branchId}
                onClick={() => setSelectedBranchId(branchId)}
                className="group overflow-hidden rounded-2xl border border-border bg-card text-start shadow-sm transition duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lift"
              >
                <div className="flex items-start justify-between gap-3 border-b border-border bg-elevated p-5">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
                    <Store className="h-5 w-5" aria-hidden />
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-3 py-1 text-[11px] font-bold",
                      isOpen ? "bg-success/15 text-success" : "bg-destructive/12 text-destructive",
                    )}
                  >
                    {isOpen ? pick("مفتوح", "Open") : pick("مغلق", "Closed")}
                  </span>
                </div>
                <div className="p-5">
                  <h3 className="font-display text-lg font-bold">
                    {pick(branch["name_ar"] as string, branch["name_en"] as string)}
                  </h3>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {pick(branch["address_ar"] as string | null ?? "", branch["address_en"] as string | null ?? "") ||
                      pick("لم يضف عنوان", "No address added")}
                  </p>

                  {arrived.length ? (
                    <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-success/15 px-3 py-1 text-[11px] font-bold text-success">
                      <MapPin className="h-3 w-3" aria-hidden />
                      <span dir="ltr">{arrived.length}</span>{" "}
                      {pick("عميل بالموقع", "customer at branch")}
                    </p>
                  ) : null}

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <div className="rounded-xl bg-elevated p-3">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Timer className="h-3.5 w-3.5" aria-hidden />
                        <span className="text-[10px]">{pick("قيد التنفيذ", "Active")}</span>
                      </div>
                      <p className="mt-1 font-display text-lg font-bold" dir="ltr">
                        {active.length}
                      </p>
                    </div>
                    <div className="rounded-xl bg-elevated p-3">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <PackageCheck className="h-3.5 w-3.5" aria-hidden />
                        <span className="text-[10px]">{pick("جاهز", "Ready")}</span>
                      </div>
                      <p className="mt-1 font-display text-lg font-bold" dir="ltr">
                        {ready.length}
                      </p>
                    </div>
                    <div className="rounded-xl bg-elevated p-3">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Wallet className="h-3.5 w-3.5" aria-hidden />
                        <span className="text-[10px]">{pick("المبيعات", "Sales")}</span>
                      </div>
                      <p className="mt-1 font-display text-sm font-bold" dir="ltr">
                        {money(revenue, lang)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-border pt-4 text-xs font-bold text-primary">
                    <span>{pick("تتبع طلبات الفرع", "Track branch orders")}</span>
                    {lang === "ar" ? (
                      <ArrowLeft className="h-4 w-4 transition group-hover:-translate-x-1" aria-hidden />
                    ) : (
                      <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" aria-hidden />
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {!branches.length && !loading ? (
          <div className="rounded-2xl border border-dashed border-border py-16 text-center">
            <Store className="mx-auto h-7 w-7 text-muted-foreground" aria-hidden />
            <p className="mt-3 text-sm font-semibold">
              {pick("لا توجد فروع بعد", "No branches yet")}
            </p>
          </div>
        ) : null}
      </div>
    );
  }

  /* ------------------------- selected branch view ------------------------- */
  const branchOrders = byBranch.get(selectedBranch["id"] as string) ?? [];
  const rows = branchOrders.filter((o) => matchesFilter(o["status"] as string, filter));

  return (
    <div className="space-y-4">
      {/* horizontal branch submenu */}
      <nav
        aria-label={pick("التنقل بين الفروع", "Branch navigation")}
        className="-mx-1 flex gap-2 overflow-x-auto border-b border-border px-1 pb-4"
      >
        <button
          onClick={() => setSelectedBranchId(null)}
          className="flex shrink-0 items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-bold text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
        >
          {lang === "ar" ? (
            <ArrowRight className="h-4 w-4" aria-hidden />
          ) : (
            <ArrowLeft className="h-4 w-4" aria-hidden />
          )}
          {pick("كل الفروع", "All branches")}
        </button>
        {branches.map((branch) => {
          const branchId = branch["id"] as string;
          const activeTab = branchId === selectedBranchId;
          const count = (byBranch.get(branchId) ?? []).filter((o) =>
            IN_PROGRESS_STATUSES.includes(o["status"] as string),
          ).length;
          return (
            <button
              key={branchId}
              onClick={() => setSelectedBranchId(branchId)}
              aria-current={activeTab ? "page" : undefined}
              className={cn(
                "flex shrink-0 items-center gap-3 rounded-xl border px-4 py-2.5 text-start transition",
                activeTab
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
              )}
            >
              <span
                className={cn(
                  "grid h-8 w-8 place-items-center rounded-lg",
                  activeTab ? "bg-primary-foreground/15" : "bg-elevated",
                )}
              >
                <Store className="h-4 w-4" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block max-w-40 truncate text-xs font-bold">
                  {pick(branch["name_ar"] as string, branch["name_en"] as string)}
                </span>
                <span
                  className={cn(
                    "block text-[10px]",
                    activeTab ? "text-primary-foreground/75" : "text-muted-foreground",
                  )}
                >
                  <span dir="ltr">{count}</span> {pick("قيد التنفيذ", "active")}
                </span>
              </span>
            </button>
          );
        })}
      </nav>

      {/* status filters + view switch */}
      <div className="flex flex-wrap items-center gap-2">
        {ORDER_FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-full border px-4 py-2 text-xs font-semibold transition",
              filter === f
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border hover:border-primary/40",
            )}
          >
            {filterLabel(f, pick)}
            <span className="ms-1.5 opacity-70" dir="ltr">
              {branchOrders.filter((o) => matchesFilter(o["status"] as string, f)).length}
            </span>
          </button>
        ))}

        <div className="ms-auto inline-flex rounded-full border border-border p-1">
          {([
            { id: "grid" as const, icon: LayoutGrid, ar: "مربعات", en: "Boxes" },
            { id: "list" as const, icon: List, ar: "قائمة", en: "List" },
          ]).map((v) => (
            <button
              key={v.id}
              onClick={() => setView(v.id)}
              aria-pressed={view === v.id}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold transition",
                view === v.id ? "bg-primary text-primary-foreground" : "text-muted-foreground",
              )}
            >
              <v.icon className="h-3.5 w-3.5" aria-hidden />
              {pick(v.ar, v.en)}
            </button>
          ))}
        </div>
      </div>

      {/* orders */}
      {view === "grid" ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((o) => {
            const items = (o["order_items"] as Row[]) ?? [];
            const status = o["status"] as string;
            return (
              <article
                key={o["id"] as string}
                className={cn(
                  "surface flex min-h-44 flex-col rounded-2xl p-4 transition duration-300 hover:-translate-y-0.5 hover:shadow-lift",
                  orderGlow(status),
                )}
              >
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 border-b border-border pb-3">
                  <div className="min-w-0">
                    <p className="truncate font-display text-lg font-bold" dir="ltr">
                      {o["order_number"] as string}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {branchName(o)} · {(o["customer_name"] as string) || pick("عميل", "Customer")} ·{" "}
                      {formatDateTime(o["created_at"] as string, lang)}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold",
                      statusTone(status),
                    )}
                  >
                    {statusLabel(status, pick)}
                  </span>
                </div>

                <div className="flex-1 py-3">
                  <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                    {items
                      .map(
                        (i) =>
                          `${i["quantity"]}× ${pick(i["name_ar"] as string, i["name_en"] as string)}`,
                      )
                      .join(" • ")}
                  </p>
                  <div className="mt-3 space-y-2">
                    <TrackingBadge order={o} />
                    <TimingLine order={o} />
                  </div>
                </div>

                <div className="flex items-end justify-between gap-3 border-t border-border pt-3">
                  <button
                    onClick={() => setDetail(o)}
                    className="rounded-full border border-border px-3 py-1.5 text-[11px] font-bold text-muted-foreground transition hover:border-primary/40 hover:text-primary"
                  >
                    {pick("التفاصيل", "Details")}
                  </button>
                  <span className="font-display text-lg font-bold text-primary" dir="ltr">
                    {money(Number(o["total"]), lang)}
                  </span>
                </div>
              </article>
            );
          })}
          {!rows.length && (
            <div className="rounded-2xl border border-dashed border-border py-16 text-center md:col-span-2 xl:col-span-3">
              <ClipboardList className="mx-auto h-7 w-7 text-muted-foreground" aria-hidden />
              <p className="mt-3 text-sm font-semibold text-muted-foreground">
                {pick("لا توجد طلبات", "No orders")}
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border">
          {rows.map((o) => {
            const status = o["status"] as string;
            const since = minutesBetween(o["created_at"]);
            const prep = minutesBetween(o["created_at"], o["ready_at"]);
            return (
              <button
                key={o["id"] as string}
                onClick={() => setDetail(o)}
                className="flex w-full flex-wrap items-center gap-3 px-4 py-3 text-start transition hover:bg-elevated"
              >
                <span className="w-24 shrink-0 font-display text-sm font-bold" dir="ltr">
                  {o["order_number"] as string}
                </span>
                <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
                  {branchName(o)} · {(o["customer_name"] as string) || pick("عميل", "Customer")} ·{" "}
                  {formatDateTime(o["created_at"] as string, lang)}
                </span>
                <span className="text-[11px] text-muted-foreground" dir="ltr">
                  {prep != null
                    ? `${pick("جاهز", "ready")} ${prep} ${pick("د", "min")}`
                    : since != null
                      ? `${since} ${pick("د", "min")}`
                      : ""}
                </span>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold",
                    statusTone(status),
                  )}
                >
                  {statusLabel(status, pick)}
                </span>
                <span className="w-20 shrink-0 text-end font-display text-sm font-bold text-primary" dir="ltr">
                  {money(Number(o["total"]), lang)}
                </span>
              </button>
            );
          })}
          {!rows.length && (
            <p className="py-14 text-center text-sm font-semibold text-muted-foreground">
              {pick("لا توجد طلبات", "No orders")}
            </p>
          )}
        </div>
      )}

      <OrderDetail
        order={liveDetail}
        branchName={liveDetail ? branchName(liveDetail) : ""}
        onClose={() => setDetail(null)}
      />
    </div>
  );
}
