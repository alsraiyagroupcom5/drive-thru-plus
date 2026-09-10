import { queryOptions } from "@tanstack/react-query";
import {
  BarChart3,
  Car,
  ChefHat,
  CreditCard,
  Languages,
  LayoutDashboard,
  Percent,
  QrCode,
  ShieldCheck,
  Smartphone,
  Store,
  Users,
  type LucideIcon,
} from "lucide-react";
import { getSiteContent } from "@/lib/site.functions";

export type T = { ar: string; en: string };

export type SiteContent = {
  brand: { logoUrl: string | null; name: T; showName: boolean };
  nav: { to: string; label: T }[];
  access: { to: string; label: T }[];
  hero: {
    badge: T;
    title: T;
    subtitle: T;
    primary: { label: T; to: string };
    secondary: { label: T; to: string };
    imageUrl: string | null;
    imageAlt: T;
    stats: { value: string; label: T }[];
  };
  slides: { imageUrl: string | null; title: T; text: T }[];
  features: { eyebrow: T; title: T; subtitle: T; items: { icon: string; title: T; desc: T }[] };
  roles: {
    eyebrow: T;
    title: T;
    subtitle: T;
    items: { icon: string; title: T; linkLabel: T; to: string; points: T[] }[];
  };
  steps: { title: T; items: { title: T; desc: T }[] };
  pricing: {
    eyebrow: T;
    title: T;
    subtitle: T;
    plans: { name: T; price: string; per: T; features: T[]; highlight: boolean }[];
  };
  request: { title: T; subtitle: T };
  contact: {
    title: T;
    subtitle: T;
    hours: T;
    email: string;
    instagram: string;
    instagramLabel: string;
    branches: { name: T; phone: string }[];
  };
  footer: { tagline: T; websiteTitle: T; contactTitle: T; copyright: T };
  seo: {
    ogImage: string;
    home: { title: string; description: string };
    features: { title: string; description: string };
    pricing: { title: string; description: string };
    contact: { title: string; description: string };
  };
};

export const SITE_ICONS: Record<string, LucideIcon> = {
  Smartphone,
  Car,
  ChefHat,
  Store,
  Percent,
  BarChart3,
  CreditCard,
  Languages,
  ShieldCheck,
  LayoutDashboard,
  Users,
  QrCode,
};

export function siteIcon(key: string): LucideIcon {
  return SITE_ICONS[key] ?? Smartphone;
}

const t = (ar: string, en: string): T => ({ ar, en });

