import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Subscribes to live order changes and invalidates the given query keys
 * so dashboards update without a page refresh.
 *
 * Realtime `postgres_changes` are filtered by RLS, so the socket must carry
 * the signed-in user's access token. supabase-js only sets it on some auth
 * events, so we set it explicitly before subscribing and again whenever the
 * token is refreshed. If the channel ever errors we resubscribe with a fresh
 * token instead of silently going dead.
 */
export function useOrdersRealtime(keys: string[], channelName: string) {
  const queryClient = useQueryClient();
  const signature = keys.join("|");

  useEffect(() => {
    let disposed = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let retry: ReturnType<typeof setTimeout> | null = null;

    const invalidate = () => {
      for (const key of signature.split("|")) {
        if (key) queryClient.invalidateQueries({ queryKey: [key] });
      }
    };

    const connect = async () => {
      if (disposed) return;
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (token) supabase.realtime.setAuth(token);
      if (disposed) return;

      channel = supabase
        .channel(`${channelName}-${Math.random().toString(36).slice(2, 8)}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, invalidate)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "order_status_history" },
          invalidate,
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            invalidate();
            return;
          }
          if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
            if (disposed || retry) return;
            retry = setTimeout(() => {
              retry = null;
              if (channel) supabase.removeChannel(channel);
              channel = null;
              void connect();
            }, 4000);
          }
        });
    };

    void connect();

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "TOKEN_REFRESHED" && session?.access_token) {
        supabase.realtime.setAuth(session.access_token);
      }
    });

    return () => {
      disposed = true;
      if (retry) clearTimeout(retry);
      sub.subscription.unsubscribe();
      if (channel) supabase.removeChannel(channel);
    };
  }, [signature, channelName, queryClient]);
}
