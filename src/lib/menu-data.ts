import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const RESTAURANT_ID = "22222222-2222-2222-2222-222222222222";

export const branchesQuery = queryOptions({
  queryKey: ["branches"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("branches")
      .select("*")
      .eq("restaurant_id", RESTAURANT_ID)
      .order("name_en");
    if (error) throw error;
    return data;
  },
  staleTime: 60_000,
});

export const categoriesQuery = queryOptions({
  queryKey: ["categories"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("restaurant_id", RESTAURANT_ID)
      .eq("is_active", true)
      .order("sort_order");
    if (error) throw error;
    return data;
  },
  staleTime: 300_000,
});

export const productsQuery = queryOptions({
  queryKey: ["products"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("restaurant_id", RESTAURANT_ID)
      .order("sort_order");
    if (error) throw error;
    return data;
  },
  staleTime: 300_000,
});

export function branchAvailabilityQuery(branchId: string | null) {
  return queryOptions({
    queryKey: ["branch-availability", branchId],
    enabled: !!branchId,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("branch_product_availability")
        .select("product_id, is_available, out_of_stock_on")
        .eq("branch_id", branchId!);
      if (error) throw error;
      return data;
    },
  });
}

export function productQuery(id: string) {
  return queryOptions({
    queryKey: ["product", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, product_modifiers(*, modifier_options(*))")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

import type { Database } from "@/integrations/supabase/types";

export type Product = Database["public"]["Tables"]["products"]["Row"];
export type Branch = Database["public"]["Tables"]["branches"]["Row"];
export type Category = Database["public"]["Tables"]["categories"]["Row"];