export const DEFAULT_SITE_CONTENT: SiteContent = {
  brand: {
    logoUrl: null,
    name: t("QR-Spring", "QR-Spring"),
    showName: false,
  },
  nav: [
    { to: "/", label: t("الرئيسية", "Home") },
    { to: "/features", label: t("المزايا", "Features") },
    { to: "/pricing", label: t("الأسعار", "Pricing") },
    { to: "/contact", label: t("تواصل معنا", "Contact") },
  ],
  access: [
    { to: "/admin", label: t("المسؤول العام", "Platform admin") },
    { to: "/owner", label: t("مالك المطعم", "Restaurant owner") },
    { to: "/auth", label: t("فريق الفرع", "Branch team") },
    { to: "/app", label: t("تطبيق العملاء", "Customer app") },
  ],
  hero: {
    badge: t("جاهز للإطلاق خلال 48 ساعة", "Live in 48 hours"),
    title: t(
      "منصة الطلب الذكية للمطاعم والدرايف ثرو",
      "The smart drive-thru ordering platform for restaurants",
    ),
    subtitle: t(
      "تطبيق طلب بعلامتك التجارية، شاشة مطبخ مباشرة، تحكم كامل بالفروع والمنيو والخصومات، وتقارير لحظية — كل ذلك بحساب واحد لمطعمك.",
      "A branded ordering app, a live kitchen screen, full control of branches, menu and discounts, and real-time reporting — all in one account for your restaurant.",
    ),
    primary: { label: t("اطلب حساب مطعمك", "Request your account"), to: "/contact" },
    secondary: { label: t("جرّب التطبيق الحي", "See the live demo"), to: "/app" },
    imageUrl: null,
    imageAlt: t(
      "سيارة تستلم طلبها من نافذة الدرايف ثرو",
      "A car collecting an order at a drive-thru window",
    ),
    stats: [
      { value: "9", label: t("دقائق متوسط التحضير", "min average prep") },
      { value: "3×", label: t("أسرع في الطابور", "faster queue") },
      { value: "24/7", label: t("لوحة تحكم مباشرة", "live dashboard") },
    ],
  },
  slides: [],
  features: {
    eyebrow: t("المزايا", "Features"),
    title: t("كل ما يحتاجه مطعمك في مكان واحد", "Everything your restaurant needs, in one place"),
    subtitle: t(
      "كل أداة مصممة لثلاثة أهداف: تجربة عميل ممتازة، سرعة في الطلب، ووضوح تشغيلي كامل.",
      "Every tool is built for three goals: a great customer experience, order speed and complete operational visibility.",
    ),
    items: [
      {
        icon: "Smartphone",
        title: t("طلب من الجوال في أقل من دقيقة", "Mobile ordering in under a minute"),
        desc: t(
          "منيو سريع بالصور، تخصيص المشروب، وسلة ذكية مع اقتراحات إضافية.",
          "A fast visual menu, drink customisation and a smart cart with upsells.",
        ),
      },
      {
        icon: "Car",
        title: t("زر «وصلت» يخطر الفرع", "“I'm here” alerts the branch"),
        desc: t(
          "يضغط العميل عند وصوله فيظهر فوراً على شاشة الفرع مع بيانات سيارته.",
          "The customer taps on arrival and appears instantly on the branch screen with car details.",
        ),
      },
      {
        icon: "ChefHat",
        title: t("شاشة مطبخ مباشرة", "Live kitchen screen"),
        desc: t(
          "طلبات لحظية مع مؤقت لكل طلب وتحديث الحالة بضغطة واحدة.",
          "Real-time tickets with per-order timers and one-tap status updates.",
        ),
      },
      {
        icon: "Store",
        title: t("تحكم كامل بالفروع", "Full branch control"),
        desc: t(
          "ساعات العمل، الهاتف، الموقع، متوسط التحضير وحالة الفتح لكل فرع.",
          "Hours, phone, location, average prep time and open state for every branch.",
        ),
      },
      {
        icon: "Percent",
        title: t("خصومات ونفاد يومي", "Discounts and daily stock"),
        desc: t(
          "خصم على أي صنف، أو وسمه نافداً لليوم فقط ويعود تلقائياً غداً.",
          "Discount any item, or mark it out of stock for today — it returns automatically tomorrow.",
        ),
      },
      {
        icon: "BarChart3",
        title: t("تقارير المبيعات والسرعة", "Sales and speed reporting"),
        desc: t(
          "مبيعات اليوم، عدد الطلبات، الطلبات قيد التنفيذ وأسرع الفروع.",
          "Today's revenue, order counts, in-progress orders and fastest branches.",
        ),
      },
      {
        icon: "CreditCard",
        title: t("دفع إلكتروني أو عند الاستلام", "Online payment or pay at pickup"),
        desc: t(
          "بوابة دفع محاكاة جاهزة للربط مع مزودك المفضل.",
          "A payment layer ready to connect to your preferred provider.",
        ),
      },
      {
        icon: "Languages",
        title: t("عربي وإنجليزي مع وضع ليلي", "Arabic and English with dark mode"),
        desc: t(
          "واجهة كاملة RTL/LTR وثيم فاتح وداكن لكل الشاشات.",
          "Complete RTL/LTR interface with light and dark themes across every screen.",
        ),
      },
    ],
  },
  roles: {
    eyebrow: t("الوصول", "Access"),
    title: t("لوحة لكل دور في مطعمك", "A console for every role in your restaurant"),
    subtitle: t(
      "المسؤول العام ينشئ المطاعم والحسابات، المالك يدير الفروع والمنيو، والفريق يشغّل الطلبات — والعميل يطلب من جواله.",
      "The admin creates restaurants and accounts, the owner runs branches and menu, the team works the orders — and the customer orders from their phone.",
    ),
    items: [
      {
        icon: "ShieldCheck",
        title: t("المسؤول العام", "Platform admin"),
        linkLabel: t("دخول المسؤول", "Admin console"),
        to: "/admin",
        points: [
          t("إنشاء مطعم جديد ومجموعته", "Create a new restaurant and its group"),
          t("إنشاء حساب المالك وحسابات الفريق", "Create the owner account and team accounts"),
          t("إضافة الفروع وربط كل حساب بفرعه", "Add branches and bind each account to its branch"),
          t("تغيير الأدوار وإعادة تعيين كلمات المرور", "Change roles and reset passwords"),
          t("متابعة الطلبات والإيرادات لكل المطاعم", "Track orders and revenue across all restaurants"),
        ],
      },
      {
        icon: "LayoutDashboard",
        title: t("مالك المطعم", "Restaurant owner"),
        linkLabel: t("دخول المالك", "Owner console"),
        to: "/owner",
        points: [
          t("إنشاء وتعديل الفروع وبياناتها وموقعها", "Create and edit branches, details and location"),
          t("بناء المنيو: الأصناف، الأسعار، الصور، السعرات", "Build the menu: items, prices, images, calories"),
          t("إسناد الأصناف لفروع محددة", "Assign items to specific branches"),
          t("خصومات فورية ونفاد مخزون لليوم", "Instant discounts and out-of-stock for today"),
          t("حسابات الموظفين وصلاحياتهم", "Staff accounts and their privileges"),
        ],
      },
      {
        icon: "Users",
        title: t("فريق الفرع والمطبخ", "Branch and kitchen team"),
        linkLabel: t("دخول الفريق", "Team login"),
        to: "/live",
        points: [
          t("شاشة طلبات مباشرة لكل فرع", "A live order screen per branch"),
          t("تحديث الحالة: تحضير، جاهز، تم التسليم", "Update status: preparing, ready, handed over"),
          t("تنبيه فوري عند وصول العميل", "Instant alert when the customer arrives"),
          t("مؤقت لكل طلب لقياس السرعة", "A timer on every order to measure speed"),
        ],
      },
      {
        icon: "QrCode",
        title: t("تطبيق العملاء", "Customer app"),
        linkLabel: t("جرّب التطبيق", "Open the app"),
        to: "/app",
        points: [
          t("اختيار الفرع ومشاهدة وقت التحضير", "Pick a branch and see prep time"),
          t("منيو بالصور مع تخصيص كامل", "A visual menu with full customisation"),
          t("دفع إلكتروني أو عند الاستلام", "Pay online or at pickup"),
          t("تتبّع الطلب لحظة بلحظة وإعادة الطلب", "Track the order live and reorder in one tap"),
        ],
      },
    ],
  },
  steps: {
    title: t("ثلاث خطوات للانطلاق", "Three steps to go live"),
    items: [
      {
        title: t("أرسل طلبك", "Send your request"),
        desc: t(
          "املأ نموذج التواصل ببيانات مطعمك وعدد فروعك.",
          "Fill in the contact form with your restaurant details and branch count.",
        ),
      },
      {
        title: t("ننشئ حسابك وفروعك", "We create your account and branches"),
        desc: t(
          "يجهّز المسؤول العام حساب المالك والفروع وحسابات الفريق.",
          "The platform admin sets up the owner account, branches and team accounts.",
        ),
      },
      {
        title: t("ارفع المنيو وابدأ البيع", "Upload your menu and start selling"),
        desc: t(
          "المالك يبني المنيو ويشغّل الطلبات خلال ساعات.",
          "The owner builds the menu and goes live within hours.",
        ),
      },
    ],
  },
  pricing: {
    eyebrow: t("الأسعار", "Pricing"),
    title: t("باقات واضحة بدون مفاجآت", "Clear plans, no surprises"),
    subtitle: t(
      "الأسعار بالريال القطري، تشمل الاستضافة والدعم.",
      "Prices in Qatari Riyal, hosting and support included.",
    ),
    plans: [
      {
        name: t("البداية", "Starter"),
        price: "349",
        per: t("لكل فرع / شهرياً", "per branch / month"),
        highlight: false,
        features: [
          t("تطبيق طلب بعلامتك التجارية", "Branded ordering app"),
          t("شاشة مطبخ مباشرة", "Live kitchen screen"),
          t("منيو ثنائي اللغة", "Bilingual menu"),
          t("رمز QR للسيارة", "Drive-thru QR code"),
        ],
      },
      {
        name: t("النمو", "Growth"),
        price: "649",
        per: t("لكل فرع / شهرياً", "per branch / month"),
        highlight: true,
        features: [
          t("كل مزايا البداية", "Everything in Starter"),
          t("خصومات ونفاد المخزون اليومي", "Discounts and daily stock control"),
          t("لوحة مالك متعددة الفروع", "Multi-branch owner console"),
          t("تقارير المبيعات وسرعة التحضير", "Sales and speed reporting"),
          t("حسابات للموظفين حسب الدور", "Role-based staff accounts"),
        ],
      },
      {
        name: t("المؤسسات", "Enterprise"),
        price: "—",
        per: t("تسعير مخصص", "custom pricing"),
        highlight: false,
        features: [
          t("عدد فروع غير محدود", "Unlimited branches"),
          t("تكامل مع نقاط البيع", "POS integrations"),
          t("مدير حساب مخصص", "Dedicated account manager"),
          t("اتفاقية مستوى خدمة", "Service level agreement"),
        ],
      },
    ],
  },
  request: {
    title: t("اطلب حساب مطعمك", "Request your restaurant account"),
    subtitle: t(
      "املأ البيانات وسيتواصل فريقنا لإنشاء حسابك وفروعك.",
      "Fill in your details and our team will set up your account and branches.",
    ),
  },
  contact: {
    title: t("تواصل معنا", "Contact us"),
    subtitle: t(
      "فريقنا جاهز للرد على أسئلتك وتجهيز حساب مطعمك.",
      "Our team is ready to answer your questions and set up your restaurant account.",
    ),
    hours: t("يومياً ٧ صباحاً – ١٢ منتصف الليل", "Daily 7AM – 12AM"),
    email: "hello@origami.qa",
    instagram: "https://www.instagram.com/origami.qa/",
    instagramLabel: "origami.qa",
    branches: [
      { name: t("سوق الدحيل الليلي", "Duhail Night Market"), phone: "60020078" },
      { name: t("أسباير داون تاون", "Aspire Downtown"), phone: "66741689" },
      { name: t("لوسيل مارينا", "Lusail Marina"), phone: "51358247" },
    ],
  },
  footer: {
    tagline: t(
      "منصة طلب ذكية للمطاعم والدرايف ثرو في قطر.",
      "A smart ordering platform for restaurants and drive-thrus in Qatar.",
    ),
    websiteTitle: t("الموقع", "Website"),
    contactTitle: t("تواصل", "Get in touch"),
    copyright: t("QR-Spring", "QR-Spring"),
  },
  seo: {
    ogImage:
      "https://drive-thru-plus.lovable.app/__l5e/assets-v1/0cec0fac-0bcd-4383-8e30-8462ae4a84b5/qr-spring-og.jpg",
    home: {
      title: "QR-Spring — smart drive-thru ordering for restaurants",
      description:
        "QR-Spring gives restaurants a branded ordering app, live kitchen screen, branch and menu control, discounts and reporting. Plans from QAR 349 per branch monthly in Qatar.",
    },
    features: {
      title: "Features — ordering, kitchen screen, branch control | QR-Spring",
      description:
        "Every feature of the QR-Spring ordering platform: customer app, live kitchen display, branch and menu control, discounts, staff privileges and reporting.",
    },
    pricing: {
      title: "Pricing — plans from QAR 349 per branch | QR-Spring",
      description:
        "Simple QR-Spring plans for restaurants in Qatar: Starter, Growth and Enterprise, with hosting, updates and support included.",
    },
    contact: {
      title: "Contact QR-Spring — request your restaurant account",
      description:
        "Talk to the QR-Spring team: phone numbers, email and a request form to set up your restaurant ordering account.",
    },
  },
};

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Deep-merge stored content over the defaults so missing keys never break the site. */
export function mergeSiteContent(raw: unknown): SiteContent {
  const merge = (base: unknown, over: unknown): unknown => {
    if (Array.isArray(base)) return Array.isArray(over) ? over : base;
    if (isObject(base)) {
      if (!isObject(over)) return base;
      const out: Record<string, unknown> = { ...base };
      for (const key of Object.keys(base)) out[key] = merge(base[key], over[key]);
      return out;
    }
    return over === undefined || over === null ? base : over;
  };
  return merge(DEFAULT_SITE_CONTENT, raw) as SiteContent;
}

export const siteContentQuery = queryOptions({
  queryKey: ["site-content"],
  queryFn: async () => mergeSiteContent(await getSiteContent()),
  staleTime: 60_000,
});
