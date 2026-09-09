import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Car, Clock, LogOut } from "lucide-react";
import { toast } from "sonner";
import {
  useLiveOrders,
  useStaffBranch,
  setOrderStatus,
  minutesSince,
  type LiveOrder,
} from "@/components/staff/useLiveOrders";
import { useI18n } from "@/lib/i18n";
import { LanguageToggle } from "@/components/customer/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/kitchen")({
  head: () => ({
    meta: [
      { title: "Kitchen display — MASAR Grill" },
      { name: "description", content: "Live kitchen display for drive-thru order preparation." },
      { property: "og:title", content: "Kitchen display — MASAR Grill" },
      { property: "og:description", content: "Live kitchen display for order preparation." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: KitchenPage,
});

const COLUMNS = [
  { status: "RECEIVED", next: "PREPARING" },
  { status: "PREPARING", next: "READY" },
  { status: "READY", next: "COMPLETED" },
] as const;

function KitchenPage() {
  const { t, pick } = useI18n();
  const staff = useStaffBranch();
  const branchId = staff.data?.branch_id ?? null;
  const orders = useLiveOrders(branchId);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [, tick] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => tick((n) => n + 1), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const advance = async (order: LiveOrder, next: string) => {
    try {
      await setOrderStatus(order.id, next);
      queryClient.invalidateQueries({ queryKey: ["live-orders", branchId] });
    } catch {
      toast.error(t("somethingWrong"));
    }
  };

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-4">
        <div>
          <h1 className="font-display text-2xl font-bold">{t("kitchen")}</h1>
          <p className="text-xs text-muted-foreground">
            {pick(staff.data?.branches?.name_ar, staff.data?.branches?.name_en) ?? t("branch")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <LanguageToggle />
          <button
            onClick={signOut}
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold hover:bg-accent"
          >
            <LogOut className="h-3.5 w-3.5" aria-hidden />
            {t("signOut")}
          </button>
        </div>
      </header>

      <div className="grid gap-4 p-4 md:grid-cols-3">
        {COLUMNS.map((col) => {
          const items = (orders.data ?? []).filter((o) => o.status === col.status);
          return (
            <section key={col.status} className="rounded-2xl bg-elevated/60 p-3">
              <div className="mb-3 flex items-center justify-between px-1">
                <h2 className="font-display text-sm font-bold uppercase tracking-wide">
                  {col.status === "RECEIVED"
                    ? t("received")
                    : col.status === "PREPARING"
                      ? t("preparing")
                      : t("ready")}
                </h2>
                <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-bold text-primary">
                  {items.length}
                </span>
              </div>
              <ul className="space-y-3">
                {items.map((o) => {
                  const age = minutesSince(o.created_at);
                  const target = o.target_prep_minutes ?? 8;
                  const urgency = age >= target ? "late" : age >= target - 2 ? "soon" : "ok";
                  return (
                    <li
                      key={o.id}
                      className={cn(
                        "surface rounded-2xl border-2 p-3",
                        urgency === "late"
                          ? "border-destructive"
                          : urgency === "soon"
                            ? "border-warning"
                            : "border-transparent",
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-display text-lg font-bold">{o.order_number}</span>
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 text-xs font-bold",
                            urgency === "late" ? "text-destructive" : "text-muted-foreground",
                          )}
                        >
                          <Clock className="h-3.5 w-3.5" aria-hidden />
                          {age} {t("minutes")}
                        </span>
                      </div>
                      {o.customer_arrived && (
                        <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-[11px] font-bold text-success">
                          <Car className="h-3 w-3" aria-hidden />
                          {t("imHere")}
                        </p>
                      )}
                      <ul className="mt-2 space-y-1 text-sm">
                        {o.order_items.map((item) => (
                          <li key={item.id}>
                            <span className="font-bold text-primary">{item.quantity}×</span>{" "}
                            {pick(item.name_ar, item.name_en)}
                            {item.order_item_modifiers.length ? (
                              <span className="block text-[11px] text-muted-foreground">
                                {item.order_item_modifiers
                                  .map((m) => pick(m.name_ar, m.name_en))
                                  .join(" • ")}
                              </span>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                      {o.notes ? (
                        <p className="mt-2 rounded-lg bg-warning/10 p-2 text-[11px] text-warning">
                          {o.notes}
                        </p>
                      ) : null}
                      <button
                        onClick={() => advance(o, col.next)}
                        className="mt-3 w-full rounded-full bg-primary py-2.5 text-sm font-bold text-primary-foreground"
                      >
                        {col.next === "PREPARING"
                          ? t("preparing")
                          : col.next === "READY"
                            ? t("ready")
                            : t("pickedUp")}
                      </button>
                    </li>
                  );
                })}
                {!items.length && (
                  <li className="py-10 text-center text-xs text-muted-foreground">—</li>
                )}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
