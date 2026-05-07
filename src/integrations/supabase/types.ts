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
      eng_allowable_stress: {
        Row: {
          created_at: string
          grade: string
          id: string
          material: string
          min_temp_f: number | null
          p_number: number | null
          smts_ksi: number | null
          smys_ksi: number | null
          source: string | null
          spec: string
          stress_values: Json
          type: string | null
        }
        Insert: {
          created_at?: string
          grade: string
          id?: string
          material: string
          min_temp_f?: number | null
          p_number?: number | null
          smts_ksi?: number | null
          smys_ksi?: number | null
          source?: string | null
          spec: string
          stress_values?: Json
          type?: string | null
        }
        Update: {
          created_at?: string
          grade?: string
          id?: string
          material?: string
          min_temp_f?: number | null
          p_number?: number | null
          smts_ksi?: number | null
          smys_ksi?: number | null
          source?: string | null
          spec?: string
          stress_values?: Json
          type?: string | null
        }
        Relationships: []
      }
      eng_classification_mappings: {
        Row: {
          created_at: string
          flange_pt_group: string | null
          material_id: string
          metadata: Json | null
          nace_compliant: boolean | null
          welded_pipe_grade_rule: string | null
          welded_pipe_spec: string | null
        }
        Insert: {
          created_at?: string
          flange_pt_group?: string | null
          material_id: string
          metadata?: Json | null
          nace_compliant?: boolean | null
          welded_pipe_grade_rule?: string | null
          welded_pipe_spec?: string | null
        }
        Update: {
          created_at?: string
          flange_pt_group?: string | null
          material_id?: string
          metadata?: Json | null
          nace_compliant?: boolean | null
          welded_pipe_grade_rule?: string | null
          welded_pipe_spec?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "eng_classification_mappings_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: true
            referencedRelation: "eng_materials"
            referencedColumns: ["id"]
          },
        ]
      }
      eng_flange_pt_ratings: {
        Row: {
          applicable_materials: string[]
          class: number
          created_at: string
          id: string
          material_description: string
          material_group: string
          ratings: Json
          source: string | null
        }
        Insert: {
          applicable_materials?: string[]
          class: number
          created_at?: string
          id?: string
          material_description: string
          material_group: string
          ratings?: Json
          source?: string | null
        }
        Update: {
          applicable_materials?: string[]
          class?: number
          created_at?: string
          id?: string
          material_description?: string
          material_group?: string
          ratings?: Json
          source?: string | null
        }
        Relationships: []
      }
      eng_material_compatibility: {
        Row: {
          bolts: string[]
          created_at: string
          fittings: string[]
          flanges: string[]
          gaskets: string[]
          pipe_id: string
        }
        Insert: {
          bolts?: string[]
          created_at?: string
          fittings?: string[]
          flanges?: string[]
          gaskets?: string[]
          pipe_id: string
        }
        Update: {
          bolts?: string[]
          created_at?: string
          fittings?: string[]
          flanges?: string[]
          gaskets?: string[]
          pipe_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "eng_material_compatibility_pipe_id_fkey"
            columns: ["pipe_id"]
            isOneToOne: true
            referencedRelation: "eng_materials"
            referencedColumns: ["id"]
          },
        ]
      }
      eng_materials: {
        Row: {
          cast_equivalent: string | null
          category: string
          created_at: string
          description: string | null
          designation: string
          id: string
          material_group: string
          max_temp_c: number
          metadata: Json | null
          min_temp_c: number
          source: string | null
          standard: string | null
          updated_at: string
        }
        Insert: {
          cast_equivalent?: string | null
          category: string
          created_at?: string
          description?: string | null
          designation: string
          id: string
          material_group: string
          max_temp_c?: number
          metadata?: Json | null
          min_temp_c?: number
          source?: string | null
          standard?: string | null
          updated_at?: string
        }
        Update: {
          cast_equivalent?: string | null
          category?: string
          created_at?: string
          description?: string | null
          designation?: string
          id?: string
          material_group?: string
          max_temp_c?: number
          metadata?: Json | null
          min_temp_c?: number
          source?: string | null
          standard?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      eng_pipe_dimensions: {
        Row: {
          created_at: string
          id: string
          id_mm: number
          nps: string
          od_in: number
          od_mm: number
          schedule: string
          standard: string
          weight_per_meter: number
          wt_in: number
          wt_mm: number
        }
        Insert: {
          created_at?: string
          id?: string
          id_mm: number
          nps: string
          od_in: number
          od_mm: number
          schedule: string
          standard?: string
          weight_per_meter: number
          wt_in: number
          wt_mm: number
        }
        Update: {
          created_at?: string
          id?: string
          id_mm?: number
          nps?: string
          od_in?: number
          od_mm?: number
          schedule?: string
          standard?: string
          weight_per_meter?: number
          wt_in?: number
          wt_mm?: number
        }
        Relationships: []
      }
      eng_schedule_bands: {
        Row: {
          band: string
          created_at: string
          description: string | null
          label: string
          sort_order: number
          target_schedules: string[]
        }
        Insert: {
          band: string
          created_at?: string
          description?: string | null
          label: string
          sort_order?: number
          target_schedules?: string[]
        }
        Update: {
          band?: string
          created_at?: string
          description?: string | null
          label?: string
          sort_order?: number
          target_schedules?: string[]
        }
        Relationships: []
      }
      eng_valve_specs: {
        Row: {
          cast_spec: string
          created_at: string
          forged_spec: string
          id: string
          material_family: string
          metadata: Json | null
          seat_default: string | null
          stem_packing_default: string | null
          trim_default: string | null
        }
        Insert: {
          cast_spec: string
          created_at?: string
          forged_spec: string
          id?: string
          material_family: string
          metadata?: Json | null
          seat_default?: string | null
          stem_packing_default?: string | null
          trim_default?: string | null
        }
        Update: {
          cast_spec?: string
          created_at?: string
          forged_spec?: string
          id?: string
          material_family?: string
          metadata?: Json | null
          seat_default?: string | null
          stem_packing_default?: string | null
          trim_default?: string | null
        }
        Relationships: []
      }
      saved_projects: {
        Row: {
          created_at: string
          description: string | null
          design_inputs: Json
          id: string
          name: string
          overrides: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          design_inputs?: Json
          id?: string
          name: string
          overrides?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          design_inputs?: Json
          id?: string
          name?: string
          overrides?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      saved_specs: {
        Row: {
          created_at: string
          data: Json
          design_inputs: Json
          flange_rating: string
          id: string
          material_group: string
          overrides: Json
          project_id: string | null
          schedule_band: string
          service_type: string
          spec_name: string
          spec_number: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json
          design_inputs?: Json
          flange_rating?: string
          id?: string
          material_group?: string
          overrides?: Json
          project_id?: string | null
          schedule_band?: string
          service_type?: string
          spec_name?: string
          spec_number: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json
          design_inputs?: Json
          flange_rating?: string
          id?: string
          material_group?: string
          overrides?: Json
          project_id?: string | null
          schedule_band?: string
          service_type?: string
          spec_name?: string
          spec_number?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_specs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "saved_projects"
            referencedColumns: ["id"]
          },
        ]
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
      app_role: "admin" | "paid" | "free"
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
      app_role: ["admin", "paid", "free"],
    },
  },
} as const
