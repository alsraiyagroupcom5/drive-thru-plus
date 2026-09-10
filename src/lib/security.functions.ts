import { createServerFn, getRequestHeader } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { createHash } from "crypto";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

const loginSchema = z.object({
  email: z.string().trim().email().max(160),
  password: z.string().min(6).max(256),
});

function digest(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

async function requireAdmin(context: { supabase: unknown; userId: string }) {
  const client = context.supabase as {
    rpc: (fn: "has_role", args: { _user_id: string; _role: "super_admin" }) => PromiseLike<{ data: unknown }>;
  };
  const { data } = await client.rpc("has_role", { _user_id: context.userId, _role: "super_admin" });
  if (data !== true) throw new Error("FORBIDDEN");
}

export const secureStaffSignIn = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => loginSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const email = data.email.toLowerCase();
    const forwarded = getRequestHeader("x-forwarded-for")?.split(",")[0]?.trim();
    const ip = forwarded || getRequestHeader("cf-connecting-ip") || "unknown";
    const emailHash = digest(email);
    const ipHash = digest(ip);

    const { data: gate, error: gateError } = await supabaseAdmin
      .rpc("check_login_allowed", { _email_hash: emailHash, _ip_hash: ipHash })
      .maybeSingle();
    if (gateError) throw new Error("LOGIN_UNAVAILABLE");
    if (gate?.allowed === false) {
      return { ok: false as const, code: "LOCKED" as const, lockedUntil: gate.locked_until };
    }

    const url = process.env["SUPABASE_URL"]!;
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
    const authClient = createClient<Database>(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input, init) => {
          const headers = new Headers(init?.headers);
          if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
            headers.delete("Authorization");
          }
          headers.set("apikey", key);
          return fetch(input, { ...init, headers });
        },
      },
    });
    const { data: signedIn, error } = await authClient.auth.signInWithPassword({ email, password: data.password });

    if (error || !signedIn.session || !signedIn.user) {
      const { data: failure } = await supabaseAdmin
        .rpc("register_login_failure", {
          _email: email,
          _email_hash: emailHash,
          _ip_hash: ipHash,
          _user_agent: getRequestHeader("user-agent") || "",
        })
        .maybeSingle();
      return {
        ok: false as const,
        code: failure?.locked_until ? ("LOCKED" as const) : ("INVALID_CREDENTIALS" as const),
        lockedUntil: failure?.locked_until ?? null,
      };
    }

    await supabaseAdmin.rpc("clear_login_failures", { _email_hash: emailHash, _ip_hash: ipHash });
    return {
      ok: true as const,
      accessToken: signedIn.session.access_token,
      refreshToken: signedIn.session.refresh_token,
      userId: signedIn.user.id,
    };
  });

export const listSecurityAlerts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context);
    const { data, error } = await context.supabase
      .from("security_alerts")
      .select("id, alert_type, severity, title, message, attempted_email, attempt_count, created_at, read_at, email_sent_at")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const markSecurityAlertsRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ ids: z.array(z.string().uuid()).max(100) }).parse(input))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    if (!data.ids.length) return { ok: true };
    const { error } = await context.supabase
      .from("security_alerts")
      .update({ read_at: new Date().toISOString() })
      .in("id", data.ids);
    if (error) throw new Error(error.message);
    return { ok: true };
  });