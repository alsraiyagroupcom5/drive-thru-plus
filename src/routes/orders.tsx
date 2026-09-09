import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Repeat, ReceiptText } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/customer/AppShell";
import { useI18n, money } from "@/lib/i18n";
import { useCustomerAuth } from "@/lib/customer-auth";
import { myOrders } from "@/lib/customer.functions";
import { productsQuery } from "@/lib/menu-data";
import { useCart } from "@/lib/cart";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/orders")({
  head: () => ({
    meta: [
      { title: "Order history — MASAR Grill" },
      { name: "description", content: "Your past drive-thru orders, ready to reorder in one tap." },
      { property: "og:title", content: "Order history — MASAR Grill" },
      { property: "og:description", content: "Your past orders, ready to reorder in one tap." },
    ],
  }),
  component: OrdersPage,
});

function OrdersPage() {
  const { t, pick, lang } = useI18n();
  const { session, ready, signOut } = useCustomerAuth();
  const { add } = useCart();
  const navigate = useNavigate();
  const products = useQuery(productsQuery);

  const orders = useQuery({
    queryKey: ["my-orders", session?.token],
    queryFn: () => myOrders({ data: { token: session!.token } }),
    enabled: !!session?.token,
  });

  const reorder = (items: { product_id: string | null; quantity: number }[]) => {
    const catalogue = products.data ?? [];
    let added = 0;
    for (const item of items) {
      const p = catalogue.find((x) => x.id === item.product_id);
      if (!p || !p.is_available) continue;
      add({
        productId: p.id,
        nameEn: p.name_en,
        nameAr: p.name_ar,
        image: p.image_url,
        basePrice: Number(p.price),
        quantity: item.quantity,
        options: [],
      });
      added += 1;
    }
    if (!added) return toast.error(t("unavailable"));
    navigate({ to: "/cart" });
  };

  return (
    <AppShell
      header={
        <header className="flex items-center justify-between border-b border-border px-5 pb-3 pt-6">
          <h1 className="font-display text-2xl font-bold">{t("orderHistory")}</h1>
          {session && (
            <button
              onClick={signOut}
              className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold hover:bg-accent"
            >
              {t("signOut")}
            </button>
          )}
        </header>
      }
    >
      {ready && !session ? (
        <div className="px-5 py-24 text-center">
          <ReceiptText className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden />
          <p className="mt-3 font-display text-lg font-semibold">{t("noOrders")}</p>
          <Link
            to="/menu"
            className="mt-6 inline-block rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
          >
            {t("viewMenu")}
          </Link>
        </div>
      ) : orders.isLoading ? (
        <div className="space-y-3 p-5">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
      ) : (orders.data ?? []).length === 0 ? (
        <div className="px-5 py-24 text-center">
          <p className="font-display text-lg font-semibold">{t("noOrders")}</p>
        </div>
      ) : (
        <ul className="space-y-3 px-5 pt-4">
          {(orders.data ?? []).map((o) => (
            <li key={o.id} className="surface rounded-2xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-display text-base font-semibold">{o.order_number}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {pick(o.branches?.name_ar, o.branches?.name_en)} ·{" "}
                    {new Date(o.created_at).toLocaleDateString(lang === "ar" ? "ar-QA" : "en-GB")}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-elevated px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
                  {o.status}
                </span>
              </div>
              <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                {o.order_items.map((i) => `${i.quantity}× ${pick(i.name_ar, i.name_en)}`).join(" • ")}
              </p>
              <div className="mt-3 flex items-center justify-between">
                <span className="font-display text-base font-semibold text-primary">
                  {money(Number(o.total), lang)}
                </span>
                <div className="flex gap-2">
                  <Link
                    to="/order/$orderId"
                    params={{ orderId: o.id }}
                    className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold hover:bg-accent"
                  >
                    {t("trackOrder")}
                  </Link>
                  <button
                    onClick={() => reorder(o.order_items)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
                  >
                    <Repeat className="h-3.5 w-3.5" aria-hidden />
                    {t("orderAgain")}
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
