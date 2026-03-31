export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ProfileRole = "user" | "developer" | "admin";
export type AgentOwnerType = "platform" | "developer";
export type ExecutionStatus = "pending" | "completed" | "failed";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          user_id: string | null;
          full_name: string | null;
          email: string | null;
          role: ProfileRole;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          full_name?: string | null;
          email?: string | null;
          role?: ProfileRole;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          full_name?: string | null;
          email?: string | null;
          role?: ProfileRole;
          created_at?: string;
        };
        Relationships: [];
      };
      agents: {
        Row: {
          id: string;
          owner_profile_id: string | null;
          owner_type: AgentOwnerType;
          name: string;
          slug: string;
          description: string | null;
          prompt_template: string | null;
          is_active: boolean;
          is_published: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_profile_id?: string | null;
          owner_type: AgentOwnerType;
          name: string;
          slug: string;
          description?: string | null;
          prompt_template?: string | null;
          is_active?: boolean;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_profile_id?: string | null;
          owner_type?: AgentOwnerType;
          name?: string;
          slug?: string;
          description?: string | null;
          prompt_template?: string | null;
          is_active?: boolean;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      agent_executions: {
        Row: {
          id: string;
          profile_id: string;
          agent_id: string;
          input_data: Json;
          output_data: Json | null;
          status: ExecutionStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          agent_id: string;
          input_data?: Json;
          output_data?: Json | null;
          status?: ExecutionStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          agent_id?: string;
          input_data?: Json;
          output_data?: Json | null;
          status?: ExecutionStatus;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      profile_role: ProfileRole;
      agent_owner_type: AgentOwnerType;
      execution_status: ExecutionStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};
