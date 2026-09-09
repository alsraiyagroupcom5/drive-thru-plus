import { createFileRoute, redirect } from "@tanstack/react-router";

/** Legacy sub-pages: /business/features, /business/pricing, /business/contact. */
export const Route = createFileRoute("/business/$")({
  beforeLoad: ({ params }) => {
    const rest = (params as { _splat?: string })._splat ?? "";
    const target =
      rest === "features" ? "/features" : rest === "pricing" ? "/pricing" : rest === "contact" ? "/contact" : "/";
    throw redirect({ to: target });
  },
});
