import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Activity, ArrowUpRight, Building2, ChevronRight, CircleDollarSign, Clock3, Inbox, LayoutDashboard, MapPin, Package, Plus, QrCode, ShieldAlert, ShoppingBag, SlidersHorizontal, Store, UserRoundPlus, Users, UtensilsCrossed } from "lucide-react";
import { Modal } from "@/components/console/Modal";
import { ClientAccessDialog } from "@/components/console/ClientAccessDialog";

import { supabase } from "@/integrations/supabase/client";
import { useI18n, money, formatDateTime } from "@/lib/i18n";
import { ConsoleShell } from "@/components/console/ConsoleShell";
import { OrderOverrideCard } from "@/components/console/OrderOverrideCard";
import { SiteEditor } from "@/components/console/SiteEditor";
import { SecurityAlerts } from "@/components/console/SecurityAlerts";
import { listSecurityAlerts } from "@/lib/security.functions";
import { useOrdersRealtime } from "@/hooks/useOrdersRealtime";
import { cn } from "@/lib/utils";

import {
  adminOrdersFeed,
  adminOverview,
  adminStatus,
  claimSuperAdmin,
  createClientAccount,
  listClients,
  listRestaurants,
  listClientCards,
  listSignupRequests,
  removeClientAccount,
  saveRestaurant,
  setAccountRole,
  setClientPassword,
  setSignupStatus,
} from "@/lib/admin.functions";
import { BranchOrdersTab } from "@/components/owner/BranchOrdersTab";
import { OrdersTicker } from "@/components/console/OrdersTicker";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin console — QR-Spring" },
      { name: "description", content: "Manage restaurants, accounts, staff, orders and sign-up requests." },
      { property: "og:title", content: "Admin console — QR-Spring" },
      { property: "og:description", content: "Manage the whole platform from one console." },
      { name: "robots", content: "noindex" },
    ],
  }),
  validateSearch: (s: Record<string, unknown>) => ({
    tab: typeof s["tab"] === "string" ? (s["tab"] as string) : undefined,
  }),
  component: AdminConsole,
});

const ROLES = [
  { id: "branch_manager", ar: "مدير فرع", en: "Branch manager" },
  { id: "kitchen", ar: "المطبخ", en: "Kitchen" },
  { id: "cashier", ar: "الكاشير", en: "Cashier" },
  { id: "general_manager", ar: "مدير عام (مالك)", en: "General manager (owner)" },
] as const;

type StaffRole = (typeof ROLES)[number]["id"];

const TABS = [
  { id: "overview", ar: "نظرة عامة", en: "Overview", hintAr: "المؤشرات", hintEn: "Key numbers", icon: LayoutDashboard },
  { id: "accounts", ar: "الحسابات", en: "Accounts", hintAr: "الفريق والصلاحيات", hintEn: "People & access", icon: Users },
  { id: "restaurants", ar: "المطاعم", en: "Restaurants", hintAr: "العملاء", hintEn: "Clients", icon: Store },
  { id: "requests", ar: "طلبات الاشتراك", en: "Sign-up requests", hintAr: "عملاء محتملون", hintEn: "Leads", icon: Inbox },
  { id: "security", ar: "الأمان", en: "Security", hintAr: "تنبيهات الدخول", hintEn: "Sign-in alerts", icon: ShieldAlert },
  { id: "settings", ar: "الإعدادات", en: "Settings", hintAr: "صلاحيات المنصة", hintEn: "Platform controls", icon: SlidersHorizontal },
] as const;


const input =
  "h-11 w-full rounded-xl border border-border bg-elevated px-3 text-sm outline-none ring-ring/40 focus:ring-2";

