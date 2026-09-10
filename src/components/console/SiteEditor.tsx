import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Image as ImageIcon,
  Layers,
  Plus,
  RotateCcw,
  Save,
  Search,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { Modal } from "@/components/console/Modal";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  DEFAULT_SITE_CONTENT,
  SITE_ICONS,
  mergeSiteContent,
  siteContentQuery,
  type SiteContent,
  type T,
} from "@/lib/site-content";
import { saveSiteContent, uploadSiteImage } from "@/lib/site.functions";

const input =
  "h-11 w-full rounded-xl border border-border bg-elevated px-3 text-sm outline-none ring-ring/40 focus:ring-2";
const area =
  "min-h-24 w-full rounded-xl border border-border bg-elevated p-3 text-sm outline-none ring-ring/40 focus:ring-2";

function clone<V>(v: V): V {
  return JSON.parse(JSON.stringify(v)) as V;
}

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("READ_FAILED"));
    reader.readAsDataURL(file);
  });
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="mb-1 text-xs font-bold text-muted-foreground">{children}</p>;
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <input
        className={input}
        value={value}
        placeholder={placeholder ?? ""}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function PairField({
  label,
  value,
  onChange,
  long,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  long?: boolean;
}) {
  const Comp = long ? "textarea" : "input";
  return (
    <div>
      <Label>{label}</Label>
      <div className="grid gap-2 sm:grid-cols-2">
        <Comp
          dir="rtl"
          className={long ? area : input}
          value={value.ar}
          placeholder="عربي"
          onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
            onChange({ ...value, ar: e.target.value })
          }
        />
        <Comp
          dir="ltr"
          className={long ? area : input}
          value={value.en}
          placeholder="English"
          onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
            onChange({ ...value, en: e.target.value })
          }
        />
      </div>
    </div>
  );
}

function ImageField({
  label,
  url,
  onChange,
}: {
  label: string;
  url: string | null;
  onChange: (url: string | null) => void;
}) {
  const { pick } = useI18n();
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const pickFile = async (file: File) => {
    if (file.size > 5_000_000) {
      toast.error(pick("حجم الصورة كبير جدًا (٥ ميجابايت)", "Image is too large (5MB max)"));
      return;
    }
    setBusy(true);
    try {
      const dataUrl = await readAsDataUrl(file);
      const res = await uploadSiteImage({ data: { dataUrl } });
      onChange(res.url);
      toast.success(pick("تم رفع الصورة", "Image uploaded"));
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <Label>{label}</Label>
      <div className="flex flex-wrap items-center gap-3">
        {url ? (
          <img src={url} alt="" className="h-16 w-28 rounded-xl border border-border bg-elevated object-contain p-1" />
        ) : (
          <div className="grid h-16 w-28 place-items-center rounded-xl border border-dashed border-border text-muted-foreground">
            <ImageIcon className="h-4 w-4" />
          </div>
        )}
        <input
          ref={ref}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (f) void pickFile(f);
          }}
        />
        <button
          type="button"
          disabled={busy}
          onClick={() => ref.current?.click()}
          className="inline-flex items-center gap-2 rounded-full bg-[image:var(--gradient-brass)] px-4 py-2 text-xs font-bold text-primary-foreground disabled:opacity-50"
        >
          <UploadCloud className="h-3.5 w-3.5" />
          {busy ? pick("جارٍ الرفع…", "Uploading…") : pick("رفع صورة", "Upload image")}
        </button>
        {url ? (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs font-bold"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {pick("إزالة", "Remove")}
          </button>
        ) : null}
      </div>
    </div>
  );
}

function IconField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { pick } = useI18n();
  return (
    <div>
      <Label>{pick("الأيقونة", "Icon")}</Label>
      <select className={input} value={value} onChange={(e) => onChange(e.target.value)}>
        {Object.keys(SITE_ICONS).map((k) => (
          <option key={k} value={k}>
            {k}
          </option>
        ))}
      </select>
    </div>
  );
}

