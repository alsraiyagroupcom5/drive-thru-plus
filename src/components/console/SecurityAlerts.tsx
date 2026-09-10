import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCheck, LockKeyhole } from "lucide-react";
import { formatDateTime, useI18n } from "@/lib/i18n";
import { listSecurityAlerts, markSecurityAlertsRead } from "@/lib/security.functions";

export function SecurityAlerts() {
  const { pick, lang } = useI18n();
  const qc = useQueryClient();
  const alerts = useQuery({
    queryKey: ["security-alerts"],
    queryFn: () => listSecurityAlerts(),
    refetchInterval: 15_000,
  });
  const unread = (alerts.data ?? []).filter((alert) => !alert.read_at);
  const markRead = useMutation({
    mutationFn: (ids: string[]) => markSecurityAlertsRead({ data: { ids } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["security-alerts"] }),
  });

  return (
    <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-destructive">
            <LockKeyhole className="h-4 w-4" aria-hidden />
            {pick("مراقبة تسجيل الدخول", "Sign-in monitoring")}
          </p>
          <h3 className="mt-2 font-display text-xl font-bold">
            {pick("تنبيهات الأمان", "Security alerts")}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {pick(
              "يتم قفل المحاولة لمدة 30 دقيقة بعد 5 محاولات فاشلة خلال 15 دقيقة.",
              "Access is locked for 30 minutes after 5 failed attempts within 15 minutes.",
            )}
          </p>
        </div>
        {unread.length ? (
          <button
            type="button"
            disabled={markRead.isPending}
            onClick={() => markRead.mutate(unread.map((alert) => alert.id))}
            className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs font-bold"
          >
            <CheckCheck className="h-4 w-4" aria-hidden />
            {pick("تحديد الكل كمقروء", "Mark all read")}
          </button>
        ) : null}
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        {(alerts.data ?? []).map((alert) => (
          <article
            key={alert.id}
            className={`rounded-2xl border p-4 ${alert.read_at ? "border-border bg-elevated/40" : "border-destructive/35 bg-destructive/5"}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-destructive/10 text-destructive">
                  <AlertTriangle className="h-4 w-4" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="font-semibold">{pick("محاولات دخول فاشلة متكررة", alert.title)}</p>
                  <p className="mt-1 truncate text-xs text-muted-foreground" dir="ltr">{alert.attempted_email ?? "—"}</p>
                </div>
              </div>
              {!alert.read_at ? <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-destructive" /> : null}
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
              <span>{pick(`${alert.attempt_count} محاولات`, `${alert.attempt_count} attempts`)}</span>
              <time dir="ltr">{formatDateTime(alert.created_at, lang)}</time>
            </div>
            {!alert.read_at ? (
              <button
                type="button"
                onClick={() => markRead.mutate([alert.id])}
                className="mt-3 text-xs font-bold text-primary hover:underline"
              >
                {pick("تحديد كمقروء", "Mark as read")}
              </button>
            ) : null}
          </article>
        ))}
        {!alerts.isLoading && !alerts.data?.length ? (
          <p className="py-10 text-sm text-muted-foreground">{pick("لا توجد تنبيهات أمان.", "No security alerts.")}</p>
        ) : null}
      </div>
    </section>
  );
}