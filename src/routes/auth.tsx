import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { branchesQuery } from "@/lib/menu-data";
import { claimStaffRole } from "@/lib/staff.functions";
import { useI18n } from "@/lib/i18n";
import { BrandMark, LanguageToggle } from "@/components/customer/AppShell";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Staff sign in — MASAR Grill" },
      { name: "description", content: "Kitchen and branch team access to live drive-thru orders." },
      { property: "og:title", content: "Staff sign in — MASAR Grill" },
      { property: "og:description", content: "Team access to live drive-thru orders." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: StaffAuth,
});

function StaffAuth() {
  const { t, pick } = useI18n();
  const navigate = useNavigate();
  const branches = useQuery(branchesQuery);

  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"kitchen" | "branch_manager">("kitchen");
  const [branchId, setBranchId] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      if (mode === "up") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + "/auth" },
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      const chosen = branchId || branches.data?.[0]?.id;
      if (chosen) await claimStaffRole({ data: { role, branchId: chosen } });
      navigate({ to: role === "kitchen" ? "/kitchen" : "/live" });
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
            placeholder="staff@masar.qa"
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

          <div className="grid grid-cols-2 gap-2">
            {(
              [
                { id: "kitchen", label: t("kitchen") },
                { id: "branch_manager", label: t("liveOrders") },
              ] as const
            ).map((r) => (
              <button
                key={r.id}
                onClick={() => setRole(r.id)}
                className={cn(
                  "rounded-xl border px-3 py-2.5 text-xs font-semibold",
                  role === r.id ? "border-primary bg-primary/10 text-primary" : "border-border",
                )}
              >
                {r.label}
              </button>
            ))}
          </div>

          <select
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
            aria-label={t("branch")}
            className="h-11 w-full rounded-xl border border-border bg-elevated px-3 text-sm outline-none"
          >
            <option value="">{t("chooseBranch")}</option>
            {(branches.data ?? []).map((b) => (
              <option key={b.id} value={b.id}>
                {pick(b.name_ar, b.name_en)}
              </option>
            ))}
          </select>

          <button
            onClick={submit}
            disabled={busy || !email || password.length < 6}
            className="w-full rounded-full bg-[image:var(--gradient-brass)] py-3.5 font-display font-bold text-primary-foreground disabled:opacity-50"
          >
            {mode === "in" ? t("staffLogin") : t("continue")}
          </button>
          <button
            onClick={() => setMode(mode === "in" ? "up" : "in")}
            className="w-full text-xs text-muted-foreground underline underline-offset-4"
          >
            {mode === "in" ? "Create a staff account" : "I already have an account"}
          </button>
        </div>
      </div>
    </div>
  );
}
