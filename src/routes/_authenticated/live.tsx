import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Car, LogOut, Timer, TrendingUp, Utensils } from "lucide-react";
import {
  useLiveOrders,
  useStaffBranch,
  minutesSince,
  setOrderStatus,
} from "@/components/staff/useLiveOrders";
import { useI18n, money } from "@/lib/i18n";
import { LanguageToggle } from "@/components/customer/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/live")({
  head: () => ({
    meta: [
      { title: "Live orders — Origami Qatar" },
      { name: "description", content: "Branch live order board with wait times and arrivals." },
      { property: "og:title", content: "Live orders — Origami Qatar" },
      { property: "og:description", content: "Branch live order board with wait times." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LivePage,
});

const FILTERS = ["ALL", "RECEIVED", "PREPARING", "READY", "COMPLETED"] as const;

function LivePage() {
  const { t, pick, lang } = useI18n();
  const staff = useStaffBranch();
  const branchId = staff.data?.branch_id ?? null;
  const orders = useLiveOrders(branchId);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("ALL");

  const rows = useMemo(() => {
    const list = orders.data ?? [];
    return filter === "ALL" ? list : list.filter((o) => o.status === filter);
  }, [orders.data, filter]);

  const kpis = useMemo(() => {
    const list = orders.data ?? [];
    const active = list.filter((o) => ["RECEIVED", "PREPARING", "READY"].includes(o.status));
    const completed = list.filter((o) => o.status === "COMPLETED");
    const avg = completed.length
      ? Math.round(
          completed.reduce(
            (s, o) =>
              s +
              (o.ready_at
                ? (new Date(o.ready_at).getTime() - new Date(o.created_at).getTime()) / 60_000
                : 0),
            0,
          ) / completed.length,
        )
      : 0;
    const revenue = completed.reduce((s, o) => s + Number(o.total), 0);
    return { active: active.length, completed: completed.length, avg, revenue };
  }, [orders.data]);

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  const arrivals = (orders.data ?? []).filter((o) => o.customer_arrived && o.status !== "COMPLETED");

  return (
    <div className="min-h-screen bg-background">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-4">
        <div>
          <h1 className="font-display text-2xl font-bold">{t("liveOrders")}</h1>
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

      <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi icon={Utensils} label={t("liveOrders")} value={String(kpis.active)} />
        <Kpi icon={Timer} label={t("prepTime")} value={`${kpis.avg} ${t("minutes")}`} />
        <Kpi icon={TrendingUp} label={t("orders")} value={String(kpis.completed)} />
        <Kpi icon={TrendingUp} label={t("total")} value={money(kpis.revenue, lang)} />
      </div>

      {arrivals.length ? (
        <div className="mx-4 rounded-2xl border border-success/40 bg-success/10 p-3">
          <p className="text-sm font-bold text-success">
            <Car className="me-1.5 inline h-4 w-4" aria-hidden />
            {arrivals.map((o) => o.order_number).join(" · ")} — {t("arrivalNotified")}
          </p>
        </div>
      ) : null}

      <div className="hide-scrollbar flex gap-2 overflow-x-auto p-4">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "shrink-0 rounded-full border px-4 py-2 text-xs font-semibold",
              filter === f
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground",
            )}
          >
            {f === "ALL" ? t("all") : f}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto px-4 pb-10">
        <table className="w-full min-w-[720px] border-separate border-spacing-y-2 text-sm">
          <thead className="text-xs text-muted-foreground">
            <tr>
              <th className="px-3 text-start">{t("orderNumber")}</th>
              <th className="px-3 text-start">{t("vehicle")}</th>
              <th className="px-3 text-start">{t("payment")}</th>
              <th className="px-3 text-start">{t("prepTime")}</th>
              <th className="px-3 text-start">{t("total")}</th>
              <th className="px-3 text-start">{t("trackOrder")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((o) => {
              const age = minutesSince(o.created_at);
              const late = age > (o.target_prep_minutes ?? 8) && o.status !== "COMPLETED";
              return (
                <tr key={o.id} className="surface">
                  <td className="rounded-s-xl px-3 py-3 font-display font-bold">
                    {o.order_number}
                    {o.customer_arrived && (
                      <Car className="ms-1.5 inline h-3.5 w-3.5 text-success" aria-hidden />
                    )}
                  </td>
                  <td dir="ltr" className="px-3 py-3 text-xs text-muted-foreground">
                    {o.vehicle_snapshot?.plate ?? "—"} · {o.vehicle_snapshot?.color ?? ""}
                  </td>
                  <td className="px-3 py-3 text-xs">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 font-semibold",
                        o.payment_status === "PAID"
                          ? "bg-success/15 text-success"
                          : "bg-warning/15 text-warning",
                      )}
                    >
                      {o.payment_status}
                    </span>
                  </td>
                  <td
                    className={cn(
                      "px-3 py-3 text-xs font-semibold",
                      late ? "text-destructive" : "text-muted-foreground",
                    )}
                  >
                    {age} {t("minutes")}
                  </td>
                  <td className="px-3 py-3 font-semibold text-primary">
                    {money(Number(o.total), lang)}
                  </td>
                  <td className="rounded-e-xl px-3 py-3">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-elevated px-2 py-0.5 text-[11px] font-semibold">
                        {o.status}
                      </span>
                      {o.status === "READY" && (
                        <button
                          onClick={async () => {
                            try {
                              await setOrderStatus(o.id, "COMPLETED");
                              queryClient.invalidateQueries({ queryKey: ["live-orders", branchId] });
                            } catch (e) {
                              toast.error(
                                e instanceof Error && e.message ? e.message : t("somethingWrong"),
                              );
                            }
                          }}

                          className="rounded-full bg-primary px-3 py-1 text-[11px] font-bold text-primary-foreground"
                        >
                          {t("pickedUp")}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!rows.length && (
          <p className="py-16 text-center text-sm text-muted-foreground">{t("noOrders")}</p>
        )}
      </div>
    </div>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Car;
  label: string;
  value: string;
}) {
  return (
    <div className="surface rounded-2xl p-4">
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5 text-primary" aria-hidden />
        {label}
      </p>
      <p className="mt-1.5 font-display text-2xl font-bold">{value}</p>
    </div>
  );
}
