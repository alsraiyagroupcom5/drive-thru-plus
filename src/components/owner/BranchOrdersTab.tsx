import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ClipboardList,
  MapPin,
  Navigation,
  PackageCheck,
  Store,
  Timer,
  Wallet,
} from "lucide-react";
import { useI18n, money, formatDateTime } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type Row = Record<string, unknown>;

const ORDER_FILTERS = ["ALL", "IN_PROGRESS", "READY", "COMPLETED", "CANCELLED"] as const;
type Filter = (typeof ORDER_FILTERS)[number];

const IN_PROGRESS_STATUSES = ["RECEIVED", "ACCEPTED", "PREPARING", "QUALITY_CHECK", "ARRIVING"];

function statusLabel(status: string, pick: (ar: string, en: string) => string): string {
  switch (status) {
    case "RECEIVED":
      return pick("تم الاستلام", "Received");
    case "ACCEPTED":
      return pick("مقبول", "Accepted");
    case "PREPARING":
      return pick("قيد التحضير", "Preparing");
    case "QUALITY_CHECK":
      return pick("فحص الجودة", "Quality check");
    case "READY":
      return pick("جاهز", "Ready");
    case "ARRIVING":
      return pick("العميل في الطريق", "Arriving");
    case "PICKED_UP":
      return pick("تم الاستلام", "Picked up");
    case "COMPLETED":
      return pick("مكتمل", "Completed");
    case "CANCELLED":
      return pick("ملغي", "Cancelled");
    default:
      return status;
  }
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

function TrackingBadge({ order }: { order: Row }) {
  const { pick, lang } = useI18n();
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
        {lang === "ar" ? "" : ""}
      </span>
    );
  }
  return null;
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

      {/* status filters */}
      <div className="flex flex-wrap gap-2">
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
      </div>

      {/* orders */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {rows.map((o) => {
          const items = (o["order_items"] as Row[]) ?? [];
          const status = o["status"] as string;
          return (
            <article
              key={o["id"] as string}
              className="surface flex min-h-44 flex-col rounded-2xl p-4 transition duration-300 hover:-translate-y-0.5 hover:shadow-lift"
            >
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 border-b border-border pb-3">
                <div className="min-w-0">
                  <p className="truncate font-display text-lg font-bold" dir="ltr">
                    {o["order_number"] as string}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {(o["customer_name"] as string) || pick("عميل", "Customer")} ·{" "}
                  {formatDateTime(o["created_at"] as string, lang)}
                </p>
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold",
                    status === "READY"
                      ? "bg-success/15 text-success"
                      : status === "CANCELLED"
                        ? "bg-destructive/12 text-destructive"
                        : "bg-elevated",
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
                <div className="mt-3"><TrackingBadge order={o} /></div>
              </div>

              <div className="flex items-end justify-between gap-3 border-t border-border pt-3">
                <span className="text-[11px] text-muted-foreground">{pick("الإجمالي", "Total")}</span>
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
    </div>
  );
}
