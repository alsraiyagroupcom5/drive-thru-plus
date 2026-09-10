import { useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { ImagePlus, Store, Trash2, UploadCloud } from "lucide-react";
import { Modal } from "@/components/console/Modal";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { setBranchLogo, setRestaurantLogo, uploadLogo } from "@/lib/owner.functions";

type Row = Record<string, unknown>;

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("READ_FAILED"));
    reader.readAsDataURL(file);
  });
}

function LogoBadge({ url, name, size = 64 }: { url: string | null; name: string; size?: number }) {
  return url ? (
    <img
      src={url}
      alt={name}
      style={{ width: size, height: size }}
      className="rounded-2xl border border-border bg-elevated object-contain p-1.5"
    />
  ) : (
    <div
      style={{ width: size, height: size }}
      className="grid place-items-center rounded-2xl border border-dashed border-border bg-elevated text-muted-foreground"
    >
      <Store className="h-5 w-5" />
    </div>
  );
}

function Picker({
  label,
  busy,
  onFile,
}: {
  label: string;
  busy: boolean;
  onFile: (f: File) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <input
        ref={ref}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) onFile(f);
        }}
      />
      <button
        type="button"
        disabled={busy}
        onClick={() => ref.current?.click()}
        className="inline-flex items-center gap-2 rounded-full bg-[image:var(--gradient-brass)] px-5 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-50"
      >
        <UploadCloud className="h-4 w-4" />
        {label}
      </button>
    </>
  );
}

export function BrandingTab({
  restaurantId,
  restaurant,
  branches,
  onChanged,
}: {
  restaurantId: string;
  restaurant: Row;
  branches: Row[];
  onChanged: () => void;
}) {
  const { pick } = useI18n();
  const [applyAll, setApplyAll] = useState(true);
  const [editing, setEditing] = useState<Row | null>(null);

  const restaurantLogo = (restaurant["logo_url"] as string | null) ?? null;

  const upload = async (file: File) => {
    if (file.size > 3_000_000) throw new Error(pick("حجم الصورة كبير جدًا (٣ ميجابايت كحد أقصى)", "Image is too large (3MB max)"));
    const dataUrl = await readAsDataUrl(file);
    const res = await uploadLogo({ data: { restaurantId, dataUrl } });
    return res.url;
  };

  const saveRestaurant = useMutation({
    mutationFn: async (file: File | null) => {
      const url = file ? await upload(file) : null;
      await setRestaurantLogo({ data: { restaurantId, logoUrl: url, applyToBranches: applyAll } });
    },
    onSuccess: () => {
      toast.success(pick("تم تحديث الشعار", "Logo updated"));
      onChanged();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const saveBranch = useMutation({
    mutationFn: async ({ branchId, file }: { branchId: string; file: File | null }) => {
      const url = file ? await upload(file) : null;
      await setBranchLogo({ data: { restaurantId, branchId, logoUrl: url } });
    },
    onSuccess: () => {
      toast.success(pick("تم تحديث شعار الفرع", "Branch logo updated"));
      setEditing(null);
      onChanged();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-border p-5">
        <h2 className="font-display text-lg font-bold">{pick("شعار المطعم", "Restaurant logo")}</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          {pick(
            "PNG أو SVG بخلفية شفافة يعطي أفضل نتيجة.",
            "A transparent PNG or SVG looks best.",
          )}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-4">
          <LogoBadge url={restaurantLogo} name="logo" size={88} />
          <div className="flex flex-wrap items-center gap-2">
            <Picker
              label={pick("رفع شعار", "Upload logo")}
              busy={saveRestaurant.isPending}
              onFile={(f) => saveRestaurant.mutate(f)}
            />
            {restaurantLogo ? (
              <button
                type="button"
                disabled={saveRestaurant.isPending}
                onClick={() => saveRestaurant.mutate(null)}
                className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm font-bold text-muted-foreground transition hover:bg-accent disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                {pick("إزالة", "Remove")}
              </button>
            ) : null}
          </div>
        </div>

        <label className="mt-4 flex w-fit cursor-pointer items-center gap-2 rounded-full bg-elevated px-4 py-2.5 text-sm font-semibold">
          <input
            type="checkbox"
            checked={applyAll}
            onChange={(e) => setApplyAll(e.target.checked)}
            className="h-4 w-4 accent-[var(--primary)]"
          />
          {pick("تطبيق الشعار على جميع الفروع", "Apply this logo to all branches")}
        </label>
      </section>

      <section className="rounded-3xl border border-border p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-lg font-bold">{pick("شعارات الفروع", "Branch logos")}</h2>
          <span className="text-xs text-muted-foreground">
            {pick("يمكن لكل فرع استخدام شعار مختلف", "Each branch can use a different logo")}
          </span>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {branches.map((b) => {
            const url = (b["logo_url"] as string | null) ?? restaurantLogo;
            const own = !!b["logo_url"];
            return (
              <button
                key={b["id"] as string}
                onClick={() => setEditing(b)}
                className="flex items-center gap-3 rounded-3xl border border-border bg-card p-4 text-start transition hover:shadow-lift"
              >
                <LogoBadge url={url} name={String(b["name_en"] ?? "")} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-display text-base font-bold">
                    {pick(b["name_ar"] as string, b["name_en"] as string)}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground" dir="ltr">
                    {b["code"] as string}
                  </span>
                  <span
                    className={cn(
                      "mt-2 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold",
                      own ? "bg-success/10 text-success" : "bg-elevated text-muted-foreground",
                    )}
                  >
                    <ImagePlus className="h-3 w-3" />
                    {own ? pick("شعار خاص", "Custom logo") : pick("شعار المطعم", "Restaurant logo")}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={pick("شعار الفرع", "Branch logo")}
        subtitle={editing ? pick(editing["name_ar"] as string, editing["name_en"] as string) : ""}
      >
        {editing ? (
          <div className="flex flex-col items-center gap-4 py-2">
            <LogoBadge
              url={((editing["logo_url"] as string | null) ?? restaurantLogo) || null}
              name="branch logo"
              size={104}
            />
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Picker
                label={pick("رفع شعار للفرع", "Upload branch logo")}
                busy={saveBranch.isPending}
                onFile={(f) => saveBranch.mutate({ branchId: editing["id"] as string, file: f })}
              />
              {editing["logo_url"] ? (
                <button
                  type="button"
                  disabled={saveBranch.isPending}
                  onClick={() => saveBranch.mutate({ branchId: editing["id"] as string, file: null })}
                  className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm font-bold text-muted-foreground transition hover:bg-accent disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                  {pick("استخدام شعار المطعم", "Use restaurant logo")}
                </button>
              ) : null}
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
