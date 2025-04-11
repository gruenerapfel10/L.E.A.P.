export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      languages: {
        Row: {
          code: string
          name: string
          script: string | null
        }
        Insert: {
          code: string
          name: string
          script?: string | null
        }
        Update: {
          code?: string
          name?: string
          script?: string | null
        }
        Relationships: []
      }
      themes: {
        Row: {
          id: number
          name: string
        }
        Insert: {
          id?: number
          name: string
        }
        Update: {
          id?: number
          name?: string
        }
        Relationships: []
      }
      vocabulary_entries: {
        Row: {
          id: number
          language_code: string
          word: string
          lemma: string
          pos: string
          features: Json | null
          definition: string | null
          cefr_level: string | null
          pronunciation_ipa: string | null
          audio_url: string | null
          frequency_rank: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          language_code: string
          word: string
          lemma: string
          pos: string
          features?: Json | null
          definition?: string | null
          cefr_level?: string | null
          pronunciation_ipa?: string | null
          audio_url?: string | null
          frequency_rank?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          language_code?: string
          word?: string
          lemma?: string
          pos?: string
          features?: Json | null
          definition?: string | null
          cefr_level?: string | null
          pronunciation_ipa?: string | null
          audio_url?: string | null
          frequency_rank?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vocabulary_entries_language_code_fkey"
            columns: ["language_code"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["code"]
          },
        ]
      }
      vocabulary_themes: {
        Row: {
          vocabulary_entry_id: number
          theme_id: number
        }
        Insert: {
          vocabulary_entry_id: number
          theme_id: number
        }
        Update: {
          vocabulary_entry_id?: number
          theme_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "vocabulary_themes_theme_id_fkey"
            columns: ["theme_id"]
            isOneToOne: false
            referencedRelation: "themes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vocabulary_themes_vocabulary_entry_id_fkey"
            columns: ["vocabulary_entry_id"]
            isOneToOne: false
            referencedRelation: "vocabulary_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      translations: {
        Row: {
          id: number
          entry_id_1: number
          entry_id_2: number
          relationship_type: string
          context_notes: string | null
          quality_score: number | null
        }
        Insert: {
          id?: number
          entry_id_1: number
          entry_id_2: number
          relationship_type?: string
          context_notes?: string | null
          quality_score?: number | null
        }
        Update: {
          id?: number
          entry_id_1?: number
          entry_id_2?: number
          relationship_type?: string
          context_notes?: string | null
          quality_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "translations_entry_id_1_fkey"
            columns: ["entry_id_1"]
            isOneToOne: false
            referencedRelation: "vocabulary_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "translations_entry_id_2_fkey"
            columns: ["entry_id_2"]
            isOneToOne: false
            referencedRelation: "vocabulary_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_examples: {
        Row: {
          id: number
          vocabulary_entry_id: number
          sentence: string
          translation_en: string | null
          source_reference: string | null
        }
        Insert: {
          id?: number
          vocabulary_entry_id: number
          sentence: string
          translation_en?: string | null
          source_reference?: string | null
        }
        Update: {
          id?: number
          vocabulary_entry_id?: number
          sentence?: string
          translation_en?: string | null
          source_reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "usage_examples_vocabulary_entry_id_fkey"
            columns: ["vocabulary_entry_id"]
            isOneToOne: false
            referencedRelation: "vocabulary_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      word_forms: {
         Row: {
            id: number
            lemma_entry_id: number
            form_entry_id: number
            inflection_description: Json | null
          }
          Insert: {
            id?: number
            lemma_entry_id: number
            form_entry_id: number
            inflection_description?: Json | null
          }
          Update: {
            id?: number
            lemma_entry_id?: number
            form_entry_id?: number
            inflection_description?: Json | null
          }
          Relationships: [
            {
              foreignKeyName: "word_forms_form_entry_id_fkey"
              columns: ["form_entry_id"]
              isOneToOne: false
              referencedRelation: "vocabulary_entries"
              referencedColumns: ["id"]
            },
            {
              foreignKeyName: "word_forms_lemma_entry_id_fkey"
              columns: ["lemma_entry_id"]
              isOneToOne: false
              referencedRelation: "vocabulary_entries"
              referencedColumns: ["id"]
            },
          ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          native_language: string
          target_language: string
          ui_language: string
          plan: string | null
          stripe_customer_id: string | null
          stripe_price_id: string | null
          stripe_subscription_id: string | null
          subscription_period_end: string | null
          subscription_period_start: string | null
          subscription_status: string | null
          subscription_tier: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          native_language?: string
          target_language?: string
          ui_language?: string
          plan?: string | null
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          subscription_period_end?: string | null
          subscription_period_start?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          native_language?: string
          target_language?: string
          ui_language?: string
          plan?: string | null
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          subscription_period_end?: string | null
          subscription_period_start?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_learning_sessions: {
        Row: {
          created_at: string
          end_time: string | null
          id: string
          module_id: string
          source_language: string
          start_time: string
          target_language: string
          user_id: string
        }
        Insert: {
          created_at?: string
          end_time?: string | null
          id?: string
          module_id: string
          source_language: string
          start_time?: string
          target_language: string
          user_id: string
        }
        Update: {
          created_at?: string
          end_time?: string | null
          id?: string
          module_id?: string
          source_language?: string
          start_time?: string
          target_language?: string
          user_id?: string
        }
        Relationships: []
      }
      user_session_events: {
        Row: {
          id: string
          is_correct: boolean | null
          mark_data: Json | null
          modal_schema_id: string | null
          question_data: Json
          session_id: string
          submodule_id: string
          timestamp: string
          user_answer: Json | null
        }
        Insert: {
          id?: string
          is_correct?: boolean | null
          mark_data?: Json | null
          modal_schema_id?: string | null
          question_data: Json
          session_id: string
          submodule_id: string
          timestamp?: string
          user_answer?: Json | null
        }
        Update: {
          id?: string
          is_correct?: boolean | null
          mark_data?: Json | null
          modal_schema_id?: string | null
          question_data?: Json
          session_id?: string
          submodule_id?: string
          timestamp?: string
          user_answer?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "user_session_events_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "user_learning_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_random_vocabulary: {
        Args: {
          p_language: string
          p_limit?: number
          p_pos?: string[]
          p_cefr_level?: string
          p_themes?: string[]
        }
        Returns: Database["public"]["Tables"]["vocabulary_entries"]["Row"][]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
