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
      business_profiles: {
        Row: {
          address: string | null
          bank_account: string | null
          bank_name: string | null
          business_name: string
          city: string | null
          created_at: string
          email: string | null
          gstin: string | null
          id: string
          ifsc: string | null
          owner_id: string
          owner_name: string | null
          pan: string | null
          phone: string | null
          pincode: string | null
          state: string | null
          updated_at: string
          upi_id: string | null
        }
        Insert: {
          address?: string | null
          bank_account?: string | null
          bank_name?: string | null
          business_name?: string
          city?: string | null
          created_at?: string
          email?: string | null
          gstin?: string | null
          id?: string
          ifsc?: string | null
          owner_id?: string
          owner_name?: string | null
          pan?: string | null
          phone?: string | null
          pincode?: string | null
          state?: string | null
          updated_at?: string
          upi_id?: string | null
        }
        Update: {
          address?: string | null
          bank_account?: string | null
          bank_name?: string | null
          business_name?: string
          city?: string | null
          created_at?: string
          email?: string | null
          gstin?: string | null
          id?: string
          ifsc?: string | null
          owner_id?: string
          owner_name?: string | null
          pan?: string | null
          phone?: string | null
          pincode?: string | null
          state?: string | null
          updated_at?: string
          upi_id?: string | null
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string | null
          contact_name: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          owner_id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          contact_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          owner_id?: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          contact_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          owner_id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      deliveries: {
        Row: {
          created_at: string
          delivered_at: string | null
          dispatched_at: string | null
          driver_name: string | null
          id: string
          order_id: string | null
          owner_id: string
          status: string
          updated_at: string
          vehicle_id: string | null
        }
        Insert: {
          created_at?: string
          delivered_at?: string | null
          dispatched_at?: string | null
          driver_name?: string | null
          id?: string
          order_id?: string | null
          owner_id?: string
          status?: string
          updated_at?: string
          vehicle_id?: string | null
        }
        Update: {
          created_at?: string
          delivered_at?: string | null
          dispatched_at?: string | null
          driver_name?: string | null
          id?: string
          order_id?: string | null
          owner_id?: string
          status?: string
          updated_at?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deliveries_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliveries_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_sites: {
        Row: {
          address: string | null
          contact_name: string | null
          created_at: string
          id: string
          map_url: string | null
          name: string
          owner_id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          contact_name?: string | null
          created_at?: string
          id?: string
          map_url?: string | null
          name: string
          owner_id?: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          contact_name?: string | null
          created_at?: string
          id?: string
          map_url?: string | null
          name?: string
          owner_id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      demo_users: {
        Row: {
          created_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          user_id?: string
        }
        Relationships: []
      }
      drivers: {
        Row: {
          created_at: string
          id: string
          licence_number: string | null
          name: string
          owner_id: string
          phone: string | null
          status: string
          updated_at: string
          vehicle_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          licence_number?: string | null
          name: string
          owner_id?: string
          phone?: string | null
          status?: string
          updated_at?: string
          vehicle_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          licence_number?: string | null
          name?: string
          owner_id?: string
          phone?: string | null
          status?: string
          updated_at?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "drivers_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount: number
          created_at: string
          customer_name: string
          due_date: string
          id: string
          invoice_no: string
          order_id: string | null
          owner_id: string
          status: string
          updated_at: string
        }
        Insert: {
          amount?: number
          created_at?: string
          customer_name: string
          due_date?: string
          id?: string
          invoice_no: string
          order_id?: string | null
          owner_id?: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          customer_name?: string
          due_date?: string
          id?: string
          invoice_no?: string
          order_id?: string | null
          owner_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      materials: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_id: string
          rate: number
          unit: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_id?: string
          rate?: number
          unit?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
          rate?: number
          unit?: string
          updated_at?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          advance_amount: number
          amount: number
          created_at: string
          customer_id: string | null
          customer_name: string
          delivery_date: string | null
          driver_id: string | null
          gst_percent: number
          haulage_freight: number
          id: string
          material: string
          order_date: string
          order_no: string
          owner_id: string
          quantity: number
          rate: number
          site: string | null
          site_id: string | null
          status: string
          target_window: string | null
          unit: string
          updated_at: string
          vehicle_id: string | null
        }
        Insert: {
          advance_amount?: number
          amount?: number
          created_at?: string
          customer_id?: string | null
          customer_name: string
          delivery_date?: string | null
          driver_id?: string | null
          gst_percent?: number
          haulage_freight?: number
          id?: string
          material: string
          order_date?: string
          order_no: string
          owner_id?: string
          quantity?: number
          rate?: number
          site?: string | null
          site_id?: string | null
          status?: string
          target_window?: string | null
          unit?: string
          updated_at?: string
          vehicle_id?: string | null
        }
        Update: {
          advance_amount?: number
          amount?: number
          created_at?: string
          customer_id?: string | null
          customer_name?: string
          delivery_date?: string | null
          driver_id?: string | null
          gst_percent?: number
          haulage_freight?: number
          id?: string
          material?: string
          order_date?: string
          order_no?: string
          owner_id?: string
          quantity?: number
          rate?: number
          site?: string | null
          site_id?: string | null
          status?: string
          target_window?: string | null
          unit?: string
          updated_at?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "delivery_sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_settings: {
        Row: {
          created_at: string
          id: boolean
          payee_name: string | null
          qr_path: string | null
          updated_at: string
          upi_id: string | null
        }
        Insert: {
          created_at?: string
          id?: boolean
          payee_name?: string | null
          qr_path?: string | null
          updated_at?: string
          upi_id?: string | null
        }
        Update: {
          created_at?: string
          id?: boolean
          payee_name?: string | null
          qr_path?: string | null
          updated_at?: string
          upi_id?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          customer_name: string
          id: string
          invoice_id: string | null
          method: string
          owner_id: string
          paid_on: string
          reference: string | null
          updated_at: string
        }
        Insert: {
          amount?: number
          created_at?: string
          customer_name: string
          id?: string
          invoice_id?: string | null
          method?: string
          owner_id?: string
          paid_on?: string
          reference?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          customer_name?: string
          id?: string
          invoice_id?: string | null
          method?: string
          owner_id?: string
          paid_on?: string
          reference?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_payments: {
        Row: {
          admin_note: string | null
          amount: number
          created_at: string
          email: string | null
          id: string
          plan: string
          reference: string | null
          screenshot_path: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          amount?: number
          created_at?: string
          email?: string | null
          id?: string
          plan: string
          reference?: string | null
          screenshot_path: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_note?: string | null
          amount?: number
          created_at?: string
          email?: string | null
          id?: string
          plan?: string
          reference?: string | null
          screenshot_path?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      plan_settings: {
        Row: {
          created_at: string
          customers_limit: number | null
          materials_limit: number | null
          orders_limit: number | null
          plan: string
          price: number
          updated_at: string
          vehicles_limit: number | null
        }
        Insert: {
          created_at?: string
          customers_limit?: number | null
          materials_limit?: number | null
          orders_limit?: number | null
          plan: string
          price?: number
          updated_at?: string
          vehicles_limit?: number | null
        }
        Update: {
          created_at?: string
          customers_limit?: number | null
          materials_limit?: number | null
          orders_limit?: number | null
          plan?: string
          price?: number
          updated_at?: string
          vehicles_limit?: number | null
        }
        Relationships: []
      }
      quotations: {
        Row: {
          amount: number
          created_at: string
          customer_name: string
          gst_percent: number
          haulage_freight: number
          id: string
          material: string
          order_id: string | null
          owner_id: string
          quantity: number
          quote_no: string
          rate: number
          site: string | null
          status: string
          unit: string
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          amount?: number
          created_at?: string
          customer_name: string
          gst_percent?: number
          haulage_freight?: number
          id?: string
          material: string
          order_id?: string | null
          owner_id?: string
          quantity?: number
          quote_no: string
          rate?: number
          site?: string | null
          status?: string
          unit?: string
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          customer_name?: string
          gst_percent?: number
          haulage_freight?: number
          id?: string
          material?: string
          order_id?: string | null
          owner_id?: string
          quantity?: number
          quote_no?: string
          rate?: number
          site?: string | null
          status?: string
          unit?: string
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotations_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          business_name: string | null
          created_at: string
          email: string | null
          id: string
          notes: string | null
          plan: string
          requested_plan: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          business_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          notes?: string | null
          plan?: string
          requested_plan?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          business_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          notes?: string | null
          plan?: string
          requested_plan?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          capacity_tonnes: number
          created_at: string
          id: string
          owner_id: string
          registration: string
          status: string
          updated_at: string
          vehicle_type: string
        }
        Insert: {
          capacity_tonnes?: number
          created_at?: string
          id?: string
          owner_id?: string
          registration: string
          status?: string
          updated_at?: string
          vehicle_type?: string
        }
        Update: {
          capacity_tonnes?: number
          created_at?: string
          id?: string
          owner_id?: string
          registration?: string
          status?: string
          updated_at?: string
          vehicle_type?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_plan: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_demo_user: { Args: { _user_id: string }; Returns: boolean }
      request_plan: { Args: { _plan: string }; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