function Repeater<Item>({
  items,
  onChange,
  create,
  render,
  addLabel,
}: {
  items: Item[];
  onChange: (items: Item[]) => void;
  create: () => Item;
  render: (item: Item, update: (v: Item) => void, index: number) => React.ReactNode;
  addLabel: string;
}) {
  const { pick } = useI18n();
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="rounded-2xl border border-border p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground">#{i + 1}</span>
            <div className="flex items-center gap-1">
              {i > 0 ? (
                <button
                  type="button"
                  className="rounded-lg border border-border px-2 py-1 text-[11px]"
                  onClick={() => {
                    const next = [...items];
                    const [m] = next.splice(i, 1);
                    next.splice(i - 1, 0, m as Item);
                    onChange(next);
                  }}
                >
                  ↑
                </button>
              ) : null}
              {i < items.length - 1 ? (
                <button
                  type="button"
                  className="rounded-lg border border-border px-2 py-1 text-[11px]"
                  onClick={() => {
                    const next = [...items];
                    const [m] = next.splice(i, 1);
                    next.splice(i + 1, 0, m as Item);
                    onChange(next);
                  }}
                >
                  ↓
                </button>
              ) : null}
              <button
                type="button"
                className="rounded-lg border border-destructive/40 px-2 py-1 text-[11px] font-bold text-destructive"
                onClick={() => onChange(items.filter((_, j) => j !== i))}
              >
                {pick("حذف", "Delete")}
              </button>
            </div>
          </div>
          <div className="space-y-3">
            {render(item, (v) => onChange(items.map((it, j) => (j === i ? v : it))), i)}
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...items, create()])}
        className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs font-bold"
      >
        <Plus className="h-3.5 w-3.5" />
        {addLabel}
      </button>
    </div>
  );
}

const emptyT: T = { ar: "", en: "" };

