import { useCallback, useEffect, useRef, useState } from "react";
import { chimeNewOrder, unlockChime, vibrateReady } from "@/lib/chime";

const PREF_KEY = "origami:kitchen-sound";

type MinimalOrder = { id: string; order_number: string; created_at: string };

/**
 * Watches the live order list and fires a sound + callback whenever a brand
 * new order appears, without needing a page refresh.
 */
export function useNewOrderAlert(
  orders: MinimalOrder[] | undefined,
  onNew: (orders: MinimalOrder[]) => void,
) {
  const seen = useRef<Set<string> | null>(null);
  const [soundOn, setSoundOn] = useState(true);
  const [needsGesture, setNeedsGesture] = useState(false);
  const soundRef = useRef(true);
  const callback = useRef(onNew);
  callback.current = onNew;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const on = window.localStorage.getItem(PREF_KEY) !== "off";
    setSoundOn(on);
    soundRef.current = on;
  }, []);

  // Any tap unlocks browser audio playback.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = () => void unlockChime().then((ok) => ok && setNeedsGesture(false));
    window.addEventListener("pointerdown", handler, { once: true });
    return () => window.removeEventListener("pointerdown", handler);
  }, []);

  const setSound = useCallback((on: boolean) => {
    setSoundOn(on);
    soundRef.current = on;
    if (typeof window !== "undefined") window.localStorage.setItem(PREF_KEY, on ? "on" : "off");
    if (on) void unlockChime().then((ok) => setNeedsGesture(!ok));
  }, []);

  const enableSound = useCallback(async () => {
    const ok = await unlockChime();
    setNeedsGesture(!ok);
    if (ok) {
      chimeNewOrder();
      setSound(true);
    }
    return ok;
  }, [setSound]);

  useEffect(() => {
    if (!orders) return;
    if (seen.current === null) {
      seen.current = new Set(orders.map((o) => o.id));
      return;
    }
    const fresh = orders.filter((o) => !seen.current!.has(o.id));
    for (const o of orders) seen.current.add(o.id);
    if (!fresh.length) return;
    callback.current(fresh);
    vibrateReady();
    if (soundRef.current) {
      const played = chimeNewOrder();
      setNeedsGesture(!played);
    }
  }, [orders]);

  return { soundOn, setSound, needsGesture, enableSound };
}
