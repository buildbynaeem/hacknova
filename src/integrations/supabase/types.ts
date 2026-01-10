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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      invoices: {
        Row: {
          amount: number
          created_at: string
          id: string
          invoice_number: string
          invoice_url: string | null
          is_paid: boolean | null
          paid_at: string | null
          sender_id: string | null
          shipment_id: string
          tax_amount: number | null
          total_amount: number
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          invoice_number: string
          invoice_url?: string | null
          is_paid?: boolean | null
          paid_at?: string | null
          sender_id?: string | null
          shipment_id: string
          tax_amount?: number | null
          total_amount: number
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          invoice_number?: string
          invoice_url?: string | null
          is_paid?: boolean | null
          paid_at?: string | null
          sender_id?: string | null
          shipment_id?: string
          tax_amount?: number | null
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoices_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments_secure"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_config: {
        Row: {
          base_fare: number
          cost_per_km: number
          created_at: string
          created_by: string | null
          effective_from: string
          effective_to: string | null
          id: string
          is_active: boolean
          max_weight: number
          min_weight: number
          updated_at: string
          vehicle_type: Database["public"]["Enums"]["vehicle_type"]
        }
        Insert: {
          base_fare?: number
          cost_per_km: number
          created_at?: string
          created_by?: string | null
          effective_from?: string
          effective_to?: string | null
          id?: string
          is_active?: boolean
          max_weight?: number
          min_weight?: number
          updated_at?: string
          vehicle_type: Database["public"]["Enums"]["vehicle_type"]
        }
        Update: {
          base_fare?: number
          cost_per_km?: number
          created_at?: string
          created_by?: string | null
          effective_from?: string
          effective_to?: string | null
          id?: string
          is_active?: boolean
          max_weight?: number
          min_weight?: number
          updated_at?: string
          vehicle_type?: Database["public"]["Enums"]["vehicle_type"]
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      shipments: {
        Row: {
          carbon_score: number | null
          created_at: string
          delivered_at: string | null
          delivery_address: string
          delivery_city: string
          delivery_lat: number | null
          delivery_lng: number | null
          delivery_otp: string
          delivery_pincode: string
          description: string | null
          dimensions: string | null
          distance_km: number | null
          driver_id: string | null
          driver_lat: number | null
          driver_lng: number | null
          estimated_cost: number | null
          final_cost: number | null
          id: string
          is_fragile: boolean | null
          package_type: Database["public"]["Enums"]["package_type"]
          picked_up_at: string | null
          pickup_address: string
          pickup_city: string
          pickup_contact_name: string
          pickup_contact_phone: string
          pickup_date: string
          pickup_lat: number | null
          pickup_lng: number | null
          pickup_otp: string
          pickup_pincode: string
          pickup_time_slot: string | null
          proof_of_delivery_url: string | null
          receiver_name: string
          receiver_phone: string
          sender_id: string | null
          status: Database["public"]["Enums"]["shipment_status"]
          tracking_id: string
          updated_at: string
          vehicle_type: Database["public"]["Enums"]["vehicle_type"] | null
          weight: number | null
        }
        Insert: {
          carbon_score?: number | null
          created_at?: string
          delivered_at?: string | null
          delivery_address: string
          delivery_city: string
          delivery_lat?: number | null
          delivery_lng?: number | null
          delivery_otp: string
          delivery_pincode: string
          description?: string | null
          dimensions?: string | null
          distance_km?: number | null
          driver_id?: string | null
          driver_lat?: number | null
          driver_lng?: number | null
          estimated_cost?: number | null
          final_cost?: number | null
          id?: string
          is_fragile?: boolean | null
          package_type?: Database["public"]["Enums"]["package_type"]
          picked_up_at?: string | null
          pickup_address: string
          pickup_city: string
          pickup_contact_name: string
          pickup_contact_phone: string
          pickup_date: string
          pickup_lat?: number | null
          pickup_lng?: number | null
          pickup_otp: string
          pickup_pincode: string
          pickup_time_slot?: string | null
          proof_of_delivery_url?: string | null
          receiver_name: string
          receiver_phone: string
          sender_id?: string | null
          status?: Database["public"]["Enums"]["shipment_status"]
          tracking_id: string
          updated_at?: string
          vehicle_type?: Database["public"]["Enums"]["vehicle_type"] | null
          weight?: number | null
        }
        Update: {
          carbon_score?: number | null
          created_at?: string
          delivered_at?: string | null
          delivery_address?: string
          delivery_city?: string
          delivery_lat?: number | null
          delivery_lng?: number | null
          delivery_otp?: string
          delivery_pincode?: string
          description?: string | null
          dimensions?: string | null
          distance_km?: number | null
          driver_id?: string | null
          driver_lat?: number | null
          driver_lng?: number | null
          estimated_cost?: number | null
          final_cost?: number | null
          id?: string
          is_fragile?: boolean | null
          package_type?: Database["public"]["Enums"]["package_type"]
          picked_up_at?: string | null
          pickup_address?: string
          pickup_city?: string
          pickup_contact_name?: string
          pickup_contact_phone?: string
          pickup_date?: string
          pickup_lat?: number | null
          pickup_lng?: number | null
          pickup_otp?: string
          pickup_pincode?: string
          pickup_time_slot?: string | null
          proof_of_delivery_url?: string | null
          receiver_name?: string
          receiver_phone?: string
          sender_id?: string | null
          status?: Database["public"]["Enums"]["shipment_status"]
          tracking_id?: string
          updated_at?: string
          vehicle_type?: Database["public"]["Enums"]["vehicle_type"] | null
          weight?: number | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      shipments_secure: {
        Row: {
          carbon_score: number | null
          created_at: string | null
          delivered_at: string | null
          delivery_address: string | null
          delivery_city: string | null
          delivery_lat: number | null
          delivery_lng: number | null
          delivery_otp: string | null
          delivery_pincode: string | null
          description: string | null
          dimensions: string | null
          distance_km: number | null
          driver_id: string | null
          driver_lat: number | null
          driver_lng: number | null
          estimated_cost: number | null
          final_cost: number | null
          id: string | null
          is_fragile: boolean | null
          package_type: Database["public"]["Enums"]["package_type"] | null
          picked_up_at: string | null
          pickup_address: string | null
          pickup_city: string | null
          pickup_contact_name: string | null
          pickup_contact_phone: string | null
          pickup_date: string | null
          pickup_lat: number | null
          pickup_lng: number | null
          pickup_otp: string | null
          pickup_pincode: string | null
          pickup_time_slot: string | null
          proof_of_delivery_url: string | null
          receiver_name: string | null
          receiver_phone: string | null
          sender_id: string | null
          status: Database["public"]["Enums"]["shipment_status"] | null
          tracking_id: string | null
          updated_at: string | null
          weight: number | null
        }
        Insert: {
          carbon_score?: number | null
          created_at?: string | null
          delivered_at?: string | null
          delivery_address?: string | null
          delivery_city?: string | null
          delivery_lat?: number | null
          delivery_lng?: number | null
          delivery_otp?: string | null
          delivery_pincode?: string | null
          description?: string | null
          dimensions?: string | null
          distance_km?: number | null
          driver_id?: string | null
          driver_lat?: number | null
          driver_lng?: number | null
          estimated_cost?: number | null
          final_cost?: number | null
          id?: string | null
          is_fragile?: boolean | null
          package_type?: Database["public"]["Enums"]["package_type"] | null
          picked_up_at?: string | null
          pickup_address?: string | null
          pickup_city?: string | null
          pickup_contact_name?: string | null
          pickup_contact_phone?: never
          pickup_date?: string | null
          pickup_lat?: number | null
          pickup_lng?: number | null
          pickup_otp?: string | null
          pickup_pincode?: string | null
          pickup_time_slot?: string | null
          proof_of_delivery_url?: string | null
          receiver_name?: string | null
          receiver_phone?: never
          sender_id?: string | null
          status?: Database["public"]["Enums"]["shipment_status"] | null
          tracking_id?: string | null
          updated_at?: string | null
          weight?: number | null
        }
        Update: {
          carbon_score?: number | null
          created_at?: string | null
          delivered_at?: string | null
          delivery_address?: string | null
          delivery_city?: string | null
          delivery_lat?: number | null
          delivery_lng?: number | null
          delivery_otp?: string | null
          delivery_pincode?: string | null
          description?: string | null
          dimensions?: string | null
          distance_km?: number | null
          driver_id?: string | null
          driver_lat?: number | null
          driver_lng?: number | null
          estimated_cost?: number | null
          final_cost?: number | null
          id?: string | null
          is_fragile?: boolean | null
          package_type?: Database["public"]["Enums"]["package_type"] | null
          picked_up_at?: string | null
          pickup_address?: string | null
          pickup_city?: string | null
          pickup_contact_name?: string | null
          pickup_contact_phone?: never
          pickup_date?: string | null
          pickup_lat?: number | null
          pickup_lng?: number | null
          pickup_otp?: string | null
          pickup_pincode?: string | null
          pickup_time_slot?: string | null
          proof_of_delivery_url?: string | null
          receiver_name?: string | null
          receiver_phone?: never
          sender_id?: string | null
          status?: Database["public"]["Enums"]["shipment_status"] | null
          tracking_id?: string | null
          updated_at?: string | null
          weight?: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      generate_invoice_number: { Args: never; Returns: string }
      generate_tracking_id: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "manager" | "driver" | "sender"
      package_type: "DOCUMENTS" | "PARCEL" | "FRAGILE" | "HEAVY" | "PERISHABLE"
      shipment_status:
        | "PENDING"
        | "CONFIRMED"
        | "PICKUP_READY"
        | "IN_TRANSIT"
        | "DELIVERED"
        | "CANCELLED"
      vehicle_type:
        | "BIKE"
        | "THREE_WHEELER"
        | "MINI_TRUCK"
        | "TRUCK"
        | "LARGE_TRUCK"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
      app_role: ["admin", "manager", "driver", "sender"],
      package_type: ["DOCUMENTS", "PARCEL", "FRAGILE", "HEAVY", "PERISHABLE"],
      shipment_status: [
        "PENDING",
        "CONFIRMED",
        "PICKUP_READY",
        "IN_TRANSIT",
        "DELIVERED",
        "CANCELLED",
      ],
      vehicle_type: [
        "BIKE",
        "THREE_WHEELER",
        "MINI_TRUCK",
        "TRUCK",
        "LARGE_TRUCK",
      ],
    },
  },
} as const
