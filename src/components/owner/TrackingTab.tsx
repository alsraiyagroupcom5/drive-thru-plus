import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Crosshair, ExternalLink, MapPin, Navigation, Radar, Timer, Gauge } from "lucide-react";
import { Modal } from "@/components/console/Modal";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { saveTrackingSettings } from "@/lib/owner.functions";

type Row = Record<string, unknown>;

const input =
  "h-11 w-full rounded-xl border border-border bg-elevated px-3 text-sm outline-none ring-ring/40 focus:ring-2";
const label = "text-[11px] font-bold uppercase tracking-wide text-muted-foreground";

function n(v: unknown, fallback: number) {
  const x = Number(v);
  return Number.isFinite(x) ? x : fallback;
}

export function TrackingTab({
  branches,
  restaurantId,
  onChanged,
}: {
  branches: Row[];
  restaurantId?: string | null;
  onChanged: () => void;
}) {
  const { pick } = useI18n();
  const [editing, setEditing] = useState<Row | null>(null);

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-border bg-gradient-to-br from-primary/10 via-card to-card p-6">
        <p className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-primary">
          <Radar className="h-3.5 w-3.5" aria-hidden />
          {pick("إعدادات التتبع", "Tracking settings")}
        </p>
        <h2 className="mt-2 font-display text-2xl font-bold">
          {pick("موقع الفرع وتتبع وصول العميل", "Branch location & customer arrival")}
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          {pick(
            "حدّد إحداثيات كل فرع، ونطاق اعتبار العميل واصلاً، وسرعة حساب وقت الوصول، وكل كم ثانية يُحدَّث موقع العميل.",
            "Set each branch's coordinates, the radius that counts as arrived, the speed used for the ETA, and how often the customer's location refreshes.",
          )}
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {branches.map((b) => {
          const on = b["tracking_enabled"] !== false;
          const lat = b["lat"] as number | null;
          const lng = b["lng"] as number | null;
          return (
            <article
              key={b["id"] as string}
              className="group flex flex-col justify-between rounded-3xl border border-border bg-card p-5 shadow-sm transition hover:border-primary/40 hover:shadow-md"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-display text-lg font-bold">
                      {pick(b["name_ar"] as string, b["name_en"] as string)}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {pick(b["city_ar"] as string, b["city_en"] as string) || (b["code"] as string)}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 text-[11px] font-bold",
                      on ? "bg-success/12 text-success" : "bg-muted text-muted-foreground",
                    )}
                  >
                    {on ? pick("التتبع مفعّل", "Tracking on") : pick("متوقف", "Off")}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                  <Metric
                    icon={MapPin}
                    title={pick("إحداثيات الفرع", "Branch coordinates")}
                    value={
                      lat != null && lng != null
                        ? `${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)}`
                        : pick("غير محددة", "Not set")
                    }
                  />
                  <Metric
                    icon={Navigation}
                    title={pick("نطاق الوصول", "Arrival radius")}
                    value={`${n(b["arrival_radius_m"], 200)} m`}
                  />
                  <Metric
                    icon={Gauge}
                    title={pick("سرعة الحساب", "ETA speed")}
                    value={`${n(b["avg_speed_kmh"], 32)} km/h`}
                  />
                  <Metric
                    icon={Timer}
                    title={pick("تحديث الموقع", "Location refresh")}
                    value={`${n(b["location_ping_seconds"], 15)} s`}
                  />
                </div>
              </div>

              <div className="mt-5 flex items-center gap-2">
                <button
                  onClick={() => setEditing(b)}
                  className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground transition hover:opacity-90"
                >
                  {pick("تعديل إعدادات التتبع", "Edit tracking")}
                </button>
                {b["maps_url"] ? (
                  <a
                    href={b["maps_url"] as string}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl border border-border p-2.5 text-muted-foreground transition hover:text-foreground"
                    aria-label={pick("فتح الخريطة", "Open map")}
                  >
                    <ExternalLink className="h-4 w-4" aria-hidden />
                  </a>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>

      <TrackingDialog
        branch={editing}
        restaurantId={restaurantId ?? null}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          onChanged();
        }}
      />
    </div>
  );
}

function Metric({
  icon: Icon,
  title,
  value,
}: {
  icon: typeof MapPin;
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-elevated/70 p-3">
      <p className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
        <Icon className="h-3 w-3" aria-hidden />
        {title}
      </p>
      <p dir="ltr" className="mt-1 text-xs font-bold">
        {value}
      </p>
    </div>
  );
}

function TrackingDialog({
  branch,
  restaurantId,
  onClose,
  onSaved,
}: {
  branch: Row | null;
  restaurantId: string | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { pick } = useI18n();
  const [locating, setLocating] = useState(false);

  const save = useMutation({
    mutationFn: (v: Parameters<typeof saveTrackingSettings>[0]["data"]) =>
      saveTrackingSettings({ data: v }),
    onSuccess: () => {
      toast.success(pick("تم حفظ إعدادات التتبع", "Tracking settings saved"));
      onSaved();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!branch) return null;
  const id = branch["id"] as string;

  return (
    <Modal
      open
      onClose={onClose}
      title={pick("إعدادات التتبع", "Tracking settings")}
      subtitle={pick(branch["name_ar"] as string, branch["name_en"] as string)}
    >
      <form
        id={`tracking-${id}`}
        onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          save.mutate({
            restaurantId,
            branchId: id,
            lat: f.get("lat") ? Number(f.get("lat")) : null,
            lng: f.get("lng") ? Number(f.get("lng")) : null,
            maps_url: String(f.get("maps_url") ?? ""),
            tracking_enabled: f.get("tracking_enabled") === "on",
            auto_arrival: f.get("auto_arrival") === "on",
            arrival_radius_m: Number(f.get("arrival_radius_m")),
            approach_radius_m: Number(f.get("approach_radius_m")),
            avg_speed_kmh: Number(f.get("avg_speed_kmh")),
            location_ping_seconds: Number(f.get("location_ping_seconds")),
          });
        }}
        className="space-y-5"
      >
        <fieldset className="space-y-3">
          <legend className={label}>{pick("موقع الفرع", "Branch location")}</legend>
          <div className="grid grid-cols-2 gap-3">
            <input
              name="lat"
              dir="ltr"
              defaultValue={(branch["lat"] as number | null) ?? ""}
              placeholder="25.3548"
              className={input}
              aria-label={pick("خط العرض", "Latitude")}
            />
            <input
              name="lng"
              dir="ltr"
              defaultValue={(branch["lng"] as number | null) ?? ""}
              placeholder="51.1839"
              className={input}
              aria-label={pick("خط الطول", "Longitude")}
            />
          </div>
          <button
            type="button"
            disabled={locating}
            onClick={() => {
              if (!("geolocation" in navigator)) {
                toast.error(pick("الموقع غير متاح", "Location unavailable"));
                return;
              }
              setLocating(true);
              navigator.geolocation.getCurrentPosition(
                (pos) => {
                  const form = document.getElementById(`tracking-${id}`) as HTMLFormElement | null;
                  if (form) {
                    (form.elements.namedItem("lat") as HTMLInputElement).value = String(
                      pos.coords.latitude.toFixed(6),
                    );
                    (form.elements.namedItem("lng") as HTMLInputElement).value = String(
                      pos.coords.longitude.toFixed(6),
                    );
                  }
                  setLocating(false);
                },
                () => {
                  setLocating(false);
                  toast.error(pick("تعذّر تحديد الموقع", "Could not read location"));
                },
                { enableHighAccuracy: true, timeout: 8000 },
              );
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-bold transition hover:border-primary/50"
          >
            <Crosshair className="h-3.5 w-3.5" aria-hidden />
            {locating
              ? pick("جارٍ التحديد…", "Locating…")
              : pick("استخدم موقعي الحالي", "Use my current location")}
          </button>
          <input
            name="maps_url"
            dir="ltr"
            defaultValue={(branch["maps_url"] as string | null) ?? ""}
            placeholder="https://maps.google.com/…"
            className={input}
            aria-label={pick("رابط الخريطة", "Map link")}
          />
        </fieldset>

        <fieldset className="space-y-3">
          <legend className={label}>{pick("تتبع العميل", "Customer tracking")}</legend>
          <Toggle
            name="tracking_enabled"
            defaultChecked={branch["tracking_enabled"] !== false}
            title={pick("تفعيل تتبع الموقع", "Enable location tracking")}
            hint={pick(
              "عرض المسافة والوقت المتبقي للموظفين.",
              "Show distance and ETA to your team.",
            )}
          />
          <Toggle
            name="auto_arrival"
            defaultChecked={branch["auto_arrival"] !== false}
            title={pick("تسجيل الوصول تلقائياً", "Automatic arrival")}
            hint={pick(
              "يُعلَّم العميل كواصل عند دخوله نطاق الوصول.",
              "Mark the customer arrived inside the arrival radius.",
            )}
          />
          <div className="grid grid-cols-2 gap-3">
            <Field
              name="arrival_radius_m"
              title={pick("نطاق الوصول (متر)", "Arrival radius (m)")}
              value={n(branch["arrival_radius_m"], 200)}
            />
            <Field
              name="approach_radius_m"
              title={pick("نطاق الاقتراب (متر)", "Approach radius (m)")}
              value={n(branch["approach_radius_m"], 1500)}
            />
            <Field
              name="avg_speed_kmh"
              title={pick("سرعة حساب الوصول (كم/س)", "ETA speed (km/h)")}
              value={n(branch["avg_speed_kmh"], 32)}
            />
            <Field
              name="location_ping_seconds"
              title={pick("تحديث الموقع (ثانية)", "Location refresh (s)")}
              value={n(branch["location_ping_seconds"], 15)}
            />
          </div>
        </fieldset>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={save.isPending}
            className="flex-1 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
          >
            {save.isPending ? pick("جارٍ الحفظ…", "Saving…") : pick("حفظ", "Save")}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-border px-4 py-3 text-sm font-bold"
          >
            {pick("إلغاء", "Cancel")}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function Field({ name, title, value }: { name: string; title: string; value: number }) {
  return (
    <label className="block">
      <span className={label}>{title}</span>
      <input
        name={name}
        type="number"
        dir="ltr"
        defaultValue={value}
        className={cn(input, "mt-1")}
      />
    </label>
  );
}

function Toggle({
  name,
  defaultChecked,
  title,
  hint,
}: {
  name: string;
  defaultChecked: boolean;
  title: string;
  hint: string;
}) {
  return (
    <label className="flex items-start gap-3 rounded-2xl border border-border bg-elevated/60 p-3">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="mt-1 h-4 w-4 accent-[hsl(var(--primary))]"
      />
      <span>
        <span className="block text-sm font-bold">{title}</span>
        <span className="block text-xs text-muted-foreground">{hint}</span>
      </span>
    </label>
  );
}
