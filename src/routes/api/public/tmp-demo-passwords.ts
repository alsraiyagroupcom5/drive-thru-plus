import { createFileRoute } from "@tanstack/react-router";

// TEMPORARY: seeds demo account passwords. Deleted right after use.
export const Route = createFileRoute("/api/public/tmp-demo-passwords")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as { accounts: { email: string; password: string }[] };
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data } = await supabaseAdmin.auth.admin.listUsers({ perPage: 200 });
        const out: string[] = [];
        for (const a of body.accounts) {
          const user = data.users.find((u) => u.email === a.email);
          if (!user) {
            out.push(`${a.email}: missing`);
            continue;
          }
          const { error } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
            password: a.password,
            email_confirm: true,
          });
          out.push(`${a.email}: ${error ? error.message : "ok"}`);
        }
        return Response.json({ out });
      },
    },
  },
});
