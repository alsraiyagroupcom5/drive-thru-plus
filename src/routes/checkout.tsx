import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Car, CreditCard, Smartphone, Wallet, ShieldCheck, Smile } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/customer/AppShell";
import { useI18n, money } from "@/lib/i18n";
import { useCart } from "@/lib/cart";
import { useCustomerAuth } from "@/lib/customer-auth";
import { branchesQuery } from "@/lib/menu-data";
import {
  getMe,
  placeOrder,
  requestOtp,
  saveVehicle,
  updateProfile,
  verifyOtp,
} from "@/lib/customer.functions";
import { getCurrentPosition } from "@/components/customer/useArrivalTracker";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — QR-Spring" },
      { name: "description", content: "Confirm your car, payment method and place your order." },
      { property: "og:title", content: "Checkout — QR-Spring" },
      { property: "og:description", content: "Confirm your car and place your drive-thru order." },
    ],
  }),
  component: CheckoutPage,
});

type Method = "CARD" | "APPLE_PAY" | "PAY_AT_PICKUP";

function CheckoutPage() {
  const { t, pick, lang } = useI18n();
  const { lines, subtotal, branchId, clear } = useCart();
  const { session, signIn } = useCustomerAuth();
  const navigate = useNavigate();

  const branches = useQuery(branchesQuery);
  const branch = branches.data?.find((b) => b.id === branchId) ?? null;

  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [demoCode, setDemoCode] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [plate, setPlate] = useState("");
  const [carModel, setCarModel] = useState("");
  const [carColor, setCarColor] = useState("");
  const [method, setMethod] = useState<Method>("CARD");
  const [vehicleId, setVehicleId] = useState<string | null>(null);
  const [prepPreference, setPrepPreference] = useState<"ASAP" | "SCHEDULED">("ASAP");
  const [prepDelay, setPrepDelay] = useState(15);

  const me = useQuery({
    queryKey: ["me", session?.token],
    queryFn: () => getMe({ data: { token: session!.token } }),
    enabled: !!session?.token,
  });

  useEffect(() => {
    if (!me.data) return;
    if (me.data.fullName && !name) setName(me.data.fullName);
    const def = me.data.vehicles.find((v) => v.is_default) ?? me.data.vehicles[0];
    if (def && !vehicleId) setVehicleId(def.id);
  }, [me.data, name, vehicleId]);

  const sendCode = useMutation({
    mutationFn: () => requestOtp({ data: { phone } }),
    onSuccess: (res) => {
      setDemoCode(res.demoCode);
      toast.success(`${t("demoCode")} ${res.demoCode}`);
    },
    onError: () => toast.error(t("somethingWrong")),
  });

  const confirmCode = useMutation({
    mutationFn: () => verifyOtp({ data: { phone, code } }),
    onSuccess: (res) => {
      signIn(res.token, res.customer.id);
      setDemoCode(null);
    },
    onError: () => toast.error(t("tryAgain")),
  });

  const demoLogin = useMutation({
    mutationFn: async () => {
      const demoPhone = "+974 5555 1234";
      setPhone(demoPhone);
      const sent = await requestOtp({ data: { phone: demoPhone } });
      return verifyOtp({ data: { phone: demoPhone, code: sent.demoCode } });
    },
    onSuccess: (res) => {
      signIn(res.token, res.customer.id);
      setDemoCode(null);
    },
    onError: () => toast.error(t("somethingWrong")),
  });


  const submit = useMutation({
    mutationFn: async () => {
      const token = session!.token;
      if (name.trim()) await updateProfile({ data: { token, fullName: name.trim() } });
      let vid = vehicleId;
      if (!vid && plate.trim()) {
        const v = await saveVehicle({
          data: { token, plate, model: carModel, color: carColor },
        });
        vid = v.id;
      }
      const fix = await getCurrentPosition();
      return placeOrder({
        data: {
          token,
          branchId: branchId!,
          vehicleId: vid,
          paymentMethod: method,
          items: lines.map((l) => ({
            productId: l.productId,
            quantity: l.quantity,
            options: l.options,
          })),
          lat: fix?.lat ?? null,
          lng: fix?.lng ?? null,
          prepPreference,
          prepDelayMinutes: prepDelay,
        },
      });
    },
    onSuccess: (res) => {
      clear();
      navigate({ to: "/order/$orderId", params: { orderId: res.orderId } });
    },
    onError: () => toast.error(t("somethingWrong")),
  });

  if (!lines.length) {
    return (
      <AppShell>
        <div className="px-5 py-24 text-center">
          <p className="font-display text-lg font-semibold">{t("emptyCart")}</p>
        </div>
      </AppShell>
    );
  }

  const canPlace = !!session && !!branchId && (!!vehicleId || plate.trim().length > 1);

  return (
    <AppShell
      hideNav
      header={
        <header className="border-b border-border px-5 pb-3 pt-6">
          <h1 className="font-display text-2xl font-bold">{t("checkout")}</h1>
          {branch && (
            <p className="mt-1 text-xs text-muted-foreground">
              {t("branch")}: {pick(branch.name_ar, branch.name_en)}
            </p>
          )}
        </header>
      }
    >
      <div className="space-y-4 px-5 pt-4">
        {/* Identity */}
        {!session ? (
          <section className="surface rounded-2xl p-4">
            <h2 className="font-display text-base font-semibold">{t("phoneNumber")}</h2>
            <p className="mt-1 text-xs text-muted-foreground">{t("phoneHint")}</p>
            <div className="mt-3 flex gap-2">
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                inputMode="tel"
                dir="ltr"
                placeholder="+974 5555 1234"
                aria-label={t("phoneNumber")}
                className="h-11 flex-1 rounded-xl border border-border bg-elevated px-3 text-sm outline-none ring-ring/40 focus:ring-2"
              />
              <button
                onClick={() => sendCode.mutate()}
                disabled={phone.replace(/\D/g, "").length < 8 || sendCode.isPending}
                className="rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50"
              >
                {t("sendCode")}
              </button>
            </div>

            <button
              onClick={() => demoLogin.mutate()}
              disabled={demoLogin.isPending}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border py-2.5 text-xs font-semibold transition hover:border-primary hover:text-primary disabled:opacity-50"
            >
              <Smile className="h-4 w-4" aria-hidden />
              {pick("دخول تجريبي بنقرة واحدة", "One-tap demo sign in")}
            </button>


            {demoCode && (
              <div className="mt-4">
                <p className="text-xs text-muted-foreground">{t("enterCode")}</p>
                <div className="mt-2 flex justify-center" dir="ltr">
                  <InputOTP maxLength={6} value={code} onChange={setCode}>
                    <InputOTPGroup>
                      {[0, 1, 2, 3, 4, 5].map((i) => (
                        <InputOTPSlot key={i} index={i} />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <p className="mt-2 text-center text-[11px] text-primary">
                  {t("demoCode")} {demoCode}
                </p>
                <button
                  onClick={() => confirmCode.mutate()}
                  disabled={code.length !== 6 || confirmCode.isPending}
                  className="mt-3 w-full rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50"
                >
                  {t("verify")}
                </button>
              </div>
            )}
          </section>
        ) : (
          <section className="surface rounded-2xl p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-success">
              <ShieldCheck className="h-4 w-4" aria-hidden />
              {me.data?.phone ?? t("verify")}
            </div>
            <label className="mt-3 block text-xs text-muted-foreground" htmlFor="name">
              {t("yourName")}
            </label>
            <input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 h-11 w-full rounded-xl border border-border bg-elevated px-3 text-sm outline-none ring-ring/40 focus:ring-2"
            />
          </section>
        )}

        {/* Vehicle */}
        <section className="surface rounded-2xl p-4">
          <h2 className="flex items-center gap-2 font-display text-base font-semibold">
            <Car className="h-4 w-4 text-primary" aria-hidden />
            {t("vehicle")}
          </h2>
          {me.data?.vehicles.length ? (
            <div className="mt-3 space-y-2">
              {me.data.vehicles.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setVehicleId(v.id)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm",
                    vehicleId === v.id ? "border-primary bg-primary/10" : "border-border bg-elevated",
                  )}
                >
                  <span className="font-semibold">{v.nickname ?? `${v.make ?? ""} ${v.model ?? ""}`}</span>
                  <span dir="ltr" className="text-xs text-muted-foreground">
                    {v.plate} · {v.color}
                  </span>
                </button>
              ))}
              <button
                onClick={() => setVehicleId(null)}
                className="text-xs font-semibold text-primary underline underline-offset-4"
              >
                {t("addVehicle")}
              </button>
            </div>
          ) : null}

          {!vehicleId && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <input
                value={plate}
                onChange={(e) => setPlate(e.target.value)}
                placeholder={t("plate")}
                aria-label={t("plate")}
                className="col-span-2 h-11 rounded-xl border border-border bg-elevated px-3 text-sm outline-none ring-ring/40 focus:ring-2"
              />
              <input
                value={carModel}
                onChange={(e) => setCarModel(e.target.value)}
                placeholder={t("model")}
                aria-label={t("model")}
                className="h-11 rounded-xl border border-border bg-elevated px-3 text-sm outline-none ring-ring/40 focus:ring-2"
              />
              <input
                value={carColor}
                onChange={(e) => setCarColor(e.target.value)}
                placeholder={t("color")}
                aria-label={t("color")}
                className="h-11 rounded-xl border border-border bg-elevated px-3 text-sm outline-none ring-ring/40 focus:ring-2"
              />
            </div>
          )}
        </section>

        {/* Payment */}
        <section className="surface rounded-2xl p-4">
          <h2 className="font-display text-base font-semibold">{t("payment")}</h2>
          <div className="mt-3 space-y-2">
            {(
              [
                { id: "CARD", label: t("card"), icon: CreditCard },
                { id: "APPLE_PAY", label: t("applePay"), icon: Smartphone },
                { id: "PAY_AT_PICKUP", label: t("payAtPickup"), icon: Wallet },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                onClick={() => setMethod(opt.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium",
                  method === opt.id ? "border-primary bg-primary/10" : "border-border bg-elevated",
                )}
              >
                <opt.icon className="h-4 w-4 text-primary" aria-hidden />
                {opt.label}
              </button>
            ))}
          </div>
        </section>

        <section className="surface rounded-2xl p-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{t("subtotal")}</span>
            <span>{money(subtotal, lang)}</span>
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
            <span className="font-display font-semibold">{t("total")}</span>
            <span className="font-display text-lg font-bold text-primary">
              {money(subtotal, lang)}
            </span>
          </div>
        </section>
      </div>

      <div className="sticky bottom-0 mt-6 border-t border-border bg-card/95 p-4 backdrop-blur">
        <button
          onClick={() => submit.mutate()}
          disabled={!canPlace || submit.isPending}
          className="w-full rounded-full bg-[image:var(--gradient-brass)] py-4 font-display text-base font-bold text-primary-foreground disabled:opacity-50"
        >
          {submit.isPending ? t("loading") : `${t("placeOrder")} · ${money(subtotal, lang)}`}
        </button>
      </div>
    </AppShell>
  );
}
