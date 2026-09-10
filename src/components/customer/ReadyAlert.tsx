import { useCallback, useEffect, useRef, useState } from "react";
import { BellRing, PackageCheck, Volume2, VolumeX, X } from "lucide-react";
import { chimeReady, unlockChime, vibrateReady } from "@/lib/chime";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const SOUND_PREF_KEY = "qrspring:ready-sound";

function alertedKey(orderId: string) {
  return `qrspring:ready-alerted:${orderId}`;
}

export function useReadyAlert(orderId: string, status: string | undefined) {
  const [open, setOpen] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [needsGesture, setNeedsGesture] = useState(false);
  const fired = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setSoundOn(window.localStorage.getItem(SOUND_PREF_KEY) !== "off");
  }, []);

  const setSound = useCallback((on: boolean) => {
    setSoundOn(on);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(SOUND_PREF_KEY, on ? "on" : "off");
    }
    if (on) void unlockChime().then((ok) => setNeedsGesture(!ok));
  }, []);

  const enableSound = useCallback(async () => {
    const ok = await unlockChime();
    setNeedsGesture(!ok);
    if (ok) {
      chimeReady();
      setSound(true);
    }
    return ok;
  }, [setSound]);

  // Any tap on the page counts as the gesture that unlocks audio playback.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = () => void unlockChime().then((ok) => ok && setNeedsGesture(false));
    window.addEventListener("pointerdown", handler, { once: true });
    return () => window.removeEventListener("pointerdown", handler);
  }, []);

  useEffect(() => {
    if (status !== "READY" || fired.current) return;
    if (typeof window === "undefined") return;
    if (window.sessionStorage.getItem(alertedKey(orderId)) === "1") {
      fired.current = true;
      return;
    }
    fired.current = true;
    window.sessionStorage.setItem(alertedKey(orderId), "1");
    setOpen(true);
    vibrateReady();
    if (soundOn) {
      const played = chimeReady();
      setNeedsGesture(!played);
    }
    try {
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("QR-Spring", { body: "جاهز للاستلام — Ready for pickup" });
      }
    } catch {
      /* ignored */
    }
  }, [status, orderId, soundOn]);

  return {
    open,
    close: () => setOpen(false),
    replay: () => {
      vibrateReady();
      const played = chimeReady();
      setNeedsGesture(!played);
    },
    soundOn,
    setSound,
    needsGesture,
    enableSound,
  };
}

export function ReadySoundToggle({
  soundOn,
  setSound,
  needsGesture,
  enableSound,
}: {
  soundOn: boolean;
  setSound: (on: boolean) => void;
  needsGesture: boolean;
  enableSound: () => Promise<boolean>;
}) {
  const { t } = useI18n();
  return (
    <button
      type="button"
      onClick={() => (soundOn && !needsGesture ? setSound(false) : void enableSound())}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-bold transition-colors",
        soundOn && !needsGesture
          ? "border-primary/40 bg-primary/10 text-primary"
          : "border-border bg-elevated text-muted-foreground",
      )}
    >
      {soundOn && !needsGesture ? (
        <Volume2 className="h-3.5 w-3.5" aria-hidden />
      ) : (
        <VolumeX className="h-3.5 w-3.5" aria-hidden />
      )}
      {soundOn && !needsGesture ? t("soundAlertOn") : t("enableSoundAlert")}
    </button>
  );
}

export function ReadyAlertOverlay({
  open,
  onClose,
  onReplay,
  pickupCode,
  orderNumber,
}: {
  open: boolean;
  onClose: () => void;
  onReplay: () => void;
  pickupCode: string;
  orderNumber: string | number;
}) {
  const { t, pick } = useI18n();
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[70] flex items-center justify-center bg-background/70 px-5 backdrop-blur-md"
    >
      <div className="animate-rise relative w-full max-w-sm overflow-hidden rounded-[2rem] border border-primary/30 bg-elevated shadow-[var(--shadow-lift)]">
        <button
          type="button"
          onClick={onClose}
          aria-label={t("close")}
          className="absolute end-4 top-4 z-10 grid h-9 w-9 place-items-center rounded-full bg-black/15 text-primary-foreground"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>

        <div className="relative bg-[image:var(--gradient-brass)] px-6 pb-8 pt-10 text-center text-primary-foreground">
          <span className="relative mx-auto grid h-20 w-20 place-items-center rounded-full bg-black/20">
            <span className="absolute inset-0 animate-ping rounded-full bg-white/25" />
            <PackageCheck className="relative h-9 w-9" aria-hidden />
          </span>
          <p className="mt-5 font-display text-3xl font-bold">{t("ready")}</p>
          <p className="mt-1 text-sm opacity-90">
            {pick(
              "طلبك جاهز — توجّه إلى نافذة الاستلام",
              "Your order is ready — head to the pickup window",
            )}
          </p>
        </div>

        <div className="px-6 py-6 text-center">
          <p className="text-[11px] text-muted-foreground">{t("orderNumber")}</p>
          <p dir="ltr" className="font-display text-xl font-bold">
            {orderNumber}
          </p>
          <div className="mt-4 rounded-2xl border border-border bg-surface p-4">
            <p className="text-[11px] text-muted-foreground">{t("pickupCode")}</p>
            <p dir="ltr" className="font-display text-3xl font-bold tracking-[0.35em] text-primary">
              {pickupCode}
            </p>
          </div>

          <div className="mt-5 flex items-center gap-3">
            <button
              type="button"
              onClick={onReplay}
              aria-label={t("replaySound")}
              className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-border text-primary"
            >
              <BellRing className="h-5 w-5" aria-hidden />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-full bg-[image:var(--gradient-brass)] py-3.5 font-display text-base font-bold text-primary-foreground"
            >
              {t("onMyWay")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
