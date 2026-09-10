import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Smile } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { demoCredentials, type DemoRole } from "@/lib/demo.functions";
import { secureStaffSignIn } from "@/lib/security.functions";
import { BrandMark, LanguageToggle } from "@/components/customer/AppShell";


export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Staff sign in — QR-Spring" },
      { name: "description", content: "Kitchen and branch team access to live drive-thru orders." },
      { property: "og:title", content: "Staff sign in — QR-Spring" },
      { property: "og:description", content: "Team access to live drive-thru orders." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: StaffAuth,
});

function StaffAuth() {
  const { t, pick } = useI18n();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const routeByRole = async (userId: string | undefined) => {
    const { data: roles } = userId
      ? await supabase.from("user_roles").select("role").eq("user_id", userId)
      : { data: [] };
    const list = (roles ?? []).map((r) => r.role as string);
    if (list.includes("super_admin")) navigate({ to: "/admin", search: { tab: undefined } });
    else if (list.includes("general_manager")) navigate({ to: "/owner" });
    else if (list.includes("kitchen")) navigate({ to: "/kitchen" });
    else navigate({ to: "/live" });
  };

  const submit = async () => {
    setBusy(true);
    try {
      const result = await secureStaffSignIn({ data: { email, password } });
      if (!result.ok) {
        if (result.code === "LOCKED") {
          throw new Error(pick("تم قفل تسجيل الدخول مؤقتاً. حاول بعد 30 دقيقة.", "Sign-in is temporarily locked. Try again in 30 minutes."));
        }
        throw new Error(pick("البريد الإلكتروني أو كلمة المرور غير صحيحة.", "Invalid email or password."));
      }
      const { data: signIn, error } = await supabase.auth.setSession({
        access_token: result.accessToken,
        refresh_token: result.refreshToken,
      });
      if (error) throw error;
      await routeByRole(signIn.user?.id ?? result.userId);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("somethingWrong"));
    } finally {
      setBusy(false);
    }
  };

  const demoLogin = async (role: DemoRole) => {
    setBusy(true);
    try {
      const creds = await demoCredentials({ data: { role } });
      const result = await secureStaffSignIn({ data: creds });
      if (!result.ok) {
        throw new Error(
          result.code === "LOCKED"
            ? pick("تم قفل تسجيل الدخول مؤقتاً. حاول بعد 30 دقيقة.", "Sign-in is temporarily locked. Try again in 30 minutes.")
            : pick("تعذر تسجيل الدخول التجريبي.", "Demo sign-in is unavailable."),
        );
      }
      const { data: signIn, error } = await supabase.auth.setSession({
        access_token: result.accessToken,
        refresh_token: result.refreshToken,
      });
      if (error) throw error;
      await routeByRole(signIn.user?.id ?? result.userId);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("somethingWrong"));
    } finally {
      setBusy(false);
    }
  };



  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6">
      <div className="mb-6 flex items-center justify-between">
        <BrandMark />
        <LanguageToggle />
      </div>
      <div className="surface rounded-3xl p-6">
        <h1 className="font-display text-2xl font-bold">{t("staffLogin")}</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          {t("kitchen")} · {t("liveOrders")}
        </p>

        <div className="mt-5 space-y-3">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            dir="ltr"
            placeholder="staff@qrspring.qa"
            aria-label="Email"
            className="h-11 w-full rounded-xl border border-border bg-elevated px-3 text-sm outline-none ring-ring/40 focus:ring-2"
          />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            dir="ltr"
            placeholder="••••••••"
            aria-label="Password"
            className="h-11 w-full rounded-xl border border-border bg-elevated px-3 text-sm outline-none ring-ring/40 focus:ring-2"
          />

          <button
            onClick={submit}
            disabled={busy || !email || password.length < 6}
            className="w-full rounded-full bg-[image:var(--gradient-brass)] py-3.5 font-display font-bold text-primary-foreground disabled:opacity-50"
          >
            {t("staffLogin")}
          </button>

          <div className="rounded-2xl border border-dashed border-border p-3">
            <p className="text-center text-[11px] text-muted-foreground">
              {pick("دخول تجريبي بنقرة واحدة", "One-tap demo sign in")}
            </p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {(
                [
                  { role: "admin" as const, label: pick("المسؤول", "Admin") },
                  { role: "owner" as const, label: pick("المالك", "Owner") },
                  { role: "staff" as const, label: pick("الفريق", "Team") },
                ]
              ).map((d) => (
                <button
                  key={d.role}
                  onClick={() => demoLogin(d.role)}
                  disabled={busy}
                  className="flex flex-col items-center gap-1 rounded-xl border border-border bg-elevated py-2.5 text-[11px] font-semibold transition hover:border-primary hover:text-primary disabled:opacity-50"
                >
                  <Smile className="h-5 w-5" aria-hidden />
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            {pick(
              "الحسابات يتم إنشاؤها من قِبل المسؤول العام فقط.",
              "Accounts are created by the general admin only.",
            )}
          </p>

          <Link
            to="/admin"
            search={{ tab: undefined }}
            className="block w-full text-center text-xs text-muted-foreground underline underline-offset-4"
          >
            {pick("لوحة المسؤول العام", "General admin console")}
          </Link>

        </div>
      </div>
    </div>
  );
}
