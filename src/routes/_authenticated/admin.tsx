import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  adminStatus,
  claimSuperAdmin,
  createClientAccount,
  listClients,
  removeClientAccount,
  setClientPassword,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin console — Origami Qatar" },
      { name: "description", content: "Create client accounts and assign each one its own branch." },
      { property: "og:title", content: "Admin console — Origami Qatar" },
      { property: "og:description", content: "Create client accounts and branches." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminConsole,
});

const ROLES = [
  { id: "branch_manager", ar: "مدير فرع", en: "Branch manager" },
  { id: "kitchen", ar: "المطبخ", en: "Kitchen" },
  { id: "cashier", ar: "الكاشير", en: "Cashier" },
  { id: "general_manager", ar: "مدير عام", en: "General manager" },
] as const;

const input =
  "h-11 w-full rounded-xl border border-border bg-elevated px-3 text-sm outline-none ring-ring/40 focus:ring-2";

function AdminConsole() {
  const { pick } = useI18n();
  const qc = useQueryClient();

  const status = useQuery({ queryKey: ["admin-status"], queryFn: () => adminStatus() });
  const data = useQuery({
    queryKey: ["admin-clients"],
    queryFn: () => listClients(),
    enabled: !!status.data?.isSuperAdmin,
  });

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<(typeof ROLES)[number]["id"]>("branch_manager");
  const [branchMode, setBranchMode] = useState<"existing" | "new">("new");
  const [branchId, setBranchId] = useState("");
  const [nb, setNb] = useState({ name_en: "", name_ar: "", code: "", city_en: "", city_ar: "" });

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
      toast.success(pick("تم إنشاء حساب العميل", "Client account created"));
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

  if (status.isLoading)
    return <div className="p-8 text-sm text-muted-foreground">{pick("جارٍ التحميل…", "Loading…")}</div>;

  if (!status.data?.isSuperAdmin)
    return (
      <div className="mx-auto max-w-md p-8">
        <div className="surface rounded-3xl p-6 text-center">
          <h1 className="font-display text-xl font-bold">{pick("لوحة المسؤول العام", "General admin")}</h1>
          {status.data?.superAdminExists ? (
            <p className="mt-3 text-sm text-muted-foreground">
              {pick(
                "هذا الحساب ليس لديه صلاحية المسؤول العام.",
                "This account is not the general admin.",
              )}
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
          <Link to="/" search={{ branch: undefined }} className="mt-4 block text-xs underline underline-offset-4">
            {pick("العودة للرئيسية", "Back to home")}
          </Link>
        </div>
      </div>
    );

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">{pick("لوحة المسؤول العام", "General admin")}</h1>
          <p className="text-xs text-muted-foreground">
            {pick("إنشاء حسابات العملاء وربط كل عميل بفرعه", "Create client accounts, each with its own branch")}
          </p>
        </div>
        <button
          onClick={() => supabase.auth.signOut()}
          className="rounded-full border border-border px-4 py-2 text-xs"
        >
          {pick("تسجيل الخروج", "Sign out")}
        </button>
      </header>

      <section className="surface rounded-3xl p-5">
        <h2 className="font-display text-lg font-bold">{pick("حساب عميل جديد", "New client account")}</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <input className={input} placeholder={pick("الاسم", "Full name")} value={fullName} onChange={(e) => setFullName(e.target.value)} />
          <input className={input} dir="ltr" type="email" placeholder="team@origami.qa" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className={input} dir="ltr" type="password" placeholder={pick("كلمة المرور (8+ أحرف)", "Password (8+ chars)")} value={password} onChange={(e) => setPassword(e.target.value)} />
          <select className={input} value={role} onChange={(e) => setRole(e.target.value as typeof role)}>
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
      </section>

      <section className="surface mt-6 rounded-3xl p-5">
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
              <div className="flex gap-2">
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
      </section>
    </div>
  );
}
