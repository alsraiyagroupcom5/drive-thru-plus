import { createFileRoute, redirect } from "@tanstack/react-router";

/** Legacy address: the product website now lives at the root. */
export const Route = createFileRoute("/business")({
  beforeLoad: () => {
    throw redirect({ to: "/" });
  },
});
