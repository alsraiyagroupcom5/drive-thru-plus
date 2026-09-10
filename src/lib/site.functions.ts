import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

async function assertSuperAdmin(supabase: unknown, userId: string) {
  const client = supabase as {
    rpc: (fn: "has_role", args: { _user_id: string; _role: "super_admin" }) => PromiseLike<{ data: unknown }>;
  };
  const { data } = await client.rpc("has_role", { _user_id: userId, _role: "super_admin" });
  if (data !== true) throw new Error("FORBIDDEN");
}

/** Public: the stored website content (raw JSON; merged with defaults on the client). */
export const getSiteContent = createServerFn({ method: "GET" }).handler(async () => {
  const db = await admin();
  const { data } = await db.from("site_content").select("content").eq("id", true).maybeSingle();
  return (data?.content ?? {}) as unknown;
});

/** Admin only: replace the full website content document. */
export const saveSiteContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { content: unknown }) => d)
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.supabase, context.userId);
    const db = await admin();
    const { error } = await db
      .from("site_content")
      .upsert({ id: true, content: data.content as never, updated_at: new Date().toISOString(), updated_by: context.userId });
    if (error) throw new Error(error.message);
    await db.from("audit_logs").insert({
      actor: context.userId,
      action: "site_content.save",
      entity: "site_content",
    });
    return { ok: true };
  });

const IMAGE_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/svg+xml": "svg",
};

function decodeBase64(b64: string) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

/** Admin only: upload a website image (logo, hero, slide) and get its public URL. */
export const uploadSiteImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { dataUrl: string }) => d)
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.supabase, context.userId);
    const match = /^data:([^;]+);base64,(.+)$/.exec(data.dataUrl ?? "");
    if (!match) throw new Error("INVALID_IMAGE");
    const type = match[1]!;
    const ext = IMAGE_TYPES[type];
    if (!ext) throw new Error("UNSUPPORTED_IMAGE_TYPE");
    const bytes = decodeBase64(match[2]!);
    if (bytes.byteLength > 5_000_000) throw new Error("IMAGE_TOO_LARGE");

    const path = `site/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const db = await admin();
    const { error } = await db.storage
      .from("brand-logos")
      .upload(path, bytes, { contentType: type, upsert: true });
    if (error) throw new Error(error.message);
    return { url: `/api/public/brand-logo/${path}` };
  });
