import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type LiveOrder = {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  payment_method: string;
  total: number;
  created_at: string;
  ready_at: string | null;
  arrived_at: string | null;
  subtotal: number;
  tax: number;
  customer_arrived: boolean;
  distance_km: number | null;
  eta_minutes: number | null;
  location_updated_at: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  vehicle_snapshot: { plate?: string; make?: string; model?: string; color?: string } | null;
  target_prep_minutes: number | null;
  notes: string | null;
  branch_id: string;
  order_items: {
    id: string;
    name_en: string;
    name_ar: string;
    quantity: number;
    order_item_modifiers: { id: string; name_en: string; name_ar: string }[];
  }[];
};

export function useStaffBranch() {
  return useQuery({
    queryKey: ["staff-branch"],
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return null;
      const { data } = await supabase
        .from("user_roles")
        .select("role, branch_id, branches(id, name_en, name_ar)")
        .eq("user_id", auth.user.id)
        .limit(1)
        .maybeSingle();
      return data;
    },
    staleTime: 300_000,
  });
}

export function useLiveOrders(branchId: string | null | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["live-orders", branchId],
    enabled: !!branchId,
    refetchInterval: 20_000,
    queryFn: async () => {
      const since = new Date(Date.now() - 24 * 60 * 60_000).toISOString();
      const { data, error } = await supabase
        .from("orders")
        .select(
          "id, order_number, status, payment_status, payment_method, total, subtotal, tax, created_at, ready_at, arrived_at, customer_arrived, distance_km, eta_minutes, location_updated_at, customer_name, customer_phone, vehicle_snapshot, target_prep_minutes, notes, branch_id, order_items(id, name_en, name_ar, quantity, order_item_modifiers(id, name_en, name_ar))",
        )
        .eq("branch_id", branchId!)
        .gte("created_at", since)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as unknown as LiveOrder[];
    },
  });

  useEffect(() => {
    if (!branchId) return;
    const channel = supabase
      .channel(`branch-orders-${branchId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders", filter: `branch_id=eq.${branchId}` },
        () => queryClient.invalidateQueries({ queryKey: ["live-orders", branchId] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [branchId, queryClient]);

  return query;
}

export async function setOrderStatus(orderId: string, status: string) {
  const patch: Record<string, unknown> = { status };
  if (status === "READY") patch["ready_at"] = new Date().toISOString();
  if (status === "COMPLETED") patch["completed_at"] = new Date().toISOString();
  const { error } = await supabase
    .from("orders")
    .update(patch as never)
    .eq("id", orderId);
  if (error) throw error;
}

export function minutesSince(iso: string) {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60_000));
}
