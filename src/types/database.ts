export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      dashboard_config: {
        Row: {
          id: string;
          restaurant_name: string;
          drinks_remaining: number;
          current_round: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          restaurant_name?: string;
          drinks_remaining?: number;
          current_round?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          restaurant_name?: string;
          drinks_remaining?: number;
          current_round?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      submissions: {
        Row: {
          id: string;
          full_name: string;
          work_email: string;
          phone_number: string;
          company_name: string;
          flavor_guess: string;
          follow_up_permission: boolean;
          is_winner: boolean;
          submitted_at: string;
        };
        Insert: {
          id?: string;
          full_name: string;
          work_email: string;
          phone_number: string;
          company_name: string;
          flavor_guess: string;
          follow_up_permission: boolean;
          is_winner?: boolean;
          submitted_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          work_email?: string;
          phone_number?: string;
          company_name?: string;
          flavor_guess?: string;
          follow_up_permission?: boolean;
          is_winner?: boolean;
          submitted_at?: string;
        };
        Relationships: [];
      };
      winners: {
        Row: {
          id: string;
          submission_id: string;
          winner_name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          submission_id: string;
          winner_name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          submission_id?: string;
          winner_name?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'winners_submission_id_fkey';
            columns: ['submission_id'];
            isOneToOne: false;
            referencedRelation: 'submissions';
            referencedColumns: ['id'];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

export type DashboardConfig = Database['public']['Tables']['dashboard_config']['Row'];
export type Submission = Database['public']['Tables']['submissions']['Row'];
export type Winner = Database['public']['Tables']['winners']['Row'];
