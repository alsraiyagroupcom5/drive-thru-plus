/**
 * The four customer-facing order stages. Every dashboard (kitchen, owner,
 * admin) speaks the same language as the customer tracking page so a status
 * always reads the same wherever it is shown.
 */
export const CUSTOMER_STAGES = ["RECEIVED", "PREPARING", "READY", "COMPLETED"] as const;
export type CustomerStage = (typeof CUSTOMER_STAGES)[number];

const STAGE_OF: Record<string, CustomerStage> = {
  DRAFT: "RECEIVED",
  PENDING_PAYMENT: "RECEIVED",
  PAYMENT_FAILED: "RECEIVED",
  PAID: "RECEIVED",
  RECEIVED: "RECEIVED",
  ACCEPTED: "RECEIVED",
  PREPARING: "PREPARING",
  QUALITY_CHECK: "PREPARING",
  READY: "READY",
  ARRIVING: "READY",
  PICKED_UP: "COMPLETED",
  COMPLETED: "COMPLETED",
};

/** Map any raw database status onto one of the four customer stages. */
export function stageOf(status: string): CustomerStage | null {
  return STAGE_OF[status] ?? null;
}

export function isCancelled(status: string): boolean {
  return status === "CANCELLED" || status === "REFUNDED";
}

const LABELS: Record<string, { ar: string; en: string }> = {
  RECEIVED: { ar: "تم استلام الطلب", en: "Order received" },
  PREPARING: { ar: "جاري التحضير", en: "Preparing" },
  READY: { ar: "جاهز للاستلام", en: "Ready for pickup" },
  COMPLETED: { ar: "تم الاستلام", en: "Picked up" },
  CANCELLED: { ar: "ملغي", en: "Cancelled" },
  REFUNDED: { ar: "مسترجع", en: "Refunded" },
};

/** Bilingual label for a raw status, expressed in customer wording. */
export function orderStatusLabel(status: string, pick: (ar: string, en: string) => string): string {
  const key = isCancelled(status) ? status : (stageOf(status) ?? status);
  const label = LABELS[key];
  return label ? pick(label.ar, label.en) : status;
}

/**
 * The single next stage the database guard accepts from the current raw
 * status. Cancelling is deliberately excluded — it lives on its own button.
 */
export function nextStage(status: string): CustomerStage | null {
  switch (status) {
    case "DRAFT":
    case "PENDING_PAYMENT":
    case "PAYMENT_FAILED":
    case "PAID":
      return "RECEIVED";
    case "RECEIVED":
    case "ACCEPTED":
      return "PREPARING";
    case "PREPARING":
    case "QUALITY_CHECK":
      return "READY";
    case "READY":
    case "ARRIVING":
    case "PICKED_UP":
      return "COMPLETED";
    default:
      return null;
  }
}

/** Statuses that may still be cancelled. */
export function canCancel(status: string): boolean {
  return !isCancelled(status) && status !== "COMPLETED";
}