function AdminConsole() {
  const { pick, lang } = useI18n();
  const qc = useQueryClient();
  useOrdersRealtime(["admin-orders-feed", "admin-overview", "admin-client-cards", "admin-restaurants"], "admin-orders");
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const tab = (TABS.some((t) => t.id === search.tab) ? search.tab : "overview") as (typeof TABS)[number]["id"];
  const setTab = (id: (typeof TABS)[number]["id"]) =>
    void navigate({ search: { tab: id }, replace: true });
  const [accountOpen, setAccountOpen] = useState(false);
  const [restOpen, setRestOpen] = useState(false);
  const [accessClient, setAccessClient] = useState<{ id: string; title: string } | null>(null);


  const status = useQuery({ queryKey: ["admin-status"], queryFn: () => adminStatus() });
  const enabled = !!status.data?.isSuperAdmin;

  const data = useQuery({ queryKey: ["admin-clients"], queryFn: () => listClients(), enabled });
  const overview = useQuery({ queryKey: ["admin-overview"], queryFn: () => adminOverview(), enabled });
  const ordersFeed = useQuery({
    queryKey: ["admin-orders-feed"],
    queryFn: () => adminOrdersFeed(),
    enabled: enabled && tab === "overview",
    refetchInterval: 10_000,
    refetchIntervalInBackground: true,
  });
  const restaurants = useQuery({
    queryKey: ["admin-restaurants"],
    queryFn: () => listRestaurants(),
    enabled: enabled && tab === "restaurants",
  });
  const clientCards = useQuery({
    queryKey: ["admin-client-cards"],
    queryFn: () => listClientCards(),
    enabled: enabled && tab === "restaurants",
  });
  const requests = useQuery({
    queryKey: ["admin-requests"],
    queryFn: () => listSignupRequests(),
    enabled: enabled && tab === "requests",
  });
  const securityAlerts = useQuery({
    queryKey: ["security-alerts"],
    queryFn: () => listSecurityAlerts(),
    enabled,
    refetchInterval: 15_000,
  });

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<StaffRole>("branch_manager");
  const [branchMode, setBranchMode] = useState<"existing" | "new">("new");
  const [branchId, setBranchId] = useState("");
  const [nb, setNb] = useState({ name_en: "", name_ar: "", code: "", city_en: "", city_ar: "" });

  const [rest, setRest] = useState({
    id: "" as string,
    slug: "",
    name_en: "",
    name_ar: "",
    currency: "QAR",
    org_en: "",
    org_ar: "",
    organizationId: "",
  });

  const claim = useMutation({
    mutationFn: () => claimSuperAdmin(),
    onSuccess: () => {
      toast.success(pick("تم تعيينك كمسؤول عام", "You are now the general admin"));
      qc.invalidateQueries({ queryKey: ["admin-status"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const create = useMutation({
    mutationFn: () =>
      createClientAccount({
        data: {
          email,
          password,
          fullName,
          role,
          branchId: branchMode === "existing" ? branchId : null,
          newBranch: branchMode === "new" ? nb : null,
        },
      }),
    onSuccess: () => {
      toast.success(pick("تم إنشاء الحساب", "Account created"));
      setAccountOpen(false);
      setEmail("");
      setPassword("");
      setFullName("");
      setNb({ name_en: "", name_ar: "", code: "", city_en: "", city_ar: "" });
      qc.invalidateQueries({ queryKey: ["admin-clients"] });
      qc.invalidateQueries({ queryKey: ["branches"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const reset = useMutation({
    mutationFn: (v: { userId: string; password: string }) => setClientPassword({ data: v }),
    onSuccess: () => toast.success(pick("تم تحديث كلمة المرور", "Password updated")),
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (userId: string) => removeClientAccount({ data: { userId } }),
    onSuccess: () => {
      toast.success(pick("تم حذف الحساب", "Account removed"));
      qc.invalidateQueries({ queryKey: ["admin-clients"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const changeRole = useMutation({
    mutationFn: (v: { roleRowId: string; role: StaffRole; branchId: string | null }) =>
      setAccountRole({ data: v }),
    onSuccess: () => {
      toast.success(pick("تم تحديث الصلاحية", "Access updated"));
      qc.invalidateQueries({ queryKey: ["admin-clients"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const saveRest = useMutation({
    mutationFn: () =>
      saveRestaurant({
        data: {
          id: rest.id || null,
          organizationId: rest.organizationId || null,
          newOrganization: rest.organizationId ? null : { name_en: rest.org_en, name_ar: rest.org_ar },
          slug: rest.slug,
          name_en: rest.name_en,
          name_ar: rest.name_ar,
          currency: rest.currency,
        },
      }),
    onSuccess: () => {
      toast.success(pick("تم الحفظ", "Saved"));
      setRestOpen(false);
      setRest({ id: "", slug: "", name_en: "", name_ar: "", currency: "QAR", org_en: "", org_ar: "", organizationId: "" });
      qc.invalidateQueries({ queryKey: ["admin-restaurants"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const markRequest = useMutation({
    mutationFn: (v: { id: string; status: "NEW" | "CONTACTED" | "ONBOARDED" | "REJECTED" }) =>
      setSignupStatus({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-requests"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  if (status.isLoading)
    return <div className="p-8 text-sm text-muted-foreground">{pick("جارٍ التحميل…", "Loading…")}</div>;

  if (!status.data?.isSuperAdmin)
    return (
      <div className="mx-auto max-w-md p-8">
        <div className="surface rounded-3xl p-6 text-center">
          <h1 className="font-display text-xl font-bold">{pick("لوحة المسؤول العام", "General admin")}</h1>
          {status.data?.superAdminExists ? (
            <p className="mt-3 text-sm text-muted-foreground">
              {pick("هذا الحساب ليس لديه صلاحية المسؤول العام.", "This account is not the general admin.")}
            </p>
          ) : (
            <>
              <p className="mt-3 text-sm text-muted-foreground">
                {pick(
                  "لا يوجد مسؤول عام بعد. يمكنك تعيين هذا الحساب كمسؤول عام.",
                  "No general admin exists yet. Make this account the general admin.",
                )}
              </p>
              <button
                onClick={() => claim.mutate()}
                disabled={claim.isPending}
                className="mt-4 w-full rounded-full bg-[image:var(--gradient-brass)] py-3 font-display font-bold text-primary-foreground disabled:opacity-50"
              >
                {pick("تعييني كمسؤول عام", "Make me general admin")}
              </button>
            </>
          )}
          <Link to="/app" search={{ branch: undefined, locked: false }} className="mt-4 block text-xs underline underline-offset-4">
            {pick("العودة للرئيسية", "Back to home")}
          </Link>
        </div>
      </div>
    );

  const o = overview.data;

  const navItems = TABS.map((tb) => ({
    id: tb.id,
    label: pick(tb.ar, tb.en),
    hint: pick(tb.hintAr, tb.hintEn),
    icon: tb.icon,
    badge:
      tb.id === "requests"
        ? (o?.newLeads ?? null)
        : tb.id === "security"
          ? ((securityAlerts.data ?? []).filter((alert) => !alert.read_at).length || null)
          : null,
  }));
  const unreadSecurityAlerts = (securityAlerts.data ?? []).filter((alert) => !alert.read_at).length;

  return (
    <ConsoleShell
      title={pick("لوحة إدارة المنصة", "Platform admin")}
      subtitle={pick(
        "المطاعم، الحسابات، الفروع، الطلبات وطلبات الاشتراك",
        "Restaurants, accounts, branches, orders and sign-up requests",
      )}
      items={navItems}
      active={tab}
      onSelect={(id) => setTab(id as (typeof TABS)[number]["id"])}
      notificationCount={unreadSecurityAlerts}
      onNotificationsClick={() => setTab("security")}
      variant="admin"
      {...(tab === "restaurants"
        ? {
            secondaryTitle: pick("المطاعم", "Restaurants"),
            secondary: (
              <nav className="flex gap-2">
                {(clientCards.data ?? []).map((c) => (
                  <Link
                    key={c.id}
                    to="/admin/clients/$clientId"
                    params={{ clientId: c.id }}
                    className={cn(
                      "flex shrink-0 items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-xs font-semibold text-muted-foreground shadow-sm transition hover:border-primary/40 hover:text-foreground",
                      (c.newOrders ?? 0) > 0 ? "order-glow-new" : (c.activeOrders ?? 0) > 0 ? "order-glow-progress" : "",
                    )}
                  >
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-xl bg-[image:var(--gradient-brass)] text-[11px] font-black text-primary-foreground">
                      {pick(c.name_ar, c.name_en).trim().charAt(0)}
                    </span>
                    <span className="truncate">{pick(c.name_ar, c.name_en)}</span>
                    <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden />
                  </Link>
                ))}
                {clientCards.data && clientCards.data.length === 0 ? (
                  <p className="px-2 text-xs text-muted-foreground">{pick("لا يوجد عملاء بعد.", "No clients yet.")}</p>
                ) : null}
              </nav>
            ),
          }
        : {})}
      quickLinks={[
        { to: "/owner", label: pick("المنيو والفروع", "Menu & branches") },
        { to: "/live", label: pick("الطلبات المباشرة", "Live orders") },
        { to: "/kitchen", label: pick("شاشة المطبخ", "Kitchen screen") },
      ]}
    >


      {tab === "settings" && (
        <section className="space-y-5">
          <OrderOverrideCard scope="admin" />
          <SiteEditor />
        </section>
      )}

      {tab === "security" && <SecurityAlerts />}

      {tab === "overview" && (
        <section className="space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-primary">{pick("مركز العمليات", "Operations center")}</p>
              <h2 className="mt-1 font-display text-xl font-bold">{pick("أداء المنصة اليوم", "Platform performance today")}</h2>
            </div>
            <p className="inline-flex items-center gap-2 text-xs text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-success" />
              {pick("البيانات المباشرة متصلة", "Live data connected")}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { ar: "مبيعات 24 ساعة", en: "Revenue (24h)", v: money(Number(o?.revenue24h ?? 0), lang), icon: CircleDollarSign, tone: "bg-success/10 text-success" },
              { ar: "طلبات آخر 24 ساعة", en: "Orders (24h)", v: o?.orders24h ?? 0, icon: ShoppingBag, tone: "bg-primary/10 text-primary" },
              { ar: "قيد التنفيذ الآن", en: "In progress now", v: o?.inProgress ?? 0, icon: Clock3, tone: "bg-warning/15 text-warning" },
              { ar: "طلبات اشتراك جديدة", en: "New sign-up requests", v: o?.newLeads ?? 0, icon: UserRoundPlus, tone: "bg-destructive/10 text-destructive" },
            ].map((k) => (
              <article key={k.en} className="admin-metric-card">
                <div className={cn("grid h-11 w-11 place-items-center rounded-lg", k.tone)}>
                  <k.icon className="h-5 w-5" aria-hidden />
                </div>
                <div className="mt-5">
                  <p className="text-xs text-muted-foreground">{pick(k.ar, k.en)}</p>
                  <p className="mt-1 font-display text-2xl font-bold" dir="ltr">{k.v}</p>
                </div>
              </article>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-4">
            {[
              { ar: "المطاعم", en: "Restaurants", v: o?.restaurants ?? 0, icon: Building2 },
              { ar: "الفروع", en: "Branches", v: o?.branches ?? 0, icon: Store },
              { ar: "أصناف المنيو", en: "Menu items", v: o?.products ?? 0, icon: UtensilsCrossed },
              { ar: "حسابات الفريق", en: "Team accounts", v: o?.accounts ?? 0, icon: Users },
            ].map((k) => (
              <div key={k.en} className="flex items-center gap-3 bg-card px-4 py-3.5">
                <k.icon className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                <div className="min-w-0">
                  <p className="truncate text-[10px] text-muted-foreground">{pick(k.ar, k.en)}</p>
                  <p className="font-display text-lg font-bold" dir="ltr">{k.v}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="admin-section-frame">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" aria-hidden />
                <h2 className="font-display text-base font-bold">{pick("الطلبات المباشرة", "Live orders")}</h2>
              </div>
              <button onClick={() => void ordersFeed.refetch()} className="text-xs font-semibold text-primary hover:underline">
                {pick("تحديث", "Refresh")}
              </button>
            </div>
            <OrdersTicker
              orders={(ordersFeed.data?.orders ?? []) as Record<string, unknown>[]}
              branches={(ordersFeed.data?.branches ?? []) as Record<string, unknown>[]}
            />
          </div>

          <div className="admin-section-frame">
            <BranchOrdersTab
              branches={(ordersFeed.data?.branches ?? []) as Record<string, unknown>[]}
              orders={(ordersFeed.data?.orders ?? []) as Record<string, unknown>[]}
              loading={ordersFeed.isLoading}
            />
          </div>
        </section>
      )}

      {tab === "accounts" && (
        <section className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-bold">{pick("الحسابات", "Accounts")}</h2>
              <p className="text-xs text-muted-foreground">
                {pick("الفريق والصلاحيات على مستوى المنصة.", "Team members and access across the platform.")}
              </p>
            </div>
            <button
              onClick={() => setAccountOpen(true)}
              className="inline-flex items-center gap-2 rounded-full bg-[image:var(--gradient-brass)] px-5 py-3 font-display text-sm font-bold text-primary-foreground shadow-lift"
            >
              <Plus className="h-4 w-4" aria-hidden />
              {pick("حساب جديد", "New account")}
            </button>
          </div>

          <Modal
            open={accountOpen}
            onClose={() => setAccountOpen(false)}
            title={pick("حساب جديد", "New account")}
            subtitle={pick("أنشئ حساب فريق واربطه بفرع.", "Create a team account and link it to a branch.")}
            footer={
              <button
                onClick={() => create.mutate()}
                disabled={create.isPending || !email || password.length < 8 || (branchMode === "existing" && !branchId)}
                className="w-full rounded-full bg-[image:var(--gradient-brass)] py-3.5 font-display font-bold text-primary-foreground disabled:opacity-50"
              >
                {pick("إنشاء الحساب", "Create account")}
              </button>
            }
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <input className={input} placeholder={pick("الاسم", "Full name")} value={fullName} onChange={(e) => setFullName(e.target.value)} />
              <input className={input} dir="ltr" type="email" placeholder="team@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              <input className={input} dir="ltr" type="password" placeholder={pick("كلمة المرور (8+ أحرف)", "Password (8+ chars)")} value={password} onChange={(e) => setPassword(e.target.value)} />
              <select className={input} value={role} onChange={(e) => setRole(e.target.value as StaffRole)}>
                {ROLES.map((r) => (
                  <option key={r.id} value={r.id}>
                    {pick(r.ar, r.en)}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-5 flex gap-2">
              {(
                [
                  { id: "new", ar: "فرع جديد", en: "New branch" },
                  { id: "existing", ar: "فرع موجود", en: "Existing branch" },
                ] as const
              ).map((m) => (
                <button
                  key={m.id}
                  onClick={() => setBranchMode(m.id)}
                  className={cn(
                    "rounded-full border px-4 py-2 text-xs font-semibold",
                    branchMode === m.id ? "border-primary bg-primary/10 text-primary" : "border-border",
                  )}
                >
                  {pick(m.ar, m.en)}
                </button>
              ))}
            </div>

            {branchMode === "new" ? (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <input className={input} placeholder={pick("اسم الفرع (عربي)", "Branch name (Arabic)")} value={nb.name_ar} onChange={(e) => setNb({ ...nb, name_ar: e.target.value })} />
                <input className={input} dir="ltr" placeholder="Branch name (English)" value={nb.name_en} onChange={(e) => setNb({ ...nb, name_en: e.target.value })} />
                <input className={input} dir="ltr" placeholder={pick("رمز الفرع", "Branch code")} value={nb.code} onChange={(e) => setNb({ ...nb, code: e.target.value })} />
                <input className={input} placeholder={pick("المدينة (عربي)", "City (Arabic)")} value={nb.city_ar} onChange={(e) => setNb({ ...nb, city_ar: e.target.value })} />
                <input className={input} dir="ltr" placeholder="City (English)" value={nb.city_en} onChange={(e) => setNb({ ...nb, city_en: e.target.value })} />
              </div>
            ) : (
              <select className={cn(input, "mt-3")} value={branchId} onChange={(e) => setBranchId(e.target.value)}>
                <option value="">{pick("اختر الفرع", "Choose a branch")}</option>
                {(data.data?.branches ?? []).map((b) => (
                  <option key={b.id} value={b.id}>
                    {pick(b.name_ar, b.name_en)} · {b.code}
                  </option>
                ))}
              </select>
            )}

          </Modal>

          <div className="surface rounded-3xl p-5">
            <div className="divide-y divide-border">
              {(data.data?.accounts ?? []).map((a) => (
                <div key={a.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{a.fullName || a.email || a.userId}</p>
                    <p className="truncate text-xs text-muted-foreground" dir="ltr">
                      {a.email} · {a.role}
                      {a.branch ? ` · ${pick(a.branch.name_ar, a.branch.name_en)}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <select
                      className="rounded-full border border-border bg-elevated px-3 py-1.5 text-xs"
                      value={a.role}
                      onChange={(e) =>
                        changeRole.mutate({
                          roleRowId: a.id,
                          role: e.target.value as StaffRole,
                          branchId: a.branch?.id ?? null,
                        })
                      }
                    >
                      {ROLES.map((r) => (
                        <option key={r.id} value={r.id}>
                          {pick(r.ar, r.en)}
                        </option>
                      ))}
                      {!ROLES.some((r) => r.id === a.role) && <option value={a.role}>{a.role}</option>}
                    </select>
                    <select
                      className="rounded-full border border-border bg-elevated px-3 py-1.5 text-xs"
                      value={a.branch?.id ?? ""}
                      onChange={(e) =>
                        changeRole.mutate({
                          roleRowId: a.id,
                          role: a.role as StaffRole,
                          branchId: e.target.value || null,
                        })
                      }
                    >
                      <option value="">{pick("بدون فرع", "No branch")}</option>
                      {(data.data?.branches ?? []).map((b) => (
                        <option key={b.id} value={b.id}>
                          {pick(b.name_ar, b.name_en)}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => {
                        const pw = window.prompt(pick("كلمة مرور جديدة", "New password") ?? "");
                        if (pw) reset.mutate({ userId: a.userId, password: pw });
                      }}
                      className="rounded-full border border-border px-3 py-1.5 text-xs"
                    >
                      {pick("كلمة المرور", "Password")}
                    </button>
                    <button
                      onClick={() => remove.mutate(a.userId)}
                      className="rounded-full border border-destructive/40 px-3 py-1.5 text-xs text-destructive"
                    >
                      {pick("حذف", "Remove")}
                    </button>
                  </div>
                </div>
              ))}
              {data.data && data.data.accounts.length === 0 && (
                <p className="py-4 text-sm text-muted-foreground">{pick("لا توجد حسابات بعد.", "No accounts yet.")}</p>
              )}
            </div>
          </div>
        </section>
      )}

      {tab === "restaurants" && (
        <section className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-bold">{pick("العملاء", "Clients")}</h2>
              <p className="text-xs text-muted-foreground">
                {pick("اضغط على العميل لإدارة منيوه وفروعه وفريقه.", "Open a client to manage its menu, branches and staff.")}
              </p>
            </div>
            <button
              onClick={() => {
                setRest({ id: "", slug: "", name_en: "", name_ar: "", currency: "QAR", org_en: "", org_ar: "", organizationId: "" });
                setRestOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-full bg-[image:var(--gradient-brass)] px-5 py-3 font-display text-sm font-bold text-primary-foreground shadow-lift"
            >
              <Plus className="h-4 w-4" aria-hidden />
              {pick("مطعم جديد", "New restaurant")}
            </button>
          </div>

          <Modal
            open={restOpen}
            onClose={() => setRestOpen(false)}
            title={rest.id ? pick("تعديل مطعم", "Edit restaurant") : pick("مطعم جديد", "New restaurant")}
            subtitle={pick("بيانات المطعم والمجموعة والعملة.", "Restaurant, group and currency details.")}
            footer={
              <button
                onClick={() => saveRest.mutate()}
                disabled={saveRest.isPending || !rest.slug || !rest.name_en || !rest.name_ar}
                className="w-full rounded-full bg-[image:var(--gradient-brass)] py-3.5 font-display font-bold text-primary-foreground disabled:opacity-50"
              >
                {pick("حفظ", "Save")}
              </button>
            }
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <input className={input} placeholder={pick("اسم المطعم (عربي)", "Name (Arabic)")} value={rest.name_ar} onChange={(e) => setRest({ ...rest, name_ar: e.target.value })} />
              <input className={input} dir="ltr" placeholder="Name (English)" value={rest.name_en} onChange={(e) => setRest({ ...rest, name_en: e.target.value })} />
              <input className={input} dir="ltr" placeholder={pick("المعرّف (slug)", "Slug")} value={rest.slug} onChange={(e) => setRest({ ...rest, slug: e.target.value })} />
              <input className={input} dir="ltr" placeholder="QAR" value={rest.currency} onChange={(e) => setRest({ ...rest, currency: e.target.value })} />
              {!rest.id && (
                <>
                  <select className={input} value={rest.organizationId} onChange={(e) => setRest({ ...rest, organizationId: e.target.value })}>
                    <option value="">{pick("مجموعة جديدة", "New group")}</option>
                    {(restaurants.data?.organizations ?? []).map((g) => (
                      <option key={g.id} value={g.id}>
                        {pick(g.name_ar, g.name_en)}
                      </option>
                    ))}
                  </select>
                  {!rest.organizationId && (
                    <>
                      <input className={input} placeholder={pick("اسم المجموعة (عربي)", "Group name (Arabic)")} value={rest.org_ar} onChange={(e) => setRest({ ...rest, org_ar: e.target.value })} />
                      <input className={input} dir="ltr" placeholder="Group name (English)" value={rest.org_en} onChange={(e) => setRest({ ...rest, org_en: e.target.value })} />
                    </>
                  )}
                </>
              )}
            </div>
          </Modal>

          <div>
            <div className="grid gap-4 xl:grid-cols-2">
              {(clientCards.data ?? []).map((c) => (
                <Link
                  key={c.id}
                  to="/admin/clients/$clientId"
                  params={{ clientId: c.id }}
                  className={cn(
                    "group relative overflow-hidden rounded-2xl border border-border bg-card p-5 transition duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lift",
                    // Red halo while the restaurant has brand-new orders; it
                    // softens to orange once every order has moved forward.
                    (c.newOrders ?? 0) > 0 ? "order-glow-new" : (c.activeOrders ?? 0) > 0 ? "order-glow-progress" : "",
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-3.5">
                      <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl border border-border bg-elevated font-display text-xl font-black text-primary">
                        {c.logo_url ? (
                          <img
                            src={c.logo_url}
                            alt={pick(c.name_ar, c.name_en)}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          pick(c.name_ar, c.name_en).trim().charAt(0)
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-display text-lg font-bold">{pick(c.name_ar, c.name_en)}</p>
                        <p className="mt-0.5 truncate text-[11px] text-muted-foreground" dir="ltr">
                          {c.slug} · {c.currency}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span
                        className={cn(
                          "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold",
                          c.openBranches ? "bg-success/15 text-success" : "bg-muted text-muted-foreground",
                        )}
                      >
                        <span className={cn("h-1.5 w-1.5 rounded-full", c.openBranches ? "bg-success" : "bg-muted-foreground")} />
                        {c.openBranches ? pick("مفتوح", "Open") : pick("مغلق", "Closed")}
                      </span>
                      <button
                        type="button"
                        aria-label={pick("روابط ودخول العميل", "Client links & access")}
                        title={pick("روابط ودخول العميل", "Client links & access")}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setAccessClient({ id: c.id, title: pick(c.name_ar, c.name_en) });
                        }}
                        className="grid h-9 w-9 place-items-center rounded-full border border-border text-muted-foreground transition hover:bg-accent hover:text-foreground"
                      >
                        <QrCode className="h-4 w-4" aria-hidden />
                      </button>
                    </div>

                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-x-5 gap-y-3 border-y border-border py-4 sm:grid-cols-4">
                    {[
                      { ar: "الفروع", en: "Branches", v: c.branches, icon: MapPin },
                      { ar: "الأصناف", en: "Items", v: c.products, icon: Package },
                      { ar: "الفريق", en: "Staff", v: c.team, icon: Users },
                      { ar: "طلبات 24س", en: "Orders 24h", v: c.orders24h, icon: ShoppingBag },
                    ].map((k) => (
                      <div key={k.en} className="flex items-center gap-2.5">
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-elevated text-muted-foreground">
                          <k.icon className="h-3.5 w-3.5" aria-hidden />
                        </span>
                        <div>
                          <p className="font-display text-base font-bold leading-none" dir="ltr">{k.v}</p>
                          <p className="mt-1 text-[9px] text-muted-foreground">{pick(k.ar, k.en)}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {[
                      { ar: "قيد التنفيذ", en: "In progress", v: c.activeOrders, cls: "bg-warning/15 text-warning" },
                      { ar: "جاهز", en: "Ready", v: c.readyOrders, cls: "bg-success/15 text-success" },
                      { ar: "مكتمل", en: "Completed", v: c.completedOrders, cls: "bg-primary/12 text-primary" },
                      { ar: "ملغي", en: "Cancelled", v: c.cancelledOrders, cls: "bg-destructive/12 text-destructive" },
                    ].map((s) => (
                      <span
                        key={s.en}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold",
                          s.cls,
                        )}
                      >
                        {pick(s.ar, s.en)}
                        <span dir="ltr" className="rounded-full bg-card/70 px-1.5">
                          {s.v}
                        </span>
                      </span>
                    ))}
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CircleDollarSign className="h-4 w-4" aria-hidden />
                      <span>{pick("مبيعات 24 ساعة", "24h revenue")}</span>
                      <strong className="text-foreground" dir="ltr">{money(Number(c.revenue24h), lang)}</strong>
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-primary">
                      {pick("فتح مساحة العمل", "Open workspace")}
                      <ArrowUpRight className="h-3.5 w-3.5 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 rtl:-scale-x-100" aria-hidden />
                    </span>
                  </div>
                </Link>
              ))}
              {clientCards.isLoading ? (
                <p className="py-4 text-sm text-muted-foreground">{pick("جارٍ التحميل…", "Loading…")}</p>
              ) : null}
            </div>
          </div>

          <ClientAccessDialog
            open={!!accessClient}
            onClose={() => setAccessClient(null)}
            restaurantId={accessClient?.id ?? ""}
            title={accessClient?.title ?? ""}
          />

        </section>
      )}

      {tab === "requests" && (
        <section className="surface rounded-3xl p-5">
          <h2 className="font-display text-lg font-bold">{pick("طلبات اشتراك المطاعم", "Restaurant sign-up requests")}</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {pick("الطلبات القادمة من صفحة البيع.", "Requests coming from the marketing page.")}
          </p>
          <div className="mt-3 divide-y divide-border">
            {(requests.data ?? []).map((r) => (
              <div key={r.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">
                    {r.restaurant_name} · <span className="text-xs text-muted-foreground">{r.plan}</span>
                  </p>
                  <p className="text-xs text-muted-foreground" dir="ltr">
                    {r.contact_name} · {r.email} {r.phone ? `· ${r.phone}` : ""} · {r.branches_count}{" "}
                    {pick("فرع", "branches")}
                  </p>
                  {r.message ? <p className="mt-1 text-xs text-muted-foreground">{r.message}</p> : null}
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-accent px-2.5 py-1 text-[11px] font-semibold">{r.status}</span>
                  <select
                    className="rounded-full border border-border bg-elevated px-3 py-1.5 text-xs"
                    value={r.status}
                    onChange={(e) =>
                      markRequest.mutate({
                        id: r.id,
                        status: e.target.value as "NEW" | "CONTACTED" | "ONBOARDED" | "REJECTED",
                      })
                    }
                  >
                    {["NEW", "CONTACTED", "ONBOARDED", "REJECTED"].map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
            {requests.data && requests.data.length === 0 && (
              <p className="py-4 text-sm text-muted-foreground">{pick("لا توجد طلبات بعد.", "No requests yet.")}</p>
            )}
          </div>
        </section>
      )}
    </ConsoleShell>

  );
}
