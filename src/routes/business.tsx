import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import {
  ArrowRight,
  BarChart3,
  Car,
  Check,
  ChefHat,
  Clock,
  CreditCard,
  Languages,
  QrCode,
  ShieldCheck,
  Smartphone,
  Store,
} from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { submitSignupRequest } from "@/lib/admin.functions";
import logo from "@/assets/origami-logo.jpg.asset.json";
import heroImage from "@/assets/business-hero.jpg";

export const Route = createFileRoute("/business")({
  head: () => ({
    meta: [
      { title: "Drive-thru ordering platform for restaurants — Origami Platform" },
      {
        name: "description",
        content:
          "Launch branded drive-thru ordering in days: menu, live kitchen screen, branch controls, discounts and reporting. Plans from QAR 349 per branch monthly.",
      },
      { property: "og:title", content: "Drive-thru ordering platform for restaurants" },
      {
        property: "og:description",
        content: "Branded ordering app, live kitchen display and branch analytics in one platform.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BusinessPage,
});

const PLANS = [
  {
    id: "starter",
    ar: "البداية",
    en: "Starter",
    price: "349",
    perAr: "لكل فرع / شهرياً",
    perEn: "per branch / month",
    featuresAr: [
      "تطبيق طلب بعلامتك التجارية",
      "شاشة مطبخ مباشرة",
      "منيو ثنائي اللغة",
      "رمز QR للسيارة",
    ],
    featuresEn: [
      "Branded ordering app",
      "Live kitchen screen",
      "Bilingual menu",
      "Drive-thru QR code",
    ],
  },
  {
    id: "growth",
    ar: "النمو",
    en: "Growth",
    price: "649",
    perAr: "لكل فرع / شهرياً",
    perEn: "per branch / month",
    featuresAr: [
      "كل مزايا البداية",
      "خصومات ونفاد المخزون اليومي",
      "لوحة مالك متعددة الفروع",
      "تقارير المبيعات وسرعة التحضير",
      "حسابات للموظفين حسب الدور",
    ],
    featuresEn: [
      "Everything in Starter",
      "Discounts and daily stock control",
      "Multi-branch owner console",
      "Sales and speed reporting",
      "Role-based staff accounts",
    ],
    highlight: true,
  },
  {
    id: "enterprise",
    ar: "المؤسسات",
    en: "Enterprise",
    price: "—",
    perAr: "تسعير مخصص",
    perEn: "custom pricing",
    featuresAr: [
      "عدد فروع غير محدود",
      "تكامل مع نقاط البيع",
      "مدير حساب مخصص",
      "اتفاقية مستوى خدمة",
    ],
    featuresEn: [
      "Unlimited branches",
      "POS integrations",
      "Dedicated account manager",
      "Service level agreement",
    ],
  },
] as const;

const FEATURES = [
  { icon: Smartphone, ar: "طلب من الجوال في أقل من دقيقة", en: "Mobile ordering in under a minute" },
  { icon: Car, ar: "زر «وصلت» يخطر الفرع لحظة الوصول", en: "“I'm here” alerts the branch on arrival" },
  { icon: ChefHat, ar: "شاشة مطبخ مباشرة مع مؤقت لكل طلب", en: "Live kitchen screen with per-order timers" },
  { icon: Store, ar: "تحكم كامل بالفروع والمنيو والأسعار", en: "Full control of branches, menu and prices" },
  { icon: BarChart3, ar: "تقارير المبيعات وسرعة الخدمة", en: "Sales and service-speed reporting" },
  { icon: CreditCard, ar: "دفع إلكتروني أو عند الاستلام", en: "Online payment or pay at pickup" },
  { icon: Languages, ar: "عربي وإنجليزي مع وضع ليلي", en: "Arabic and English with dark mode" },
  { icon: ShieldCheck, ar: "صلاحيات آمنة لكل موظف", en: "Secure permissions for every employee" },
];

const STEPS = [
  { ar: "أرسل طلبك", en: "Send your request" },
  { ar: "ننشئ حسابك وفروعك", en: "We create your account and branches" },
  { ar: "ارفع المنيو وابدأ البيع", en: "Upload your menu and start selling" },
];

const input =
  "h-11 w-full rounded-xl border border-border bg-elevated px-3 text-sm outline-none ring-ring/40 focus:ring-2";

function BusinessPage() {
  const { pick, dir, toggle } = useI18n();
  const { theme, toggle: toggleTheme } = useTheme();

  const [plan, setPlan] = useState<string>("growth");
  const [form, setForm] = useState({
    restaurantName: "",
    contactName: "",
    email: "",
    phone: "",
    branchesCount: 1,
    message: "",
  });
  const [sent, setSent] = useState(false);

  const submit = useMutation({
    mutationFn: () => submitSignupRequest({ data: { ...form, plan } }),
    onSuccess: () => {
      setSent(true);
      toast.success(pick("تم استلام طلبك، سنتواصل معك قريباً", "Request received — we'll be in touch"));
    },
    onError: () => toast.error(pick("تعذّر الإرسال، حاول مرة أخرى", "Could not send, please try again")),
  });

  const valid =
    form.restaurantName.trim() && form.contactName.trim() && form.email.includes("@");

  return (
    <div dir={dir} className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border/70 bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
          <div className="flex items-center gap-2.5">
            <img
              src={logo.url}
              alt="Origami Platform"
              width={36}
              height={36}
              className="h-9 w-9 rounded-xl border border-border bg-white object-contain p-0.5"
            />
            <span className="font-display text-base font-bold">
              {pick("منصة أوريغامي", "Origami Platform")}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              aria-label={theme === "light" ? "Dark mode" : "Light mode"}
              className="rounded-full border border-border px-3 py-1.5 text-xs"
            >
              {theme === "light" ? "🌙" : "☀️"}
            </button>
            <button onClick={toggle} className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold">
              {pick("English", "العربية")}
            </button>
            <a
              href="#request"
              className="rounded-full bg-[image:var(--gradient-brass)] px-4 py-2 text-xs font-bold text-primary-foreground"
            >
              {pick("اطلب حسابك", "Get your account")}
            </a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-8 px-5 py-12 md:grid-cols-2 md:py-20">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary">
            <Clock className="h-3.5 w-3.5" aria-hidden />
            {pick("جاهز للإطلاق خلال 48 ساعة", "Live in 48 hours")}
          </span>
          <h1 className="mt-4 font-display text-4xl font-bold leading-tight md:text-5xl">
            {pick(
              "منصة الطلب الذكية للمطاعم والدرايف ثرو",
              "The smart drive-thru ordering platform for restaurants",
            )}
          </h1>
          <p className="mt-4 max-w-xl text-base text-muted-foreground">
            {pick(
              "تطبيق طلب بعلامتك التجارية، شاشة مطبخ مباشرة، تحكم كامل بالفروع والمنيو والخصومات، وتقارير لحظية — كل ذلك بحساب واحد لمطعمك.",
              "A branded ordering app, a live kitchen screen, full control of branches, menu and discounts, and real-time reporting — all in one account for your restaurant.",
            )}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="#request"
              className="inline-flex items-center gap-2 rounded-full bg-[image:var(--gradient-brass)] px-6 py-3.5 font-display text-sm font-bold text-primary-foreground shadow-[var(--shadow-lift)]"
            >
              {pick("اطلب حساب مطعمك", "Request your account")}
              <ArrowRight className={cn("h-4 w-4", dir === "rtl" && "rotate-180")} aria-hidden />
            </a>
            <Link
              to="/"
              search={{ branch: undefined }}
              className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3.5 text-sm font-semibold"
            >
              {pick("جرّب التطبيق الحي", "See the live demo")}
            </Link>
          </div>
          <dl className="mt-8 grid max-w-md grid-cols-3 gap-4">
            {[
              { v: "9", ar: "دقائق متوسط التحضير", en: "min average prep" },
              { v: "3×", ar: "أسرع في الطابور", en: "faster queue" },
              { v: "24/7", ar: "لوحة تحكم مباشرة", en: "live dashboard" },
            ].map((s) => (
              <div key={s.en}>
                <dt className="font-display text-2xl font-bold text-primary">{s.v}</dt>
                <dd className="text-[11px] text-muted-foreground">{pick(s.ar, s.en)}</dd>
              </div>
            ))}
          </dl>
        </div>
        <img
          src={heroImage}
          alt={pick("سيارة تستلم طلبها من نافذة الدرايف ثرو", "A car collecting an order at a drive-thru window")}
          width={1600}
          height={1008}
          className="w-full rounded-3xl border border-border object-cover shadow-[var(--shadow-lift)]"
        />
      </section>

      {/* Features */}
      <section className="border-y border-border bg-card/50 py-14">
        <div className="mx-auto max-w-6xl px-5">
          <h2 className="font-display text-2xl font-bold md:text-3xl">
            {pick("كل ما يحتاجه مطعمك في مكان واحد", "Everything your restaurant needs, in one place")}
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <div key={f.en} className="surface rounded-2xl p-5">
                <f.icon className="h-5 w-5 text-primary" aria-hidden />
                <p className="mt-3 text-sm font-semibold">{pick(f.ar, f.en)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-5 py-14">
        <h2 className="font-display text-2xl font-bold md:text-3xl">
          {pick("ثلاث خطوات للانطلاق", "Three steps to go live")}
        </h2>
        <ol className="mt-8 grid gap-4 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.en} className="surface rounded-2xl p-5">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-primary/10 font-display font-bold text-primary">
                {i + 1}
              </span>
              <p className="mt-3 text-sm font-semibold">{pick(s.ar, s.en)}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Pricing */}
      <section className="border-y border-border bg-card/50 py-14">
        <div className="mx-auto max-w-6xl px-5">
          <h2 className="font-display text-2xl font-bold md:text-3xl">
            {pick("باقات واضحة بدون مفاجآت", "Clear plans, no surprises")}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {pick("الأسعار بالريال القطري، تشمل الاستضافة والدعم.", "Prices in Qatari Riyal, hosting and support included.")}
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {PLANS.map((p) => (
              <div
                key={p.id}
                className={cn(
                  "surface flex flex-col rounded-3xl p-6",
                  p.id === plan && "ring-2 ring-primary",
                )}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-lg font-bold">{pick(p.ar, p.en)}</h3>
                  {"highlight" in p && p.highlight ? (
                    <span className="rounded-full bg-primary/15 px-2.5 py-1 text-[10px] font-bold text-primary">
                      {pick("الأكثر اختياراً", "Most popular")}
                    </span>
                  ) : null}
                </div>
                <p className="mt-3 font-display text-3xl font-bold">
                  {p.price}
                  <span className="ms-1 text-sm font-semibold text-muted-foreground">
                    {p.price === "—" ? "" : pick("ر.ق", "QAR")}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">{pick(p.perAr, p.perEn)}</p>
                <ul className="mt-4 flex-1 space-y-2 text-sm">
                  {(pick(p.featuresAr, p.featuresEn) as readonly string[]).map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                      {f}
                    </li>
                  ))}
                </ul>
                <a
                  href="#request"
                  onClick={() => setPlan(p.id)}
                  className={cn(
                    "mt-6 rounded-full py-3 text-center text-sm font-bold",
                    p.id === plan
                      ? "bg-[image:var(--gradient-brass)] text-primary-foreground"
                      : "border border-border",
                  )}
                >
                  {pick("اختر هذه الباقة", "Choose this plan")}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Request form */}
      <section id="request" className="mx-auto max-w-3xl scroll-mt-20 px-5 py-14">
        <div className="surface rounded-3xl p-6 md:p-8">
          <h2 className="font-display text-2xl font-bold">
            {pick("اطلب حساب مطعمك", "Request your restaurant account")}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {pick(
              "املأ البيانات وسيتواصل فريقنا لإنشاء حسابك وفروعك.",
              "Fill in your details and our team will set up your account and branches.",
            )}
          </p>

          {sent ? (
            <div className="mt-6 rounded-2xl border border-primary/30 bg-primary/10 p-6 text-center">
              <QrCode className="mx-auto h-8 w-8 text-primary" aria-hidden />
              <p className="mt-3 font-display text-lg font-bold">
                {pick("تم استلام طلبك", "Request received")}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {pick("سنتواصل معك خلال يوم عمل واحد.", "We'll contact you within one business day.")}
              </p>
            </div>
          ) : (
            <>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <input
                  className={input}
                  placeholder={pick("اسم المطعم", "Restaurant name")}
                  value={form.restaurantName}
                  onChange={(e) => setForm({ ...form, restaurantName: e.target.value })}
                />
                <input
                  className={input}
                  placeholder={pick("اسم المسؤول", "Contact name")}
                  value={form.contactName}
                  onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                />
                <input
                  className={input}
                  dir="ltr"
                  type="email"
                  placeholder="name@restaurant.qa"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
                <input
                  className={input}
                  dir="ltr"
                  placeholder={pick("رقم الجوال", "Phone number")}
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
                <input
                  className={input}
                  type="number"
                  min={1}
                  placeholder={pick("عدد الفروع", "Number of branches")}
                  value={form.branchesCount}
                  onChange={(e) => setForm({ ...form, branchesCount: Number(e.target.value) })}
                />
                <select className={input} value={plan} onChange={(e) => setPlan(e.target.value)}>
                  {PLANS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {pick(p.ar, p.en)}
                    </option>
                  ))}
                </select>
              </div>
              <textarea
                className="mt-3 min-h-24 w-full rounded-xl border border-border bg-elevated p-3 text-sm outline-none ring-ring/40 focus:ring-2"
                placeholder={pick("أخبرنا عن مطعمك", "Tell us about your restaurant")}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
              />
              <button
                onClick={() => submit.mutate()}
                disabled={!valid || submit.isPending}
                className="mt-5 w-full rounded-full bg-[image:var(--gradient-brass)] py-3.5 font-display font-bold text-primary-foreground disabled:opacity-50"
              >
                {submit.isPending ? pick("جارٍ الإرسال…", "Sending…") : pick("إرسال الطلب", "Send request")}
              </button>
            </>
          )}
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        <p>{pick("منصة أوريغامي للطلب الذكي", "Origami smart ordering platform")}</p>
        <div className="mt-2 flex justify-center gap-4">
          <Link to="/" search={{ branch: undefined }} className="underline underline-offset-4">
            {pick("تطبيق العملاء", "Customer app")}
          </Link>
          <Link to="/auth" className="underline underline-offset-4">
            {pick("دخول الفريق", "Team login")}
          </Link>
        </div>
      </footer>
    </div>
  );
}
