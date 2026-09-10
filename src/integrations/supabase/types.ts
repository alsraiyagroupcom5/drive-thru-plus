export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          actor: string | null
          actor_label: string | null
          created_at: string
          details: Json | null
          entity: string | null
          entity_id: string | null
          id: string
        }
        Insert: {
          action: string
          actor?: string | null
          actor_label?: string | null
          created_at?: string
          details?: Json | null
          entity?: string | null
          entity_id?: string | null
          id?: string
        }
        Update: {
          action?: string
          actor?: string | null
          actor_label?: string | null
          created_at?: string
          details?: Json | null
          entity?: string | null
          entity_id?: string | null
          id?: string
        }
        Relationships: []
      }
      branch_product_availability: {
        Row: {
          branch_id: string
          is_available: boolean
          out_of_stock_on: string | null
          product_id: string
        }
        Insert: {
          branch_id: string
          is_available?: boolean
          out_of_stock_on?: string | null
          product_id: string
        }
        Update: {
          branch_id?: string
          is_available?: boolean
          out_of_stock_on?: string | null
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "branch_product_availability_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "branch_product_availability_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      branches: {
        Row: {
          address_ar: string | null
          address_en: string | null
          approach_radius_m: number
          arrival_radius_m: number
          auto_arrival: boolean
          avg_prep_minutes: number
          avg_speed_kmh: number
          busy_level: number
          city_ar: string | null
          city_en: string | null
          closes_at: string
          code: string
          created_at: string
          id: string
          is_open: boolean
          lat: number | null
          lng: number | null
          location_ping_seconds: number
          logo_url: string | null
          maps_url: string | null
          name_ar: string
          name_en: string
          opens_at: string
          phone: string | null
          restaurant_id: string
          tracking_enabled: boolean
        }
        Insert: {
          address_ar?: string | null
          address_en?: string | null
          approach_radius_m?: number
          arrival_radius_m?: number
          auto_arrival?: boolean
          avg_prep_minutes?: number
          avg_speed_kmh?: number
          busy_level?: number
          city_ar?: string | null
          city_en?: string | null
          closes_at?: string
          code: string
          created_at?: string
          id?: string
          is_open?: boolean
          lat?: number | null
          lng?: number | null
          location_ping_seconds?: number
          logo_url?: string | null
          maps_url?: string | null
          name_ar: string
          name_en: string
          opens_at?: string
          phone?: string | null
          restaurant_id: string
          tracking_enabled?: boolean
        }
        Update: {
          address_ar?: string | null
          address_en?: string | null
          approach_radius_m?: number
          arrival_radius_m?: number
          auto_arrival?: boolean
          avg_prep_minutes?: number
          avg_speed_kmh?: number
          busy_level?: number
          city_ar?: string | null
          city_en?: string | null
          closes_at?: string
          code?: string
          created_at?: string
          id?: string
          is_open?: boolean
          lat?: number | null
          lng?: number | null
          location_ping_seconds?: number
          logo_url?: string | null
          maps_url?: string | null
          name_ar?: string
          name_en?: string
          opens_at?: string
          phone?: string | null
          restaurant_id?: string
          tracking_enabled?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "branches_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          id: string
          is_active: boolean
          name_ar: string
          name_en: string
          restaurant_id: string
          slug: string
          sort_order: number
        }
        Insert: {
          id?: string
          is_active?: boolean
          name_ar: string
          name_en: string
          restaurant_id: string
          slug: string
          sort_order?: number
        }
        Update: {
          id?: string
          is_active?: boolean
          name_ar?: string
          name_en?: string
          restaurant_id?: string
          slug?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "categories_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_vehicles: {
        Row: {
          color: string | null
          created_at: string
          customer_id: string
          id: string
          is_default: boolean
          make: string | null
          model: string | null
          nickname: string | null
          plate: string
          vehicle_type: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string
          customer_id: string
          id?: string
          is_default?: boolean
          make?: string | null
          model?: string | null
          nickname?: string | null
          plate: string
          vehicle_type?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string
          customer_id?: string
          id?: string
          is_default?: boolean
          make?: string | null
          model?: string | null
          nickname?: string | null
          plate?: string
          vehicle_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_vehicles_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          birthday: string | null
          created_at: string
          full_name: string | null
          id: string
          language: string
          last_order_at: string | null
          loyalty_points: number
          phone: string
          restaurant_id: string
          total_orders: number
          total_spent: number
        }
        Insert: {
          birthday?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          language?: string
          last_order_at?: string | null
          loyalty_points?: number
          phone: string
          restaurant_id: string
          total_orders?: number
          total_spent?: number
        }
        Update: {
          birthday?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          language?: string
          last_order_at?: string | null
          loyalty_points?: number
          phone?: string
          restaurant_id?: string
          total_orders?: number
          total_spent?: number
        }
        Relationships: [
          {
            foreignKeyName: "customers_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      modifier_options: {
        Row: {
          id: string
          is_default: boolean
          modifier_id: string
          name_ar: string
          name_en: string
          price_delta: number
          sort_order: number
        }
        Insert: {
          id?: string
          is_default?: boolean
          modifier_id: string
          name_ar: string
          name_en: string
          price_delta?: number
          sort_order?: number
        }
        Update: {
          id?: string
          is_default?: boolean
          modifier_id?: string
          name_ar?: string
          name_en?: string
          price_delta?: number
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "modifier_options_modifier_id_fkey"
            columns: ["modifier_id"]
            isOneToOne: false
            referencedRelation: "product_modifiers"
            referencedColumns: ["id"]
          },
        ]
      }
      order_item_modifiers: {
        Row: {
          id: string
          name_ar: string
          name_en: string
          order_item_id: string
          price_delta: number
        }
        Insert: {
          id?: string
          name_ar: string
          name_en: string
          order_item_id: string
          price_delta?: number
        }
        Update: {
          id?: string
          name_ar?: string
          name_en?: string
          order_item_id?: string
          price_delta?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_item_modifiers_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          id: string
          line_total: number
          name_ar: string
          name_en: string
          notes: string | null
          order_id: string
          product_id: string | null
          quantity: number
          unit_price: number
        }
        Insert: {
          id?: string
          line_total: number
          name_ar: string
          name_en: string
          notes?: string | null
          order_id: string
          product_id?: string | null
          quantity?: number
          unit_price: number
        }
        Update: {
          id?: string
          line_total?: number
          name_ar?: string
          name_en?: string
          notes?: string | null
          order_id?: string
          product_id?: string | null
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      order_status_history: {
        Row: {
          changed_by: string | null
          created_at: string
          id: string
          note: string | null
          order_id: string
          status: Database["public"]["Enums"]["order_status"]
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          id?: string
          note?: string | null
          order_id: string
          status: Database["public"]["Enums"]["order_status"]
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          id?: string
          note?: string | null
          order_id?: string
          status?: Database["public"]["Enums"]["order_status"]
        }
        Relationships: [
          {
            foreignKeyName: "order_status_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          arrival_method: string | null
          arrived_at: string | null
          branch_id: string
          completed_at: string | null
          created_at: string
          customer_arrived: boolean
          customer_id: string | null
          customer_lat: number | null
          customer_lng: number | null
          customer_name: string | null
          customer_phone: string | null
          discount: number
          distance_km: number | null
          eta_minutes: number | null
          id: string
          location_denied: boolean
          location_updated_at: string | null
          notes: string | null
          order_number: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_status: Database["public"]["Enums"]["payment_status"]
          pickup_code: string
          points_earned: number
          ready_at: string | null
          restaurant_id: string
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number
          target_prep_minutes: number
          tax: number
          total: number
          vehicle_id: string | null
          vehicle_snapshot: Json | null
        }
        Insert: {
          arrival_method?: string | null
          arrived_at?: string | null
          branch_id: string
          completed_at?: string | null
          created_at?: string
          customer_arrived?: boolean
          customer_id?: string | null
          customer_lat?: number | null
          customer_lng?: number | null
          customer_name?: string | null
          customer_phone?: string | null
          discount?: number
          distance_km?: number | null
          eta_minutes?: number | null
          id?: string
          location_denied?: boolean
          location_updated_at?: string | null
          notes?: string | null
          order_number: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_status?: Database["public"]["Enums"]["payment_status"]
          pickup_code: string
          points_earned?: number
          ready_at?: string | null
          restaurant_id: string
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          target_prep_minutes?: number
          tax?: number
          total?: number
          vehicle_id?: string | null
          vehicle_snapshot?: Json | null
        }
        Update: {
          arrival_method?: string | null
          arrived_at?: string | null
          branch_id?: string
          completed_at?: string | null
          created_at?: string
          customer_arrived?: boolean
          customer_id?: string | null
          customer_lat?: number | null
          customer_lng?: number | null
          customer_name?: string | null
          customer_phone?: string | null
          discount?: number
          distance_km?: number | null
          eta_minutes?: number | null
          id?: string
          location_denied?: boolean
          location_updated_at?: string | null
          notes?: string | null
          order_number?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_status?: Database["public"]["Enums"]["payment_status"]
          pickup_code?: string
          points_earned?: number
          ready_at?: string | null
          restaurant_id?: string
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          target_prep_minutes?: number
          tax?: number
          total?: number
          vehicle_id?: string | null
          vehicle_snapshot?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "customer_vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          name_ar: string
          name_en: string
        }
        Insert: {
          created_at?: string
          id?: string
          name_ar: string
          name_en: string
        }
        Update: {
          created_at?: string
          id?: string
          name_ar?: string
          name_en?: string
        }
        Relationships: []
      }
      otp_requests: {
        Row: {
          attempts: number
          channel: string
          code: string
          consumed: boolean
          created_at: string
          expires_at: string
          id: string
          phone: string
        }
        Insert: {
          attempts?: number
          channel?: string
          code: string
          consumed?: boolean
          created_at?: string
          expires_at: string
          id?: string
          phone: string
        }
        Update: {
          attempts?: number
          channel?: string
          code?: string
          consumed?: boolean
          created_at?: string
          expires_at?: string
          id?: string
          phone?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          method: Database["public"]["Enums"]["payment_method"]
          order_id: string
          provider: string
          reference: string | null
          status: Database["public"]["Enums"]["payment_status"]
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          method: Database["public"]["Enums"]["payment_method"]
          order_id: string
          provider?: string
          reference?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          order_id?: string
          provider?: string
          reference?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          admin_order_override: boolean
          id: boolean
          updated_at: string
        }
        Insert: {
          admin_order_override?: boolean
          id?: boolean
          updated_at?: string
        }
        Update: {
          admin_order_override?: boolean
          id?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      product_modifiers: {
        Row: {
          id: string
          is_required: boolean
          kind: string
          max_select: number
          name_ar: string
          name_en: string
          product_id: string
          sort_order: number
        }
        Insert: {
          id?: string
          is_required?: boolean
          kind?: string
          max_select?: number
          name_ar: string
          name_en: string
          product_id: string
          sort_order?: number
        }
        Update: {
          id?: string
          is_required?: boolean
          kind?: string
          max_select?: number
          name_ar?: string
          name_en?: string
          product_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_modifiers_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          allergens: string[]
          calories: number | null
          category_id: string
          created_at: string
          description_ar: string | null
          description_en: string | null
          discount_percent: number
          id: string
          image_url: string | null
          is_available: boolean
          is_new: boolean
          is_popular: boolean
          is_spicy: boolean
          name_ar: string
          name_en: string
          prep_minutes: number
          price: number
          restaurant_id: string
          sku: string | null
          sort_order: number
        }
        Insert: {
          allergens?: string[]
          calories?: number | null
          category_id: string
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          discount_percent?: number
          id?: string
          image_url?: string | null
          is_available?: boolean
          is_new?: boolean
          is_popular?: boolean
          is_spicy?: boolean
          name_ar: string
          name_en: string
          prep_minutes?: number
          price: number
          restaurant_id: string
          sku?: string | null
          sort_order?: number
        }
        Update: {
          allergens?: string[]
          calories?: number | null
          category_id?: string
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          discount_percent?: number
          id?: string
          image_url?: string | null
          is_available?: boolean
          is_new?: boolean
          is_popular?: boolean
          is_spicy?: boolean
          name_ar?: string
          name_en?: string
          prep_minutes?: number
          price?: number
          restaurant_id?: string
          sku?: string | null
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          branch_id: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
        }
        Insert: {
          branch_id?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
        }
        Update: {
          branch_id?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurants: {
        Row: {
          created_at: string
          currency: string
          id: string
          logo_url: string | null
          name_ar: string
          name_en: string
          organization_id: string
          owner_order_override: boolean
          slug: string
          tax_rate: number
        }
        Insert: {
          created_at?: string
          currency?: string
          id?: string
          logo_url?: string | null
          name_ar: string
          name_en: string
          organization_id: string
          owner_order_override?: boolean
          slug: string
          tax_rate?: number
        }
        Update: {
          created_at?: string
          currency?: string
          id?: string
          logo_url?: string | null
          name_ar?: string
          name_en?: string
          organization_id?: string
          owner_order_override?: boolean
          slug?: string
          tax_rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "restaurants_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      signup_requests: {
        Row: {
          branches_count: number
          contact_name: string
          created_at: string
          email: string
          handled_at: string | null
          id: string
          message: string | null
          phone: string | null
          plan: string
          restaurant_name: string
          status: string
        }
        Insert: {
          branches_count?: number
          contact_name: string
          created_at?: string
          email: string
          handled_at?: string | null
          id?: string
          message?: string | null
          phone?: string | null
          plan?: string
          restaurant_name: string
          status?: string
        }
        Update: {
          branches_count?: number
          contact_name?: string
          created_at?: string
          email?: string
          handled_at?: string | null
          id?: string
          message?: string | null
          phone?: string | null
          plan?: string
          restaurant_name?: string
          status?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          branch_id: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          branch_id?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          branch_id?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_reset_order: { Args: { _order_id: string }; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
      next_order_number: { Args: never; Returns: string }
    }
    Enums: {
      app_role:
        | "super_admin"
        | "general_manager"
        | "branch_manager"
        | "cashier"
        | "kitchen"
        | "accounting"
        | "marketing"
      order_status:
        | "DRAFT"
        | "PENDING_PAYMENT"
        | "PAYMENT_FAILED"
        | "PAID"
        | "RECEIVED"
        | "ACCEPTED"
        | "PREPARING"
        | "QUALITY_CHECK"
        | "READY"
        | "ARRIVING"
        | "PICKED_UP"
        | "COMPLETED"
        | "CANCELLED"
        | "REFUNDED"
      payment_method: "CARD" | "APPLE_PAY" | "GOOGLE_PAY" | "PAY_AT_PICKUP"
      payment_status: "PENDING" | "PAID" | "FAILED" | "REFUNDED"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "super_admin",
        "general_manager",
        "branch_manager",
        "cashier",
        "kitchen",
        "accounting",
        "marketing",
      ],
      order_status: [
        "DRAFT",
        "PENDING_PAYMENT",
        "PAYMENT_FAILED",
        "PAID",
        "RECEIVED",
        "ACCEPTED",
        "PREPARING",
        "QUALITY_CHECK",
        "READY",
        "ARRIVING",
        "PICKED_UP",
        "COMPLETED",
        "CANCELLED",
        "REFUNDED",
      ],
      payment_method: ["CARD", "APPLE_PAY", "GOOGLE_PAY", "PAY_AT_PICKUP"],
      payment_status: ["PENDING", "PAID", "FAILED", "REFUNDED"],
    },
  },
} as const
