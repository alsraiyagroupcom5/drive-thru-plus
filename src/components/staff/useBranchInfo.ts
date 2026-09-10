import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type BranchInfo = {
  id: string;
  code: string;
  name_en: string;
  name_ar: string;
  address_en: string | null;
  address_ar: string | null;
  city_en: string | null;
  city_ar: string | null;
  phone: string | null;
  opens_at: string;
  closes_at: string;
  is_open: boolean;
  avg_prep_minutes: number;
  maps_url: string | null;
  logo_url: string | null;
  restaurants: {
    id: string;
    name_en: string;
    name_ar: string;
    logo_url: string | null;
    currency: string;
  } | null;
};

export function useBranchInfo(branchId: string | null | undefined) {
  return useQuery({
    queryKey: ["branch-info", branchId],
    enabled: !!branchId,
    staleTime: 300_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("branches")
        .select(
          "id, code, name_en, name_ar, address_en, address_ar, city_en, city_ar, phone, opens_at, closes_at, is_open, avg_prep_minutes, maps_url, logo_url, restaurants(id, name_en, name_ar, logo_url, currency)",
        )
        .eq("id", branchId!)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as BranchInfo | null;
    },
  });
}
