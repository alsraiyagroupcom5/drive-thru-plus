import {
  BarChart3,
  Bike,
  Car,
  ChefHat,
  CreditCard,
  Languages,
  LayoutDashboard,
  MapPin,
  Package,
  Percent,
  QrCode,
  ShieldCheck,
  Smartphone,
  Store,
  Users,
  type LucideIcon,
} from "lucide-react";

export type Plan = {
  id: string;
  ar: string;
  en: string;
  price: string;
  perAr: string;
  perEn: string;
  featuresAr: string[];
  featuresEn: string[];
  highlight?: boolean;
};

export const PLANS: Plan[] = [
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
];

export type Feature = { icon: LucideIcon; ar: string; en: string; descAr: string; descEn: string };

export const FEATURES: Feature[] = [
  {
    icon: Smartphone,
    ar: "طلب من الجوال في أقل من دقيقة",
    en: "Mobile ordering in under a minute",
    descAr: "منيو سريع بالصور، تخصيص المشروب، وسلة ذكية مع اقتراحات إضافية.",
    descEn: "A fast visual menu, drink customisation and a smart cart with upsells.",
  },
  {
    icon: Car,
    ar: "زر «وصلت» يخطر الفرع",
    en: "“I'm here” alerts the branch",
    descAr: "يضغط العميل عند وصوله فيظهر فوراً على شاشة الفرع مع بيانات سيارته.",
    descEn: "The customer taps on arrival and appears instantly on the branch screen with car details.",
  },
  {
    icon: ChefHat,
    ar: "شاشة مطبخ مباشرة",
    en: "Live kitchen screen",
    descAr: "طلبات لحظية مع مؤقت لكل طلب وتحديث الحالة بضغطة واحدة.",
    descEn: "Real-time tickets with per-order timers and one-tap status updates.",
  },
  {
    icon: Store,
    ar: "تحكم كامل بالفروع",
    en: "Full branch control",
    descAr: "ساعات العمل، الهاتف، الموقع، متوسط التحضير وحالة الفتح لكل فرع.",
    descEn: "Hours, phone, location, average prep time and open state for every branch.",
  },
  {
    icon: Percent,
    ar: "خصومات ونفاد يومي",
    en: "Discounts and daily stock",
    descAr: "خصم على أي صنف، أو وسمه نافداً لليوم فقط ويعود تلقائياً غداً.",
    descEn: "Discount any item, or mark it out of stock for today — it returns automatically tomorrow.",
  },
  {
    icon: BarChart3,
    ar: "تقارير المبيعات والسرعة",
    en: "Sales and speed reporting",
    descAr: "مبيعات اليوم، عدد الطلبات، الطلبات قيد التنفيذ وأسرع الفروع.",
    descEn: "Today's revenue, order counts, in-progress orders and fastest branches.",
  },
  {
    icon: CreditCard,
    ar: "دفع إلكتروني أو عند الاستلام",
    en: "Online payment or pay at pickup",
    descAr: "بوابة دفع محاكاة جاهزة للربط مع مزودك المفضل.",
    descEn: "A payment layer ready to connect to your preferred provider.",
  },
  {
    icon: Languages,
    ar: "عربي وإنجليزي مع وضع ليلي",
    en: "Arabic and English with dark mode",
    descAr: "واجهة كاملة RTL/LTR وثيم فاتح وداكن لكل الشاشات.",
    descEn: "Complete RTL/LTR interface with light and dark themes across every screen.",
  },
];

export type RoleBlock = {
  icon: LucideIcon;
  titleAr: string;
  titleEn: string;
  linkLabelAr: string;
  linkLabelEn: string;
  to: "/admin" | "/owner" | "/live" | "/app";
  pointsAr: string[];
  pointsEn: string[];
};

