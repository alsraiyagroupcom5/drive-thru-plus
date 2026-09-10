import { createServerFn } from "@tanstack/react-start";

/** Demo accounts exposed by the one-tap demo buttons. */
const DEMO_ACCOUNTS = {
  admin: "admin@qrspring.qa",
  owner: "owner@qrspring.qa",
  staff: "staff@example.com",
} as const;

export type DemoRole = keyof typeof DEMO_ACCOUNTS;

const DEMO_PASSWORD = "OrigamiDemo2026!";

/**
 * Returns credentials for a fixed demo account, making sure the password
 * matches the published demo password. Only the three whitelisted demo
 * emails can ever be touched here.
 */
export const demoCredentials = createServerFn({ method: "POST" })
  .inputValidator((data: { role: DemoRole }) => {
    if (!data || !(data.role in DEMO_ACCOUNTS)) throw new Error("INVALID_ROLE");
    return { role: data.role };
  })
  .handler(async ({ data }) => {
    const email = DEMO_ACCOUNTS[data.role];
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: list, error } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
    if (error) throw new Error("DEMO_UNAVAILABLE");
    const user = list.users.find((u) => u.email?.toLowerCase() === email);
    if (!user) throw new Error("DEMO_UNAVAILABLE");

    await supabaseAdmin.auth.admin.updateUserById(user.id, {
      password: DEMO_PASSWORD,
      email_confirm: true,
    });

    return { email, password: DEMO_PASSWORD };
  });
