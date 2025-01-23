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
      labels: {
        Row: {
          color: string | null
          created_at: string
          id: number
          label_type: string | null
          mail_account_id: number
          name: string
          provider_label_id: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: number
          label_type?: string | null
          mail_account_id: number
          name: string
          provider_label_id: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: number
          label_type?: string | null
          mail_account_id?: number
          name?: string
          provider_label_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "labels_mail_account_id_fkey"
            columns: ["mail_account_id"]
            isOneToOne: false
            referencedRelation: "mail_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      mail_accounts: {
        Row: {
          access_token: string | null
          created_at: string
          email_address: string
          history_id: string | null
          id: number
          provider: string
          refresh_token: string | null
          token_expires_at: string | null
          updated_at: string
          user_id: number
          watch_expiration: string | null
        }
        Insert: {
          access_token?: string | null
          created_at?: string
          email_address: string
          history_id?: string | null
          id?: number
          provider: string
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id: number
          watch_expiration?: string | null
        }
        Update: {
          access_token?: string | null
          created_at?: string
          email_address?: string
          history_id?: string | null
          id?: number
          provider?: string
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id?: number
          watch_expiration?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mail_accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      message_labels: {
        Row: {
          label_id: number
          message_id: number
        }
        Insert: {
          label_id: number
          message_id: number
        }
        Update: {
          label_id?: number
          message_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "message_labels_label_id_fkey"
            columns: ["label_id"]
            isOneToOne: false
            referencedRelation: "labels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_labels_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          bcc: string | null
          body: string | null
          cc: string | null
          created_at: string
          id: number
          is_read: boolean | null
          provider_message_id: string
          recipients: string | null
          sender: string | null
          sent_at: string | null
          thread_id: number
          updated_at: string
        }
        Insert: {
          bcc?: string | null
          body?: string | null
          cc?: string | null
          created_at?: string
          id?: number
          is_read?: boolean | null
          provider_message_id: string
          recipients?: string | null
          sender?: string | null
          sent_at?: string | null
          thread_id: number
          updated_at?: string
        }
        Update: {
          bcc?: string | null
          body?: string | null
          cc?: string | null
          created_at?: string
          id?: number
          is_read?: boolean | null
          provider_message_id?: string
          recipients?: string | null
          sender?: string | null
          sent_at?: string | null
          thread_id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "threads"
            referencedColumns: ["id"]
          },
        ]
      }
      threads: {
        Row: {
          created_at: string
          id: number
          is_archived: boolean | null
          is_deleted: boolean | null
          mail_account_id: number
          provider_thread_id: string
          snippet: string | null
          subject: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: number
          is_archived?: boolean | null
          is_deleted?: boolean | null
          mail_account_id: number
          provider_thread_id: string
          snippet?: string | null
          subject?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: number
          is_archived?: boolean | null
          is_deleted?: boolean | null
          mail_account_id?: number
          provider_thread_id?: string
          snippet?: string | null
          subject?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "threads_mail_account_id_fkey"
            columns: ["mail_account_id"]
            isOneToOne: false
            referencedRelation: "mail_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          email: string | null
          id: number
          name: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: number
          name?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: number
          name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
