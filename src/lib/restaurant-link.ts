import { queryOptions } from "@tanstack/react-query";
import { notFound } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export type RestaurantRow = {
  id: string;
  slug: string;
  name_en: string;
  name_ar: string;
  logo_url: string | null;
};

export type BranchLinkRow = {
  id: string;
  code: string;
  name_en: string;
  name_ar: string;
  city_en: string | null;
  city_ar: string | null;
  address_en: string | null;
  address_ar: string | null;
  phone: string | null;
  is_open: boolean;
  logo_url: string | null;
};

export function restaurantBySlugQuery(slug: string) {
  return queryOptions({
    queryKey: ["restaurant-by-slug", slug],
    staleTime: 60_000,
    queryFn: async () => {
      const { data: restaurant, error } = await supabase
        .from("restaurants")
        .select("id, slug, name_en, name_ar, logo_url")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      if (!restaurant) throw notFound();
      const { data: branches, error: bErr } = await supabase
        .from("branches")
        .select("id, code, name_en, name_ar, city_en, city_ar, address_en, address_ar, phone, is_open, logo_url")
        .eq("restaurant_id", restaurant.id)
        .order("name_en");
      if (bErr) throw bErr;
      return { restaurant: restaurant as RestaurantRow, branches: (branches ?? []) as BranchLinkRow[] };
    },
  });
}
