import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Inbox, LayoutDashboard, Store, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n, money, formatDateTime } from "@/lib/i18n";
import { ConsoleShell } from "@/components/console/ConsoleShell";
import { cn } from "@/lib/utils";

import {
  adminOverview,
  adminStatus,
  claimSuperAdmin,
  createClientAccount,
  listClients,
  listRestaurants,
  listSignupRequests,
  removeClientAccount,
  saveRestaurant,
  setAccountRole,
  setClientPassword,
  setSignupStatus,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin console — Origami Platform" },
      { name: "description", content: "Manage restaurants, accounts, staff, orders and sign-up requests." },
      { property: "og:title", content: "Admin console — Origami Platform" },
      { property: "og:description", content: "Manage the whole platform from one console." },
      { name: "robots", content: "noindex" },
    ],
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
] as const;


const input =
  "h-11 w-full rounded-xl border border-border bg-elevated px-3 text-sm outline-none ring-ring/40 focus:ring-2";

function AdminConsole() {
  const { pick, lang } = useI18n();
  const qc = useQueryClient();
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("overview");

  const status = useQuery({ queryKey: ["admin-status"], queryFn: () => adminStatus() });
  const enabled = !!status.data?.isSuperAdmin;

  const data = useQuery({ queryKey: ["admin-clients"], queryFn: () => listClients(), enabled });
  const overview = useQuery({ queryKey: ["admin-overview"], queryFn: () => adminOverview(), enabled });
  const restaurants = useQuery({
    queryKey: ["admin-restaurants"],
    queryFn: () => listRestaurants(),
    enabled: enabled && tab === "restaurants",
  });
  const requests = useQuery({
    queryKey: ["admin-requests"],
    queryFn: () => listSignupRequests(),
    enabled: enabled && tab === "requests",
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
          <Link to="/app" search={{ branch: undefined }} className="mt-4 block text-xs underline underline-offset-4">
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
    badge: tb.id === "requests" ? (o?.newLeads ?? null) : null,
  }));

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
      quickLinks={[
        { to: "/owner", label: pick("المنيو والفروع", "Menu & branches") },
        { to: "/live", label: pick("الطلبات المباشرة", "Live orders") },
        { to: "/kitchen", label: pick("شاشة المطبخ", "Kitchen screen") },
      ]}
    >


      {tab === "overview" && (
        <section className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { ar: "المطاعم", en: "Restaurants", v: o?.restaurants ?? 0 },
              { ar: "الفروع", en: "Branches", v: o?.branches ?? 0 },
              { ar: "أصناف المنيو", en: "Menu items", v: o?.products ?? 0 },
              { ar: "حسابات الفريق", en: "Team accounts", v: o?.accounts ?? 0 },
              { ar: "طلبات آخر 24 ساعة", en: "Orders (24h)", v: o?.orders24h ?? 0 },
              { ar: "قيد التنفيذ", en: "In progress", v: o?.inProgress ?? 0 },
              { ar: "طلبات اشتراك جديدة", en: "New sign-up requests", v: o?.newLeads ?? 0 },
              {
                ar: "مبيعات 24 ساعة",
                en: "Revenue (24h)",
                v: money(Number(o?.revenue24h ?? 0), lang),
              },
            ].map((k) => (
              <div key={k.en} className="surface rounded-2xl p-4">
                <p className="text-xs text-muted-foreground">{pick(k.ar, k.en)}</p>
                <p className="mt-1 font-display text-2xl font-bold">{k.v}</p>
              </div>
            ))}
          </div>

          <div className="surface rounded-3xl p-5">
            <h2 className="font-display text-lg font-bold">{pick("أحدث الطلبات", "Latest orders")}</h2>
            <div className="mt-3 divide-y divide-border">
              {(o?.recent ?? []).map((r) => (
                <div key={r.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <div className="min-w-0">
                    <p className="font-semibold">{r.order_number}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {r.branches ? pick(r.branches.name_ar, r.branches.name_en) : ""} ·{" "}
                      {new Date(r.created_at).toLocaleString(lang === "ar" ? "ar-QA" : "en-GB")}
                    </p>
                  </div>
                  <div className="shrink-0 text-end">
                    <p className="text-xs text-muted-foreground">{r.status}</p>
                    <p className="font-semibold">{money(Number(r.total), lang)}</p>
                  </div>
                </div>
              ))}
              {overview.isLoading && (
                <p className="py-4 text-sm text-muted-foreground">{pick("جارٍ التحميل…", "Loading…")}</p>
              )}
            </div>
          </div>
        </section>
      )}

      {tab === "accounts" && (
        <section className="space-y-5">
          <div className="surface rounded-3xl p-5">
            <h2 className="font-display text-lg font-bold">{pick("حساب جديد", "New account")}</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <input className={input} placeholder={pick("الاسم", "Full name")} value={fullName} onChange={(e) => setFullName(e.target.value)} />
              <input className={input} dir="ltr" type="email" placeholder="team@origami.qa" value={email} onChange={(e) => setEmail(e.target.value)} />
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

            <button
              onClick={() => create.mutate()}
              disabled={create.isPending || !email || password.length < 8 || (branchMode === "existing" && !branchId)}
              className="mt-5 w-full rounded-full bg-[image:var(--gradient-brass)] py-3.5 font-display font-bold text-primary-foreground disabled:opacity-50"
            >
              {pick("إنشاء الحساب", "Create account")}
            </button>
          </div>

          <div className="surface rounded-3xl p-5">
            <h2 className="font-display text-lg font-bold">{pick("الحسابات", "Accounts")}</h2>
            <div className="mt-3 divide-y divide-border">
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
          <div className="surface rounded-3xl p-5">
            <h2 className="font-display text-lg font-bold">
              {rest.id ? pick("تعديل مطعم", "Edit restaurant") : pick("مطعم جديد", "New restaurant")}
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
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
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => saveRest.mutate()}
                disabled={saveRest.isPending || !rest.slug || !rest.name_en || !rest.name_ar}
                className="rounded-full bg-[image:var(--gradient-brass)] px-6 py-3 font-display text-sm font-bold text-primary-foreground disabled:opacity-50"
              >
                {pick("حفظ", "Save")}
              </button>
              {rest.id && (
                <button
                  onClick={() => setRest({ id: "", slug: "", name_en: "", name_ar: "", currency: "QAR", org_en: "", org_ar: "", organizationId: "" })}
                  className="rounded-full border border-border px-6 py-3 text-sm"
                >
                  {pick("إلغاء", "Cancel")}
                </button>
              )}
            </div>
          </div>

          <div className="surface rounded-3xl p-5">
            <h2 className="font-display text-lg font-bold">{pick("المطاعم", "Restaurants")}</h2>
            <div className="mt-3 divide-y divide-border">
              {(restaurants.data?.restaurants ?? []).map((r) => (
                <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{pick(r.name_ar, r.name_en)}</p>
                    <p className="text-xs text-muted-foreground" dir="ltr">
                      {r.slug} · {r.currency} · {r.branches.length} {pick("فرع", "branches")}
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      setRest({
                        id: r.id,
                        slug: r.slug,
                        name_en: r.name_en,
                        name_ar: r.name_ar,
                        currency: r.currency,
                        org_en: "",
                        org_ar: "",
                        organizationId: r.organization_id,
                      })
                    }
                    className="rounded-full border border-border px-4 py-1.5 text-xs"
                  >
                    {pick("تعديل", "Edit")}
                  </button>
                </div>
              ))}
              {restaurants.isLoading && (
                <p className="py-4 text-sm text-muted-foreground">{pick("جارٍ التحميل…", "Loading…")}</p>
              )}
            </div>
          </div>
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
