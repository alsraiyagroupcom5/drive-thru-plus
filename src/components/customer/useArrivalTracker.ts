import { useEffect, useRef, useState } from "react";
import { updateOrderLocation } from "@/lib/customer.functions";

type TrackerState = {
  supported: boolean;
  status: "idle" | "requesting" | "tracking" | "denied" | "error";
  distanceKm: number | null;
  etaMinutes: number | null;
  arrived: boolean;
};

const PUSH_EVERY_MS = 15_000;

/**
 * Watches the customer's position while an order is active and pushes it to
 * the branch so staff see distance, ETA and automatic arrival.
 */
export function useArrivalTracker(opts: {
  enabled: boolean;
  token: string | undefined;
  orderId: string;
  onArrived?: () => void;
}) {
  const { enabled, token, orderId, onArrived } = opts;
  const [state, setState] = useState<TrackerState>({
    supported: typeof navigator !== "undefined" && "geolocation" in navigator,
    status: "idle",
    distanceKm: null,
    etaMinutes: null,
    arrived: false,
  });
  const lastPush = useRef(0);
  const arrivedRef = useRef(false);
  const arrivedCb = useRef(onArrived);
  arrivedCb.current = onArrived;

  useEffect(() => {
    if (!enabled || !token) return;
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setState((s) => ({ ...s, supported: false }));
      return;
    }

    let cancelled = false;
    setState((s) => ({ ...s, status: "requesting" }));

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        if (cancelled) return;
        setState((s) => (s.status === "tracking" ? s : { ...s, status: "tracking" }));
        const now = Date.now();
        if (now - lastPush.current < PUSH_EVERY_MS) return;
        lastPush.current = now;
        void updateOrderLocation({
          data: {
            token,
            orderId,
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          },
        })
          .then((res) => {
            if (cancelled) return;
            setState((s) => ({
              ...s,
              status: "tracking",
              distanceKm: res.distanceKm,
              etaMinutes: res.etaMinutes,
              arrived: res.arrived,
            }));
            if (res.arrived && !arrivedRef.current) {
              arrivedRef.current = true;
              arrivedCb.current?.();
            }
          })
          .catch(() => undefined);
      },
      (err) => {
        if (cancelled) return;
        setState((s) => ({
          ...s,
          status: err.code === err.PERMISSION_DENIED ? "denied" : "error",
        }));
      },
      { enableHighAccuracy: true, maximumAge: 10_000, timeout: 20_000 },
    );

    return () => {
      cancelled = true;
      navigator.geolocation.clearWatch(watchId);
    };
  }, [enabled, token, orderId]);

  return state;
}

/** One-shot position read used at checkout; resolves null when unavailable. */
export function getCurrentPosition(timeout = 6000): Promise<{ lat: number; lng: number } | null> {
  if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout, maximumAge: 30_000 },
    );
  });
}
