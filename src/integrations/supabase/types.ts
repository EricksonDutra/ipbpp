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
      church_projects: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          progress: number
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          progress?: number
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          progress?: number
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      escalas: {
        Row: {
          created_at: string
          data: string
          funcao: Database["public"]["Enums"]["escala_funcao"]
          horario: string
          id: string
          observacoes: string | null
          responsavel_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data: string
          funcao: Database["public"]["Enums"]["escala_funcao"]
          horario?: string
          id?: string
          observacoes?: string | null
          responsavel_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data?: string
          funcao?: Database["public"]["Enums"]["escala_funcao"]
          horario?: string
          id?: string
          observacoes?: string | null
          responsavel_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "escalas_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_reports: {
        Row: {
          created_at: string
          despesa: number
          document_url: string | null
          id: string
          month: string
          receita: number
          year: number
        }
        Insert: {
          created_at?: string
          despesa?: number
          document_url?: string | null
          id?: string
          month: string
          receita?: number
          year: number
        }
        Update: {
          created_at?: string
          despesa?: number
          document_url?: string | null
          id?: string
          month?: string
          receita?: number
          year?: number
        }
        Relationships: []
      }
      member_requests: {
        Row: {
          admin_notes: string | null
          created_at: string
          description: string
          id: string
          request_type: Database["public"]["Enums"]["request_type"]
          reviewed_at: string | null
          status: Database["public"]["Enums"]["request_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          description: string
          id?: string
          request_type: Database["public"]["Enums"]["request_type"]
          reviewed_at?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          description?: string
          id?: string
          request_type?: Database["public"]["Enums"]["request_type"]
          reviewed_at?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notices: {
        Row: {
          active: boolean
          category: Database["public"]["Enums"]["notice_category"]
          content: string
          created_at: string
          id: string
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          category?: Database["public"]["Enums"]["notice_category"]
          content: string
          created_at?: string
          id?: string
          title: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          category?: Database["public"]["Enums"]["notice_category"]
          content?: string
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      pastoral_records: {
        Row: {
          content: string | null
          created_at: string
          id: string
          member_id: string
          pastor_id: string
          record_date: string
          record_type: Database["public"]["Enums"]["pastoral_record_type"]
          title: string
          updated_at: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          member_id: string
          pastor_id: string
          record_date?: string
          record_type: Database["public"]["Enums"]["pastoral_record_type"]
          title: string
          updated_at?: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          member_id?: string
          pastor_id?: string
          record_date?: string
          record_type?: Database["public"]["Enums"]["pastoral_record_type"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      prayer_requests: {
        Row: {
          author_name: string
          category: string
          content: string
          created_at: string
          id: string
          user_id: string
          visibility: string
        }
        Insert: {
          author_name: string
          category?: string
          content: string
          created_at?: string
          id?: string
          user_id: string
          visibility?: string
        }
        Update: {
          author_name?: string
          category?: string
          content?: string
          created_at?: string
          id?: string
          user_id?: string
          visibility?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          active: boolean
          created_at: string
          data_batismo: string | null
          data_membresia: string | null
          data_nascimento: string | null
          endereco: string | null
          estado_civil: string | null
          full_name: string
          id: string
          observacoes: string | null
          phone: string | null
          profissao: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          data_batismo?: string | null
          data_membresia?: string | null
          data_nascimento?: string | null
          endereco?: string | null
          estado_civil?: string | null
          full_name: string
          id: string
          observacoes?: string | null
          phone?: string | null
          profissao?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          data_batismo?: string | null
          data_membresia?: string | null
          data_nascimento?: string | null
          endereco?: string | null
          estado_civil?: string | null
          full_name?: string
          id?: string
          observacoes?: string | null
          phone?: string | null
          profissao?: string | null
          updated_at?: string
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
      visitors: {
        Row: {
          cidade: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          is_ipb_member: boolean
          notes: string | null
          other_church: string | null
          phone: string | null
          uf: string | null
          visit_date: string
        }
        Insert: {
          cidade?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          is_ipb_member?: boolean
          notes?: string | null
          other_church?: string | null
          phone?: string | null
          uf?: string | null
          visit_date?: string
        }
        Update: {
          cidade?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          is_ipb_member?: boolean
          notes?: string | null
          other_church?: string | null
          phone?: string | null
          uf?: string | null
          visit_date?: string
        }
        Relationships: []
      }
      weekly_bulletins: {
        Row: {
          active: boolean
          bulletin_pdf_url: string | null
          created_at: string
          id: string
          pastoral_message: string | null
          published_at: string
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          bulletin_pdf_url?: string | null
          created_at?: string
          id?: string
          pastoral_message?: string | null
          published_at?: string
          title: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          bulletin_pdf_url?: string | null
          created_at?: string
          id?: string
          pastoral_message?: string | null
          published_at?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_manage_escala: {
        Args: {
          _funcao: Database["public"]["Enums"]["escala_funcao"]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_active_member: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role:
        | "admin"
        | "member"
        | "pastor"
        | "presbitero"
        | "diacono"
        | "presidente_sociedade"
        | "gestor_midias"
      escala_funcao:
        | "recepcao"
        | "midias"
        | "diaconia"
        | "liturgia"
        | "ebd"
        | "pregacao"
      notice_category: "public" | "members"
      pastoral_record_type: "visita" | "aconselhamento" | "anotacao"
      request_status: "pendente" | "aprovada" | "rejeitada"
      request_type:
        | "salao_social"
        | "emprestimo_utensilios"
        | "visita"
        | "outra"
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
      app_role: [
        "admin",
        "member",
        "pastor",
        "presbitero",
        "diacono",
        "presidente_sociedade",
        "gestor_midias",
      ],
      escala_funcao: [
        "recepcao",
        "midias",
        "diaconia",
        "liturgia",
        "ebd",
        "pregacao",
      ],
      notice_category: ["public", "members"],
      pastoral_record_type: ["visita", "aconselhamento", "anotacao"],
      request_status: ["pendente", "aprovada", "rejeitada"],
      request_type: [
        "salao_social",
        "emprestimo_utensilios",
        "visita",
        "outra",
      ],
    },
  },
} as const
