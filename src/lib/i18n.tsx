import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Lang = "ar" | "en";

const dict = {
  brand: { ar: "كيو آر سبرينغ", en: "QR-Spring" },
  brandFull: { ar: "كيو آر سبرينغ", en: "QR-Spring" },
  tagline: {
    ar: "قهوة مختصة وآيس كريم وحلويات",
    en: "Specialty Coffee, Ice Cream & Desserts",
  },
  openHours: { ar: "يومياً ٧ صباحاً – ١٢ منتصف الليل", en: "Daily 7AM – 12AM" },
  callBranch: { ar: "اتصل بالفرع", en: "Call branch" },
  theme: { ar: "الوضع", en: "Theme" },
  lightMode: { ar: "الوضع الفاتح", en: "Light mode" },
  darkMode: { ar: "الوضع الداكن", en: "Dark mode" },
  goodMorning: { ar: "صباح الخير", en: "Good morning" },
  goodAfternoon: { ar: "مساء الخير", en: "Good afternoon" },
  goodEvening: { ar: "مساء الخير", en: "Good evening" },
  welcomeBack: { ar: "أهلاً بعودتك", en: "Welcome back" },
  chooseBranch: { ar: "اختر الفرع", en: "Choose a branch" },
  nearbyBranches: { ar: "الفروع القريبة", en: "Nearby branches" },
  open: { ar: "مفتوح", en: "Open" },
  closed: { ar: "مغلق", en: "Closed" },
  prepTime: { ar: "وقت التحضير", en: "Preparation time" },
  minutes: { ar: "دقيقة", en: "min" },
  orderHere: { ar: "اطلب من هنا", en: "Order here" },
  busyLow: { ar: "هادئ", en: "Quiet" },
  busyMedium: { ar: "متوسط", en: "Moderate" },
  busyHigh: { ar: "مزدحم", en: "Busy" },
  menu: { ar: "المنيو", en: "Menu" },
  search: { ar: "بحث", en: "Search" },
  searchPlaceholder: { ar: "ابحث عن لاتيه، ماتشا، آيس كريم...", en: "Search latte, matcha, ice cream..." },
  cart: { ar: "السلة", en: "Cart" },
  orders: { ar: "طلباتي", en: "Orders" },
  home: { ar: "الرئيسية", en: "Home" },
  popular: { ar: "الأكثر طلباً", en: "Popular" },
  new: { ar: "جديد", en: "New" },
  spicy: { ar: "حار", en: "Spicy" },
  unavailable: { ar: "غير متوفر", en: "Unavailable" },
  featured: { ar: "مختارات", en: "Featured" },
  all: { ar: "الكل", en: "All" },
  addToCart: { ar: "أضف للسلة", en: "Add to cart" },
  add: { ar: "أضف", en: "Add" },
  total: { ar: "الإجمالي", en: "Total" },
  subtotal: { ar: "المجموع", en: "Subtotal" },
  tax: { ar: "الضريبة", en: "Tax" },
  discount: { ar: "الخصم", en: "Discount" },
  calories: { ar: "سعرة", en: "cal" },
  quantity: { ar: "الكمية", en: "Quantity" },
  makeItMeal: { ar: "خليها وجبة؟", en: "Make it a meal?" },
  mealUpsell: { ar: "بطاطا + مشروب مقابل", en: "Fries + drink for only" },
  save: { ar: "وفر", en: "Save" },
  completeMeal: { ar: "أكمل وجبتك", en: "Complete your meal" },
  yourUsual: { ar: "طلبك المعتاد؟", en: "Your usual?" },
  orderAgain: { ar: "اطلب مرة أخرى", en: "Order again" },
  viewMenu: { ar: "تصفح المنيو", en: "Browse menu" },
  emptyCart: { ar: "سلتك فارغة", en: "Your cart is empty" },
  emptyCartHint: { ar: "أضف شيئاً لذيذاً للبدء", en: "Add something delicious to get started" },
  checkout: { ar: "إتمام الطلب", en: "Checkout" },
  phoneNumber: { ar: "رقم الجوال", en: "Phone number" },
  phoneHint: { ar: "سنرسل لك رمز تحقق عبر واتساب", en: "We'll send a verification code on WhatsApp" },
  sendCode: { ar: "إرسال الرمز", en: "Send code" },
  verifyCode: { ar: "رمز التحقق", en: "Verification code" },
  enterCode: { ar: "أدخل الرمز المكوّن من ٦ أرقام", en: "Enter the 6-digit code" },
  verify: { ar: "تحقق", en: "Verify" },
  resendIn: { ar: "إعادة الإرسال بعد", en: "Resend in" },
  resend: { ar: "إعادة إرسال الرمز", en: "Resend code" },
  demoCode: { ar: "وضع تجريبي — الرمز هو", en: "Demo mode — your code is" },
  yourName: { ar: "الاسم", en: "Your name" },
  vehicle: { ar: "المركبة", en: "Vehicle" },
  vehicles: { ar: "مركباتي", en: "My vehicles" },
  addVehicle: { ar: "إضافة مركبة", en: "Add vehicle" },
  plate: { ar: "رقم اللوحة", en: "Plate number" },
  make: { ar: "الماركة", en: "Make" },
  model: { ar: "الموديل", en: "Model" },
  color: { ar: "اللون", en: "Color" },
  nickname: { ar: "اسم المركبة", en: "Nickname" },
  payment: { ar: "طريقة الدفع", en: "Payment method" },
  card: { ar: "بطاقة", en: "Card" },
  applePay: { ar: "Apple Pay", en: "Apple Pay" },
  payAtPickup: { ar: "الدفع عند الاستلام", en: "Pay at pickup" },
  placeOrder: { ar: "تأكيد الطلب", en: "Place order" },
  orderConfirmed: { ar: "تم تأكيد طلبك", en: "Order confirmed" },
  orderNumber: { ar: "رقم الطلب", en: "Order number" },
  pickupCode: { ar: "رمز الاستلام", en: "Pickup code" },
  estimatedReady: { ar: "الوقت المتوقع للجاهزية", en: "Estimated ready in" },
  trackOrder: { ar: "تتبع الطلب", en: "Track order" },
  received: { ar: "تم استلام الطلب", en: "Order received" },
  paymentConfirmed: { ar: "تم تأكيد الدفع", en: "Payment confirmed" },
  preparing: { ar: "جاري التحضير", en: "Preparing your order" },
  qualityCheck: { ar: "فحص الجودة", en: "Quality check" },
  ready: { ar: "جاهز للاستلام", en: "Ready for pickup" },
  pickedUp: { ar: "تم الاستلام", en: "Picked up" },
  imHere: { ar: "وصلت 🚗", en: "I'm here 🚗" },
  arrivalNotified: { ar: "أبلغنا الفرع بوصولك", en: "The branch has been notified" },
  close: { ar: "إغلاق", en: "Close" },
  onMyWay: { ar: "في الطريق للاستلام", en: "On my way" },
  replaySound: { ar: "إعادة التنبيه", en: "Replay alert" },
  soundAlertOn: { ar: "التنبيه الصوتي مفعّل", en: "Sound alert on" },
  enableSoundAlert: { ar: "تفعيل التنبيه الصوتي", en: "Enable sound alert" },
  readyToast: { ar: "طلبك جاهز للاستلام", en: "Your order is ready for pickup" },

  liveTracking: { ar: "التتبع المباشر", en: "Live tracking" },
  distanceToBranch: { ar: "المسافة إلى الفرع", en: "Distance to branch" },
  arrivalEta: { ar: "وقت الوصول المتوقع", en: "Arrival in" },
  atTheBranch: { ar: "أنت عند الفرع", en: "You are at the branch" },
  trackingOn: { ar: "نتابع موقعك حتى وصولك", en: "We follow you until you arrive" },
  enableLocation: { ar: "فعّل تحديد الموقع", en: "Enable location" },
  locationDenied: {
    ar: "تحديد الموقع مغلق — فعّله من إعدادات المتصفح أو اضغط وصلت",
    en: "Location is off — enable it in your browser or tap I'm here",
  },
  customerOnTheWay: { ar: "العميل في الطريق", en: "Customer on the way" },
  customerArrived: { ar: "العميل وصل", en: "Customer arrived" },
  away: { ar: "يبعد", en: "away" },
  orderHistory: { ar: "سجل الطلبات", en: "Order history" },
  noOrders: { ar: "لا توجد طلبات بعد", en: "No orders yet" },
  points: { ar: "نقطة", en: "points" },
  loyaltyPoints: { ar: "نقاط الولاء", en: "Loyalty points" },
  signOut: { ar: "تسجيل الخروج", en: "Sign out" },
  continue: { ar: "متابعة", en: "Continue" },
  back: { ar: "رجوع", en: "Back" },
  branch: { ar: "الفرع", en: "Branch" },
  change: { ar: "تغيير", en: "Change" },
  currency: { ar: "ر.ق", en: "QAR" },
  noResults: { ar: "لا توجد نتائج", en: "No results" },
  loading: { ar: "جاري التحميل", en: "Loading" },
  somethingWrong: { ar: "حدث خطأ ما", en: "Something went wrong" },
  tryAgain: { ar: "حاول مرة أخرى", en: "Try again" },
  staffLogin: { ar: "دخول الموظفين", en: "Staff sign in" },
  kitchen: { ar: "المطبخ", en: "Kitchen" },
  liveOrders: { ar: "الطلبات المباشرة", en: "Live orders" },
  required: { ar: "مطلوب", en: "Required" },
  orderDetails: { ar: "تفاصيل الطلب", en: "Order details" },
  details: { ar: "التفاصيل", en: "Details" },
  paymentDetails: { ar: "الدفع", en: "Payment" },
  timeSinceOrder: { ar: "منذ الطلب", en: "Since ordered" },
  waitingAtBranch: { ar: "ينتظر منذ", en: "Waiting at branch" },
  notArrivedYet: { ar: "لم يصل بعد", en: "Not arrived yet" },
  customerLocation: { ar: "موقع العميل", en: "Customer location" },
  phone: { ar: "الجوال", en: "Phone" },
  noLocation: { ar: "لا يوجد تتبع موقع", en: "No location tracking" },
  customerLocationOff: {
    ar: "العميل لم يسمح بمشاركة موقعه",
    en: "Customer didn't allow location sharing",
  },
  paid: { ar: "مدفوع", en: "Paid" },
  pending: { ar: "قيد الانتظار", en: "Pending" },
  optional: { ar: "اختياري", en: "Optional" },
  language: { ar: "English", en: "العربية" },
} as const;