export function SiteEditor() {
  const { pick } = useI18n();
  const qc = useQueryClient();
  const { data } = useQuery(siteContentQuery);
  const [draft, setDraft] = useState<SiteContent>(() => clone(DEFAULT_SITE_CONTENT));
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    if (data && !loaded) {
      setDraft(clone(data));
      setLoaded(true);
    }
  }, [data, loaded]);

  const set = <K extends keyof SiteContent>(key: K, value: SiteContent[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const setLogoWidth = (width: number) => {
    set("brand", { ...draft.brand, logoWidth: width });
  };

  const save = useMutation({
    mutationFn: () => saveSiteContent({ data: { content: draft } }),
    onSuccess: async () => {
      toast.success(pick("تم حفظ الموقع", "Website saved"));
      qc.setQueryData(siteContentQuery.queryKey, mergeSiteContent(draft));
      await qc.invalidateQueries({ queryKey: siteContentQuery.queryKey });
      setOpen(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const SECTIONS = [
    { id: "brand", ar: "الهوية والشعار", en: "Brand & logo", hint: pick("الشعار والاسم", "Logo and name") },
    { id: "nav", ar: "القوائم والروابط", en: "Menus & links", hint: pick("قائمة الموقع والدخول", "Site menu and sign-in") },
    { id: "hero", ar: "الواجهة الرئيسية", en: "Hero section", hint: pick("العنوان والصورة والأزرار", "Headline, image, buttons") },
    { id: "slides", ar: "الشرائح", en: "Slides", hint: pick("شرائح متحركة بالصور", "Sliding image cards") },
    { id: "features", ar: "المزايا", en: "Features", hint: pick("قائمة المزايا", "Feature list") },
    { id: "roles", ar: "الأدوار", en: "Roles", hint: pick("بطاقات الأدوار", "Role cards") },
    { id: "steps", ar: "خطوات البدء", en: "Steps", hint: pick("ثلاث خطوات", "How it works") },
    { id: "pricing", ar: "الباقات والأسعار", en: "Plans & pricing", hint: pick("الباقات والمزايا", "Plans and features") },
    { id: "request", ar: "نموذج الطلب", en: "Request form", hint: pick("العنوان والوصف", "Title and text") },
    { id: "contact", ar: "بيانات التواصل", en: "Contact details", hint: pick("الهواتف والبريد", "Phones and email") },
    { id: "footer", ar: "التذييل", en: "Footer", hint: pick("نصوص التذييل", "Footer texts") },
    { id: "seo", ar: "تحسين الظهور SEO", en: "SEO", hint: pick("العناوين والأوصاف", "Titles and descriptions") },
  ];

  return (
    <section className="space-y-5">
      <div className="surface flex flex-wrap items-center justify-between gap-3 rounded-3xl p-5">
        <div>
          <h2 className="font-display text-lg font-bold">{pick("محرر الموقع", "Website editor")}</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {pick(
              "عدّل كل نصوص وصور الموقع العام بالعربية والإنجليزية، ثم احفظ لتظهر مباشرة.",
              "Edit every text and image of the public website in Arabic and English, then save to publish.",
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setDraft(clone(DEFAULT_SITE_CONTENT));
              toast.message(pick("تمت الاستعادة — احفظ للتطبيق", "Restored — save to apply"));
            }}
            className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2.5 text-xs font-bold"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {pick("استعادة الافتراضي", "Reset to default")}
          </button>
          <button
            type="button"
            disabled={save.isPending}
            onClick={() => save.mutate()}
            className="inline-flex items-center gap-2 rounded-full bg-[image:var(--gradient-brass)] px-5 py-2.5 text-xs font-bold text-primary-foreground disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" />
            {save.isPending ? pick("جارٍ الحفظ…", "Saving…") : pick("حفظ ونشر", "Save & publish")}
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setOpen(s.id)}
            className="surface rounded-2xl p-4 text-start transition hover:ring-2 hover:ring-primary/40"
          >
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary">
              {s.id === "seo" ? <Search className="h-4 w-4" /> : <Layers className="h-4 w-4" />}
            </span>
            <p className="mt-3 font-display text-sm font-bold">{pick(s.ar, s.en)}</p>
            <p className="text-xs text-muted-foreground">{s.hint}</p>
          </button>
        ))}
      </div>

      {/* Brand */}
      <Modal
        open={open === "brand"}
        onClose={() => setOpen(null)}
        title={pick("الهوية والشعار", "Brand & logo")}
      >
        <div className="space-y-4">
          <ImageField
            label={pick("شعار الموقع", "Website logo")}
            url={draft.brand.logoUrl}
            onChange={(url) => set("brand", { ...draft.brand, logoUrl: url })}
          />
          <PairField
            label={pick("اسم الموقع", "Website name")}
            value={draft.brand.name}
            onChange={(v) => set("brand", { ...draft.brand, name: v })}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm font-semibold">
              {pick("عرض الشعار (بكسل)", "Logo width (px)")}
              <input
                type="number"
                min={24}
                max={640}
                dir="ltr"
                value={draft.brand.logoWidth}
                onChange={(e) => setLogoWidth(Number(e.target.value) || 0)}
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
              />
            </label>
            <label className="block text-sm font-semibold">
              {pick("ارتفاع الشعار (بكسل)", "Logo height (px)")}
              <input
                type="number"
                min={16}
                max={400}
                dir="ltr"
                value={draft.brand.logoHeight}
                onChange={(e) =>
                  set("brand", { ...draft.brand, logoHeight: Number(e.target.value) || 0 })
                }
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
              />
            </label>
          </div>

          <label className="flex items-center gap-2 text-sm font-semibold">
            <input
              type="checkbox"
              checked={draft.brand.showName}
              onChange={(e) => set("brand", { ...draft.brand, showName: e.target.checked })}
            />
            {pick("إظهار الاسم بجانب الشعار", "Show the name beside the logo")}
          </label>
        </div>
      </Modal>

      {/* Nav */}
      <Modal open={open === "nav"} onClose={() => setOpen(null)} title={pick("القوائم والروابط", "Menus & links")}>
        <div className="space-y-6">
          <div>
            <p className="mb-2 font-display text-sm font-bold">{pick("قائمة الموقع", "Site menu")}</p>
            <Repeater
              items={draft.nav}
              onChange={(v) => set("nav", v)}
              create={() => ({ to: "/", label: { ...emptyT } })}
              addLabel={pick("إضافة رابط", "Add link")}
              render={(item, update) => (
                <>
                  <PairField label={pick("الاسم", "Label")} value={item.label} onChange={(label) => update({ ...item, label })} />
                  <TextField label={pick("الرابط", "Path")} value={item.to} onChange={(to) => update({ ...item, to })} placeholder="/features" />
                </>
              )}
            />
          </div>
          <div>
            <p className="mb-2 font-display text-sm font-bold">{pick("قائمة الدخول", "Sign-in menu")}</p>
            <Repeater
              items={draft.access}
              onChange={(v) => set("access", v)}
              create={() => ({ to: "/auth", label: { ...emptyT } })}
              addLabel={pick("إضافة رابط", "Add link")}
              render={(item, update) => (
                <>
                  <PairField label={pick("الاسم", "Label")} value={item.label} onChange={(label) => update({ ...item, label })} />
                  <TextField label={pick("الرابط", "Path")} value={item.to} onChange={(to) => update({ ...item, to })} />
                </>
              )}
            />
          </div>
        </div>
      </Modal>

      {/* Hero */}
      <Modal open={open === "hero"} onClose={() => setOpen(null)} title={pick("الواجهة الرئيسية", "Hero section")}>
        <div className="space-y-4">
          <PairField label={pick("الشارة العلوية", "Badge")} value={draft.hero.badge} onChange={(badge) => set("hero", { ...draft.hero, badge })} />
          <PairField label={pick("العنوان", "Headline")} value={draft.hero.title} onChange={(title) => set("hero", { ...draft.hero, title })} long />
          <PairField label={pick("الوصف", "Subtitle")} value={draft.hero.subtitle} onChange={(subtitle) => set("hero", { ...draft.hero, subtitle })} long />
          <PairField
            label={pick("زر رئيسي", "Primary button")}
            value={draft.hero.primary.label}
            onChange={(label) => set("hero", { ...draft.hero, primary: { ...draft.hero.primary, label } })}
          />
          <TextField
            label={pick("رابط الزر الرئيسي", "Primary button path")}
            value={draft.hero.primary.to}
            onChange={(to) => set("hero", { ...draft.hero, primary: { ...draft.hero.primary, to } })}
          />
          <PairField
            label={pick("زر ثانوي", "Secondary button")}
            value={draft.hero.secondary.label}
            onChange={(label) => set("hero", { ...draft.hero, secondary: { ...draft.hero.secondary, label } })}
          />
          <TextField
            label={pick("رابط الزر الثانوي", "Secondary button path")}
            value={draft.hero.secondary.to}
            onChange={(to) => set("hero", { ...draft.hero, secondary: { ...draft.hero.secondary, to } })}
          />
          <ImageField label={pick("صورة الواجهة", "Hero image")} url={draft.hero.imageUrl} onChange={(imageUrl) => set("hero", { ...draft.hero, imageUrl })} />
          <PairField label={pick("وصف الصورة", "Image alt text")} value={draft.hero.imageAlt} onChange={(imageAlt) => set("hero", { ...draft.hero, imageAlt })} />
          <div>
            <p className="mb-2 font-display text-sm font-bold">{pick("الأرقام السريعة", "Quick stats")}</p>
            <Repeater
              items={draft.hero.stats}
              onChange={(stats) => set("hero", { ...draft.hero, stats })}
              create={() => ({ value: "", label: { ...emptyT } })}
              addLabel={pick("إضافة رقم", "Add stat")}
              render={(item, update) => (
                <>
                  <TextField label={pick("القيمة", "Value")} value={item.value} onChange={(value) => update({ ...item, value })} />
                  <PairField label={pick("الوصف", "Label")} value={item.label} onChange={(label) => update({ ...item, label })} />
                </>
              )}
            />
          </div>
        </div>
      </Modal>

      {/* Slides */}
      <Modal open={open === "slides"} onClose={() => setOpen(null)} title={pick("الشرائح", "Slides")}>
        <Repeater
          items={draft.slides}
          onChange={(v) => set("slides", v)}
          create={() => ({ imageUrl: null, title: { ...emptyT }, text: { ...emptyT } })}
          addLabel={pick("إضافة شريحة", "Add slide")}
          render={(item, update) => (
            <>
              <ImageField label={pick("الصورة", "Image")} url={item.imageUrl} onChange={(imageUrl) => update({ ...item, imageUrl })} />
              <PairField label={pick("العنوان", "Title")} value={item.title} onChange={(title) => update({ ...item, title })} />
              <PairField label={pick("النص", "Text")} value={item.text} onChange={(text) => update({ ...item, text })} long />
            </>
          )}
        />
      </Modal>

      {/* Features */}
      <Modal open={open === "features"} onClose={() => setOpen(null)} title={pick("المزايا", "Features")}>
        <div className="space-y-4">
          <PairField label={pick("العنوان الصغير", "Eyebrow")} value={draft.features.eyebrow} onChange={(eyebrow) => set("features", { ...draft.features, eyebrow })} />
          <PairField label={pick("العنوان", "Title")} value={draft.features.title} onChange={(title) => set("features", { ...draft.features, title })} />
          <PairField label={pick("الوصف", "Subtitle")} value={draft.features.subtitle} onChange={(subtitle) => set("features", { ...draft.features, subtitle })} long />
          <Repeater
            items={draft.features.items}
            onChange={(items) => set("features", { ...draft.features, items })}
            create={() => ({ icon: "Smartphone", title: { ...emptyT }, desc: { ...emptyT } })}
            addLabel={pick("إضافة ميزة", "Add feature")}
            render={(item, update) => (
              <>
                <IconField value={item.icon} onChange={(icon) => update({ ...item, icon })} />
                <PairField label={pick("العنوان", "Title")} value={item.title} onChange={(title) => update({ ...item, title })} />
                <PairField label={pick("الوصف", "Description")} value={item.desc} onChange={(desc) => update({ ...item, desc })} long />
              </>
            )}
          />
        </div>
      </Modal>

      {/* Roles */}
      <Modal open={open === "roles"} onClose={() => setOpen(null)} title={pick("الأدوار", "Roles")}>
        <div className="space-y-4">
          <PairField label={pick("العنوان الصغير", "Eyebrow")} value={draft.roles.eyebrow} onChange={(eyebrow) => set("roles", { ...draft.roles, eyebrow })} />
          <PairField label={pick("العنوان", "Title")} value={draft.roles.title} onChange={(title) => set("roles", { ...draft.roles, title })} />
          <PairField label={pick("الوصف", "Subtitle")} value={draft.roles.subtitle} onChange={(subtitle) => set("roles", { ...draft.roles, subtitle })} long />
          <Repeater
            items={draft.roles.items}
            onChange={(items) => set("roles", { ...draft.roles, items })}
            create={() => ({ icon: "ShieldCheck", title: { ...emptyT }, linkLabel: { ...emptyT }, to: "/auth", points: [] })}
            addLabel={pick("إضافة دور", "Add role")}
            render={(item, update) => (
              <>
                <IconField value={item.icon} onChange={(icon) => update({ ...item, icon })} />
                <PairField label={pick("العنوان", "Title")} value={item.title} onChange={(title) => update({ ...item, title })} />
                <PairField label={pick("نص الزر", "Button label")} value={item.linkLabel} onChange={(linkLabel) => update({ ...item, linkLabel })} />
                <TextField label={pick("رابط الزر", "Button path")} value={item.to} onChange={(to) => update({ ...item, to })} />
                <div>
                  <Label>{pick("النقاط", "Bullet points")}</Label>
                  <Repeater
                    items={item.points}
                    onChange={(points) => update({ ...item, points })}
                    create={() => ({ ...emptyT })}
                    addLabel={pick("إضافة نقطة", "Add point")}
                    render={(p, updatePoint) => (
                      <PairField label={pick("النص", "Text")} value={p} onChange={updatePoint} />
                    )}
                  />
                </div>
              </>
            )}
          />
        </div>
      </Modal>

      {/* Steps */}
      <Modal open={open === "steps"} onClose={() => setOpen(null)} title={pick("خطوات البدء", "Steps")}>
        <div className="space-y-4">
          <PairField label={pick("العنوان", "Title")} value={draft.steps.title} onChange={(title) => set("steps", { ...draft.steps, title })} />
          <Repeater
            items={draft.steps.items}
            onChange={(items) => set("steps", { ...draft.steps, items })}
            create={() => ({ title: { ...emptyT }, desc: { ...emptyT } })}
            addLabel={pick("إضافة خطوة", "Add step")}
            render={(item, update) => (
              <>
                <PairField label={pick("العنوان", "Title")} value={item.title} onChange={(title) => update({ ...item, title })} />
                <PairField label={pick("الوصف", "Description")} value={item.desc} onChange={(desc) => update({ ...item, desc })} long />
              </>
            )}
          />
        </div>
      </Modal>

      {/* Pricing */}
      <Modal open={open === "pricing"} onClose={() => setOpen(null)} title={pick("الباقات والأسعار", "Plans & pricing")}>
        <div className="space-y-4">
          <PairField label={pick("العنوان الصغير", "Eyebrow")} value={draft.pricing.eyebrow} onChange={(eyebrow) => set("pricing", { ...draft.pricing, eyebrow })} />
          <PairField label={pick("العنوان", "Title")} value={draft.pricing.title} onChange={(title) => set("pricing", { ...draft.pricing, title })} />
          <PairField label={pick("الوصف", "Subtitle")} value={draft.pricing.subtitle} onChange={(subtitle) => set("pricing", { ...draft.pricing, subtitle })} long />
          <Repeater
            items={draft.pricing.plans}
            onChange={(plans) => set("pricing", { ...draft.pricing, plans })}
            create={() => ({ name: { ...emptyT }, price: "", per: { ...emptyT }, features: [], highlight: false })}
            addLabel={pick("إضافة باقة", "Add plan")}
            render={(item, update) => (
              <>
                <PairField label={pick("اسم الباقة", "Plan name")} value={item.name} onChange={(name) => update({ ...item, name })} />
                <TextField label={pick("السعر", "Price")} value={item.price} onChange={(price) => update({ ...item, price })} />
                <PairField label={pick("وحدة السعر", "Price unit")} value={item.per} onChange={(per) => update({ ...item, per })} />
                <label className="flex items-center gap-2 text-sm font-semibold">
                  <input type="checkbox" checked={item.highlight} onChange={(e) => update({ ...item, highlight: e.target.checked })} />
                  {pick("الأكثر اختياراً", "Most popular")}
                </label>
                <div>
                  <Label>{pick("مزايا الباقة", "Plan features")}</Label>
                  <Repeater
                    items={item.features}
                    onChange={(features) => update({ ...item, features })}
                    create={() => ({ ...emptyT })}
                    addLabel={pick("إضافة ميزة", "Add feature")}
                    render={(f, updateF) => <PairField label={pick("النص", "Text")} value={f} onChange={updateF} />}
                  />
                </div>
              </>
            )}
          />
        </div>
      </Modal>

      {/* Request */}
      <Modal open={open === "request"} onClose={() => setOpen(null)} title={pick("نموذج الطلب", "Request form")}>
        <div className="space-y-4">
          <PairField label={pick("العنوان", "Title")} value={draft.request.title} onChange={(title) => set("request", { ...draft.request, title })} />
          <PairField label={pick("الوصف", "Subtitle")} value={draft.request.subtitle} onChange={(subtitle) => set("request", { ...draft.request, subtitle })} long />
        </div>
      </Modal>

      {/* Contact */}
      <Modal open={open === "contact"} onClose={() => setOpen(null)} title={pick("بيانات التواصل", "Contact details")}>
        <div className="space-y-4">
          <PairField label={pick("العنوان", "Title")} value={draft.contact.title} onChange={(title) => set("contact", { ...draft.contact, title })} />
          <PairField label={pick("الوصف", "Subtitle")} value={draft.contact.subtitle} onChange={(subtitle) => set("contact", { ...draft.contact, subtitle })} long />
          <PairField label={pick("ساعات العمل", "Opening hours")} value={draft.contact.hours} onChange={(hours) => set("contact", { ...draft.contact, hours })} />
          <TextField label={pick("البريد الإلكتروني", "Email")} value={draft.contact.email} onChange={(email) => set("contact", { ...draft.contact, email })} />
          <TextField label={pick("رابط إنستقرام", "Instagram link")} value={draft.contact.instagram} onChange={(instagram) => set("contact", { ...draft.contact, instagram })} />
          <TextField label={pick("اسم حساب إنستقرام", "Instagram handle")} value={draft.contact.instagramLabel} onChange={(instagramLabel) => set("contact", { ...draft.contact, instagramLabel })} />
          <div>
            <p className="mb-2 font-display text-sm font-bold">{pick("الفروع والهواتف", "Branches & phones")}</p>
            <Repeater
              items={draft.contact.branches}
              onChange={(branches) => set("contact", { ...draft.contact, branches })}
              create={() => ({ name: { ...emptyT }, phone: "" })}
              addLabel={pick("إضافة فرع", "Add branch")}
              render={(item, update) => (
                <>
                  <PairField label={pick("الاسم", "Name")} value={item.name} onChange={(name) => update({ ...item, name })} />
                  <TextField label={pick("الهاتف", "Phone")} value={item.phone} onChange={(phone) => update({ ...item, phone })} />
                </>
              )}
            />
          </div>
        </div>
      </Modal>

      {/* Footer */}
      <Modal open={open === "footer"} onClose={() => setOpen(null)} title={pick("التذييل", "Footer")}>
        <div className="space-y-4">
          <PairField label={pick("نبذة", "Tagline")} value={draft.footer.tagline} onChange={(tagline) => set("footer", { ...draft.footer, tagline })} long />
          <PairField label={pick("عنوان عمود الموقع", "Website column title")} value={draft.footer.websiteTitle} onChange={(websiteTitle) => set("footer", { ...draft.footer, websiteTitle })} />
          <PairField label={pick("عنوان عمود التواصل", "Contact column title")} value={draft.footer.contactTitle} onChange={(contactTitle) => set("footer", { ...draft.footer, contactTitle })} />
          <PairField label={pick("نص حقوق النشر", "Copyright text")} value={draft.footer.copyright} onChange={(copyright) => set("footer", { ...draft.footer, copyright })} />
        </div>
      </Modal>

      {/* SEO */}
      <Modal open={open === "seo"} onClose={() => setOpen(null)} title={pick("تحسين الظهور SEO", "SEO")}>
        <div className="space-y-4">
          <TextField
            label={pick("صورة المشاركة (رابط كامل)", "Share image (absolute URL)")}
            value={draft.seo.ogImage}
            onChange={(ogImage) => set("seo", { ...draft.seo, ogImage })}
          />
          {(["home", "features", "pricing", "contact"] as const).map((page) => (
            <div key={page} className="rounded-2xl border border-border p-4">
              <p className="mb-3 font-display text-sm font-bold capitalize">{page}</p>
              <div className="space-y-3">
                <TextField
                  label={pick("عنوان الصفحة", "Page title")}
                  value={draft.seo[page].title}
                  onChange={(title) => set("seo", { ...draft.seo, [page]: { ...draft.seo[page], title } })}
                />
                <div>
                  <Label>{pick("الوصف", "Description")}</Label>
                  <textarea
                    className={area}
                    value={draft.seo[page].description}
                    onChange={(e) =>
                      set("seo", { ...draft.seo, [page]: { ...draft.seo[page], description: e.target.value } })
                    }
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Modal>

      <div className={cn("text-xs text-muted-foreground", save.isPending && "opacity-60")}>
        {pick(
          "التعديلات تُحفظ عند الضغط على «حفظ ونشر».",
          "Changes go live when you press Save & publish.",
        )}
      </div>
    </section>
  );
}
