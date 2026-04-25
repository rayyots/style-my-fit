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
      avatars: {
        Row: {
          body_type: string
          created_at: string
          hair_color: string
          height_cm: number | null
          hips: number
          id: string
          legs: number
          shoulders: number
          skin_tone: string
          torso: number
          updated_at: string
          user_id: string
          waist: number
        }
        Insert: {
          body_type?: string
          created_at?: string
          hair_color?: string
          height_cm?: number | null
          hips?: number
          id?: string
          legs?: number
          shoulders?: number
          skin_tone?: string
          torso?: number
          updated_at?: string
          user_id: string
          waist?: number
        }
        Update: {
          body_type?: string
          created_at?: string
          hair_color?: string
          height_cm?: number | null
          hips?: number
          id?: string
          legs?: number
          shoulders?: number
          skin_tone?: string
          torso?: number
          updated_at?: string
          user_id?: string
          waist?: number
        }
        Relationships: []
      }
      brands: {
        Row: {
          cover_image: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          slug: string
          tagline: string | null
          updated_at: string
        }
        Insert: {
          cover_image?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          slug: string
          tagline?: string | null
          updated_at?: string
        }
        Update: {
          cover_image?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          slug?: string
          tagline?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          quantity: number
          size: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          quantity?: number
          size: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          size?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      exchange_requests: {
        Row: {
          admin_note: string | null
          created_at: string
          id: string
          order_id: string
          order_item_id: string
          original_size: string
          product_id: string
          reason: string | null
          requested_size: string
          status: Database["public"]["Enums"]["exchange_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          created_at?: string
          id?: string
          order_id: string
          order_item_id: string
          original_size: string
          product_id: string
          reason?: string | null
          requested_size: string
          status?: Database["public"]["Enums"]["exchange_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_note?: string | null
          created_at?: string
          id?: string
          order_id?: string
          order_item_id?: string
          original_size?: string
          product_id?: string
          reason?: string | null
          requested_size?: string
          status?: Database["public"]["Enums"]["exchange_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          price_cents: number
          product_id: string
          product_name: string
          quantity: number
          size: string
        }
        Insert: {
          id?: string
          order_id: string
          price_cents: number
          product_id: string
          product_name: string
          quantity: number
          size: string
        }
        Update: {
          id?: string
          order_id?: string
          price_cents?: number
          product_id?: string
          product_name?: string
          quantity?: number
          size?: string
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
      orders: {
        Row: {
          created_at: string
          currency: string
          id: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          shipping_address: string
          shipping_city: string
          shipping_country: string
          shipping_name: string
          shipping_phone: string | null
          status: Database["public"]["Enums"]["order_status"]
          total_cents: number
          user_id: string
        }
        Insert: {
          created_at?: string
          currency?: string
          id?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          shipping_address: string
          shipping_city: string
          shipping_country: string
          shipping_name: string
          shipping_phone?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          total_cents?: number
          user_id: string
        }
        Update: {
          created_at?: string
          currency?: string
          id?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          shipping_address?: string
          shipping_city?: string
          shipping_country?: string
          shipping_name?: string
          shipping_phone?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          total_cents?: number
          user_id?: string
        }
        Relationships: []
      }
      outfits: {
        Row: {
          avatar_config: Json
          created_at: string
          id: string
          is_public: boolean
          items: Json
          likes: number
          name: string
          style_vibe: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_config?: Json
          created_at?: string
          id?: string
          is_public?: boolean
          items?: Json
          likes?: number
          name?: string
          style_vibe?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_config?: Json
          created_at?: string
          id?: string
          is_public?: boolean
          items?: Json
          likes?: number
          name?: string
          style_vibe?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          brand_id: string
          category: string
          created_at: string
          currency: string
          description: string | null
          gender: Database["public"]["Enums"]["product_gender"]
          id: string
          images: string[]
          name: string
          price_cents: number
          sizes: string[]
          updated_at: string
        }
        Insert: {
          brand_id: string
          category: string
          created_at?: string
          currency?: string
          description?: string | null
          gender?: Database["public"]["Enums"]["product_gender"]
          id?: string
          images?: string[]
          name: string
          price_cents?: number
          sizes?: string[]
          updated_at?: string
        }
        Update: {
          brand_id?: string
          category?: string
          created_at?: string
          currency?: string
          description?: string | null
          gender?: Database["public"]["Enums"]["product_gender"]
          id?: string
          images?: string[]
          name?: string
          price_cents?: number
          sizes?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_glb_url: string | null
          created_at: string
          gender: string | null
          height_cm: number | null
          id: string
          name: string | null
          style_vibe: string | null
          updated_at: string
          weight_kg: number | null
        }
        Insert: {
          avatar_glb_url?: string | null
          created_at?: string
          gender?: string | null
          height_cm?: number | null
          id: string
          name?: string | null
          style_vibe?: string | null
          updated_at?: string
          weight_kg?: number | null
        }
        Update: {
          avatar_glb_url?: string | null
          created_at?: string
          gender?: string | null
          height_cm?: number | null
          id?: string
          name?: string | null
          style_vibe?: string | null
          updated_at?: string
          weight_kg?: number | null
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
          role?: Database["public"]["Enums"]["app_role"]
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
      wishlist_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      exchange_status:
        | "requested"
        | "approved"
        | "rejected"
        | "completed"
        | "cancelled"
      order_status: "pending" | "paid" | "shipped" | "cancelled" | "delivered"
      payment_method: "cod" | "mock_card"
      product_gender: "male" | "female" | "unisex"
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
      app_role: ["admin", "user"],
      exchange_status: [
        "requested",
        "approved",
        "rejected",
        "completed",
        "cancelled",
      ],
      order_status: ["pending", "paid", "shipped", "cancelled", "delivered"],
      payment_method: ["cod", "mock_card"],
      product_gender: ["male", "female", "unisex"],
    },
  },
} as const
