import { createFileRoute, redirect } from "@tanstack/react-router";

/** Legacy sub-pages: /business/features, /business/pricing, /business/contact. */
export const Route = createFileRoute("/business/$")({
  beforeLoad: ({ location }) => {
    const rest = location.pathname.replace(/^\/business\/?/, "").replace(/\/$/, "");
    const target =
      rest === "features" ? "/features" : rest === "pricing" ? "/pricing" : rest === "contact" ? "/contact" : "/";
    throw redirect({ to: target });
  },
});