export type TKey = keyof typeof dict;

type Ctx = {
  lang: Lang;
  dir: "rtl" | "ltr";
  t: (key: TKey) => string;
  pick: (ar: string | null | undefined, en: string | null | undefined) => string;
  toggle: () => void;
};

const fallbackCtx: Ctx = {
  lang: "ar",
  dir: "rtl",
  t: (key) => dict[key]["ar"],
  pick: (ar, en) => ar ?? en ?? "",
  toggle: () => {},
};

// Keep a single context instance across HMR reloads so components rendered by a
// stale module copy still resolve the provider value.
const globalStore = globalThis as unknown as {
  __qrspringLangContext?: React.Context<Ctx>;
};
const LangContext: React.Context<Ctx> =
  globalStore.__qrspringLangContext ?? createContext<Ctx>(fallbackCtx);
globalStore.__qrspringLangContext = LangContext;

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("ar");

  useEffect(() => {
    const stored = window.localStorage.getItem("qrspring.lang");
    if (stored === "en" || stored === "ar") setLang(stored);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  const toggle = useCallback(() => {
    setLang((prev) => {
      const next = prev === "ar" ? "en" : "ar";
      window.localStorage.setItem("qrspring.lang", next);
      return next;
    });
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      lang,
      dir: lang === "ar" ? "rtl" : "ltr",
      t: (key) => dict[key][lang],
      pick: (ar, en) => (lang === "ar" ? (ar ?? en ?? "") : (en ?? ar ?? "")),
      toggle,
    }),
    [lang, toggle],
  );

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useI18n() {
  return useContext(LangContext);
}

export function money(amount: number, lang: Lang) {
  const value = Number(amount || 0).toFixed(2).replace(/\.00$/, "");
  return lang === "ar" ? `${value} ر.ق` : `QAR ${value}`;
}

/** Dates always render with Western (English) digits, in both languages. */
export function formatDate(iso: string | number | Date, lang: Lang) {
  return new Date(iso).toLocaleDateString(lang === "ar" ? "ar-QA-u-nu-latn" : "en-GB");
}

export function formatDateTime(iso: string | number | Date, lang: Lang) {
  return new Date(iso).toLocaleString(lang === "ar" ? "ar-QA-u-nu-latn" : "en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