export const ROLES: RoleBlock[] = [
  {
    icon: ShieldCheck,
    titleAr: "المسؤول العام",
    titleEn: "Platform admin",
    linkLabelAr: "دخول المسؤول",
    linkLabelEn: "Admin console",
    to: "/admin",
    pointsAr: [
      "إنشاء مطعم جديد ومجموعته",
      "إنشاء حساب المالك وحسابات الفريق",
      "إضافة الفروع وربط كل حساب بفرعه",
      "تغيير الأدوار وإعادة تعيين كلمات المرور",
      "متابعة الطلبات والإيرادات لكل المطاعم",
      "استقبال طلبات الاشتراك من الموقع",
    ],
    pointsEn: [
      "Create a new restaurant and its group",
      "Create the owner account and team accounts",
      "Add branches and bind each account to its branch",
      "Change roles and reset passwords",
      "Track orders and revenue across all restaurants",
      "Receive sign-up requests from the website",
    ],
  },
  {
    icon: LayoutDashboard,
    titleAr: "مالك المطعم",
    titleEn: "Restaurant owner",
    linkLabelAr: "دخول المالك",
    linkLabelEn: "Owner console",
    to: "/owner",
    pointsAr: [
      "إنشاء وتعديل الفروع وبياناتها وموقعها",
      "بناء المنيو: الأصناف، الأسعار، الصور، السعرات",
      "إسناد الأصناف لفروع محددة",
      "خصومات فورية ونفاد مخزون لليوم",
      "متابعة الطلبات: قيد التنفيذ، جاهز، مكتمل",
      "حسابات الموظفين وصلاحياتهم",
    ],
    pointsEn: [
      "Create and edit branches, details and location",
      "Build the menu: items, prices, images, calories",
      "Assign items to specific branches",
      "Instant discounts and out-of-stock for today",
      "Follow orders: in progress, ready, completed",
      "Staff accounts and their privileges",
    ],
  },
  {
    icon: Users,
    titleAr: "فريق الفرع والمطبخ",
    titleEn: "Branch and kitchen team",
    linkLabelAr: "دخول الفريق",
    linkLabelEn: "Team login",
    to: "/live",
    pointsAr: [
      "شاشة طلبات مباشرة لكل فرع",
      "تحديث الحالة: تحضير، جاهز، تم التسليم",
      "تنبيه فوري عند وصول العميل",
      "مؤقت لكل طلب لقياس السرعة",
    ],
    pointsEn: [
      "A live order screen per branch",
      "Update status: preparing, ready, handed over",
      "Instant alert when the customer arrives",
      "A timer on every order to measure speed",
    ],
  },
  {
    icon: QrCode,
    titleAr: "تطبيق العملاء",
    titleEn: "Customer app",
    linkLabelAr: "جرّب التطبيق",
    linkLabelEn: "Open the app",
    to: "/app",
    pointsAr: [
      "اختيار الفرع ومشاهدة وقت التحضير",
      "منيو بالصور مع تخصيص كامل",
      "دفع إلكتروني أو عند الاستلام",
      "تتبّع الطلب لحظة بلحظة وإعادة الطلب",
    ],
    pointsEn: [
      "Pick a branch and see prep time",
      "A visual menu with full customisation",
      "Pay online or at pickup",
      "Track the order live and reorder in one tap",
    ],
  },
];

export const STEPS = [
  {
    ar: "أرسل طلبك",
    en: "Send your request",
    descAr: "املأ نموذج التواصل ببيانات مطعمك وعدد فروعك.",
    descEn: "Fill in the contact form with your restaurant details and branch count.",
  },
  {
    ar: "ننشئ حسابك وفروعك",
    en: "We create your account and branches",
    descAr: "يجهّز المسؤول العام حساب المالك والفروع وحسابات الفريق.",
    descEn: "The platform admin sets up the owner account, branches and team accounts.",
  },
  {
    ar: "ارفع المنيو وابدأ البيع",
    en: "Upload your menu and start selling",
    descAr: "المالك يبني المنيو ويشغّل الطلبات خلال ساعات.",
    descEn: "The owner builds the menu and goes live within hours.",
  },
];

export const CONTACT = {
  hoursAr: "يومياً ٧ صباحاً – ١٢ منتصف الليل",
  hoursEn: "Daily 7AM – 12AM",
  email: "hello@origami.qa",
  instagram: "https://www.instagram.com/origami.qa/",
  branches: [
    { ar: "سوق الدحيل الليلي", en: "Duhail Night Market", phone: "60020078" },
    { ar: "أسباير داون تاون", en: "Aspire Downtown", phone: "66741689" },
    { ar: "لوسيل مارينا", en: "Lusail Marina", phone: "51358247" },
  ],
};

export const CONTACT_ICONS = { MapPin, Package, Bike };
