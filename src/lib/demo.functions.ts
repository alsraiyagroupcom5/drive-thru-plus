import { createServerFn } from "@tanstack/react-start";

/** Demo accounts exposed by the one-tap demo buttons. */
const DEMO_ACCOUNTS = {
  admin: "admin@qrspring.qa",
  owner: "owner@qrspring.qa",
  staff: "staff@qrspring.qa",
} as const;

export type DemoRole = keyof typeof DEMO_ACCOUNTS;

const DEMO_PASSWORD = "OrigamiDemo2026!";

/**
 * Returns credentials for fixed, deliberately public demo accounts.
 * This endpoint never changes an account or password.
 */
export const demoCredentials = createServerFn({ method: "POST" })
  .inputValidator((data: { role: DemoRole }) => {
    if (!data || !(data.role in DEMO_ACCOUNTS)) throw new Error("INVALID_ROLE");
    return { role: data.role };
  })
  .handler(async ({ data }) => {
    const email = DEMO_ACCOUNTS[data.role];
    return { email, password: DEMO_PASSWORD };
  });
