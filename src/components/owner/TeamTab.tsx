import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { KeyRound, Plus, Trash2, UserCog } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  createTeamMember,
  ownerTeam,
  removeTeamMember,
  setTeamMemberAccess,
  setTeamMemberPassword,
} from "@/lib/owner.functions";

const input =
  "h-11 w-full rounded-xl border border-border bg-elevated px-3 text-sm outline-none ring-ring/40 focus:ring-2";

type Role = "branch_manager" | "cashier" | "kitchen";
const ROLES: { id: Role; ar: string; en: string; canAr: string; canEn: string }[] = [
  {
    id: "branch_manager",
    ar: "مدير فرع",
    en: "Branch manager",
    canAr: "الطلبات + شاشة الفرع + المتابعة",
    canEn: "Orders, live screen, follow-up",
  },
  { id: "cashier", ar: "كاشير", en: "Cashier", canAr: "الطلبات المباشرة", canEn: "Live orders" },
  { id: "kitchen", ar: "المطبخ", en: "Kitchen", canAr: "شاشة التحضير", canEn: "Kitchen display" },
];

type Branch = Record<string, unknown>;

export function TeamTab({ branches }: { branches: Branch[] }) {
  const { pick } = useI18n();
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);

  const team = useQuery({ queryKey: ["owner-team"], queryFn: () => ownerTeam() });
  const refresh = () => qc.invalidateQueries({ queryKey: ["owner-team"] });

  const branchName = (id: string) => {
    const b = branches.find((x) => x["id"] === id);
    return b ? pick(b["name_ar"] as string, b["name_en"] as string) : "—";
  };

  const access = useMutation({
    mutationFn: (v: { userId: string; role: Role; branchId: string }) =>
      setTeamMemberAccess({ data: v }),
    onSuccess: () => {
      toast.success(pick("تم تحديث الصلاحية", "Access updated"));
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const password = useMutation({
    mutationFn: (v: { userId: string; password: string }) => setTeamMemberPassword({ data: v }),
    onSuccess: () => toast.success(pick("تم تغيير كلمة المرور", "Password updated")),
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (v: { userId: string }) => removeTeamMember({ data: v }),
    onSuccess: () => {
      toast.success(pick("تم حذف الحساب", "Account removed"));
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          {pick(
            "أنشئ حسابات فريق الفروع وحدّد صلاحية كل شخص.",
            "Create branch team accounts and set what each person can access.",
          )}
        </p>
        <button
          onClick={() => setCreating((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-full bg-[image:var(--gradient-brass)] px-5 py-2.5 text-sm font-bold text-primary-foreground"
        >
          <Plus className="h-4 w-4" aria-hidden />
          {pick("حساب جديد", "New account")}
        </button>
      </div>

      {creating ? (
        <NewMemberForm
          branches={branches}
          onDone={() => {
            setCreating(false);
            refresh();
          }}
          onCancel={() => setCreating(false)}
        />
      ) : null}

      <div className="space-y-2">
        {(team.data ?? []).map((m) => (
          <div key={m.userId} className="surface rounded-2xl p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold">{m.fullName || m.email}</p>
                <p className="truncate text-xs text-muted-foreground" dir="ltr">
                  {m.email}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{branchName(m.branchId)}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  className={cn(input, "h-9 w-auto")}
                  value={m.role}
                  onChange={(e) =>
                    access.mutate({ userId: m.userId, role: e.target.value as Role, branchId: m.branchId })
                  }
                >
                  {ROLES.map((r) => (
                    <option key={r.id} value={r.id}>
                      {pick(r.ar, r.en)}
                    </option>
                  ))}
                </select>
                <select
                  className={cn(input, "h-9 w-auto")}
                  value={m.branchId}
                  onChange={(e) =>
                    access.mutate({ userId: m.userId, role: m.role as Role, branchId: e.target.value })
                  }
                >
                  {branches.map((b) => (
                    <option key={b["id"] as string} value={b["id"] as string}>
                      {pick(b["name_ar"] as string, b["name_en"] as string)}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => {
                    const pwd = window.prompt(pick("كلمة مرور جديدة (8 أحرف على الأقل)", "New password (min 8 characters)"));
                    if (pwd) password.mutate({ userId: m.userId, password: pwd });
                  }}
                  className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs"
                >
                  <KeyRound className="h-3 w-3" aria-hidden />
                  {pick("كلمة المرور", "Password")}
                </button>
                <button
                  onClick={() => {
                    if (window.confirm(pick("حذف هذا الحساب؟", "Remove this account?")))
                      remove.mutate({ userId: m.userId });
                  }}
                  className="inline-flex items-center gap-1 rounded-full border border-destructive/40 px-3 py-1.5 text-xs text-destructive"
                >
                  <Trash2 className="h-3 w-3" aria-hidden />
                  {pick("حذف", "Remove")}
                </button>
              </div>
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              <UserCog className="me-1 inline h-3 w-3" aria-hidden />
              {pick(
                ROLES.find((r) => r.id === m.role)?.canAr ?? "",
                ROLES.find((r) => r.id === m.role)?.canEn ?? "",
              )}
            </p>
          </div>
        ))}
        {team.data && !team.data.length ? (
          <p className="py-16 text-center text-sm text-muted-foreground">
            {pick("لا يوجد فريق بعد", "No team accounts yet")}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function NewMemberForm({
  branches,
  onDone,
  onCancel,
}: {
  branches: Branch[];
  onDone: () => void;
  onCancel: () => void;
}) {
  const { pick } = useI18n();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "kitchen" as Role,
    branchId: (branches[0]?.["id"] as string) ?? "",
  });

  const create = useMutation({
    mutationFn: () => createTeamMember({ data: form }),
    onSuccess: () => {
      toast.success(pick("تم إنشاء الحساب", "Account created"));
      onDone();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="surface rounded-3xl p-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          className={input}
          placeholder={pick("الاسم الكامل", "Full name")}
          value={form.fullName}
          onChange={(e) => setForm({ ...form, fullName: e.target.value })}
        />
        <input
          className={input}
          dir="ltr"
          placeholder={pick("البريد الإلكتروني", "Email")}
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <input
          className={input}
          dir="ltr"
          type="text"
          placeholder={pick("كلمة المرور", "Password")}
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <select
          className={input}
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
        >
          {ROLES.map((r) => (
            <option key={r.id} value={r.id}>
              {pick(r.ar, r.en)}
            </option>
          ))}
        </select>
        <select
          className={input}
          value={form.branchId}
          onChange={(e) => setForm({ ...form, branchId: e.target.value })}
        >
          {branches.map((b) => (
            <option key={b["id"] as string} value={b["id"] as string}>
              {pick(b["name_ar"] as string, b["name_en"] as string)}
            </option>
          ))}
        </select>
      </div>
      <div className="mt-5 flex gap-2">
        <button
          onClick={() => create.mutate()}
          disabled={create.isPending}
          className="rounded-full bg-[image:var(--gradient-brass)] px-6 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-50"
        >
          {pick("إنشاء", "Create")}
        </button>
        <button onClick={onCancel} className="rounded-full border border-border px-6 py-2.5 text-sm">
          {pick("إلغاء", "Cancel")}
        </button>
      </div>
    </div>
  );
}
