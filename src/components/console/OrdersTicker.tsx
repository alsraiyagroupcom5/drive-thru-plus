import { useState } from "react";
import { Clock, Store, User } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { OrderDetail } from "@/components/owner/BranchOrdersTab";
import { cn } from "@/lib/utils";

type Row = Record<string, unknown>;

function label(status: string, pick: (ar: string, en: string) => string): string {
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
      return pick("في الطريق", "Arriving");
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

function tone(status: string): string {
  if (status === "READY") return "bg-success/15 text-success";
  if (status === "CANCELLED") return "bg-destructive/12 text-destructive";
  if (status === "COMPLETED" || status === "PICKED_UP") return "bg-primary/12 text-primary";
  return "bg-warning/15 text-warning";
}

function minutesSince(created?: unknown): number | null {
  if (!created) return null;
  const t = new Date(String(created)).getTime();
  if (Number.isNaN(t)) return null;
  return Math.max(0, Math.round((Date.now() - t) / 60000));
}

/** Endlessly sliding row of order boxes: customer, branch, status, waiting time. */
export function OrdersTicker({ orders, branches }: { orders: Row[]; branches: Row[] }) {
  const { pick, lang } = useI18n();
  const [detail, setDetail] = useState<Row | null>(null);

  const branchName = (o: Row): string => {
    const b = branches.find((x) => x["id"] === o["branch_id"]) ?? (o["branches"] as Row | null);
    return b ? pick(b["name_ar"] as string, b["name_en"] as string) : pick("فرع", "Branch");
  };

  if (!orders.length) return null;

  // Duplicate the list so the -50% keyframe loops seamlessly.
  const loop = [...orders, ...orders];
  const duration = Math.max(30, orders.length * 6);

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="pulse-ring inline-block h-2 w-2 rounded-full bg-primary" aria-hidden />
          <h2 className="font-display text-sm font-bold">{pick("شريط الطلبات المباشر", "Live orders ticker")}</h2>
        </div>
        <p className="text-[10px] text-muted-foreground">
          <span dir="ltr">{orders.length}</span> {pick("طلب", "orders")}
        </p>
      </div>

      <div
        className="orders-marquee -mx-1 overflow-hidden px-1 py-1 [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]"
        dir="ltr"
      >
        <div
          className="animate-orders-marquee flex w-max gap-3"
          style={{ "--marquee-duration": `${duration}s` } as React.CSSProperties}
        >
          {loop.map((o, i) => {
            const status = String(o["status"] ?? "");
            const mins = minutesSince(o["created_at"]);
            return (
              <article
                key={`${String(o["id"])}-${i}`}
                dir={lang === "ar" ? "rtl" : "ltr"}
                className="surface w-60 shrink-0 rounded-2xl p-3.5 text-start"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate font-display text-sm font-bold" dir="ltr">
                    {String(o["order_number"] ?? "")}
                  </p>
                  <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold", tone(status))}>
                    {label(status, pick)}
                  </span>
                </div>
                <p className="mt-2 flex min-w-0 items-center gap-1.5 text-[11px] text-muted-foreground">
                  <User className="h-3 w-3 shrink-0" aria-hidden />
                  <span className="truncate">{(o["customer_name"] as string) || pick("عميل", "Customer")}</span>
                </p>
                <p className="mt-1 flex min-w-0 items-center gap-1.5 text-[11px] text-muted-foreground">
                  <Store className="h-3 w-3 shrink-0" aria-hidden />
                  <span className="truncate">{branchName(o)}</span>
                </p>
                <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-border pt-2">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-foreground">
                    <Clock className="h-3 w-3 text-primary" aria-hidden />
                    {mins != null ? (
                      <>
                        <span dir="ltr">{mins}</span> {pick("د انتظار", "min waiting")}
                      </>
                    ) : (
                      "—"
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={() => setDetail(o)}
                    className="rounded-full border border-border px-2.5 py-0.5 text-[9px] font-bold text-muted-foreground transition hover:border-primary/40 hover:text-primary"
                  >
                    {pick("التفاصيل", "Details")}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      <OrderDetail order={detail} branchName={detail ? branchName(detail) : ""} onClose={() => setDetail(null)} />
    </section>
  );
}
