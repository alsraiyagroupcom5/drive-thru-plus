import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Subscribes to live order changes and invalidates the given query keys
 * so dashboards update without a page refresh.
 * Only works for signed-in staff (RLS gates realtime payloads).
 */
export function useOrdersRealtime(keys: string[], channelName: string) {
  const queryClient = useQueryClient();
  const signature = keys.join("|");

  useEffect(() => {
    const invalidate = () => {
      for (const key of signature.split("|")) {
        if (key) queryClient.invalidateQueries({ queryKey: [key] });
      }
    };

    const channel = supabase
      .channel(`${channelName}-${Math.random().toString(36).slice(2, 8)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, invalidate)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "order_status_history" },
        invalidate,
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [signature, channelName, queryClient]);
}
