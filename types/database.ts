export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ProfileRole = "user" | "developer" | "admin";
export type AgentOwnerType = "platform" | "developer";
export type AgentStatus = "draft" | "published" | "archived";
export type AgentPricingType = "free" | "one_time";
export type ExecutionStatus = "pending" | "completed" | "failed";
export type PaymentStatus =
  | "pending"
  | "completed"
  | "failed"
  | "refunded";

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
          short_description: string | null;
          prompt_template: string | null;
          is_active: boolean;
          is_published: boolean;
          status: AgentStatus;
          price: string;
          currency: string;
          pricing_type: AgentPricingType;
          published_at: string | null;
          cover_image_url: string | null;
          average_rating: string;
          total_reviews: number;
          total_runs: number;
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
          short_description?: string | null;
          prompt_template?: string | null;
          is_active?: boolean;
          is_published?: boolean;
          status?: AgentStatus;
          price?: string;
          currency?: string;
          pricing_type?: AgentPricingType;
          published_at?: string | null;
          cover_image_url?: string | null;
          average_rating?: string;
          total_reviews?: number;
          total_runs?: number;
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
          short_description?: string | null;
          prompt_template?: string | null;
          is_active?: boolean;
          is_published?: boolean;
          status?: AgentStatus;
          price?: string;
          currency?: string;
          pricing_type?: AgentPricingType;
          published_at?: string | null;
          cover_image_url?: string | null;
          average_rating?: string;
          total_reviews?: number;
          total_runs?: number;
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
          conversation_id: string | null;
          input_data: Json;
          output_data: Json | null;
          status: ExecutionStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          agent_id: string;
          conversation_id?: string | null;
          input_data?: Json;
          output_data?: Json | null;
          status?: ExecutionStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          agent_id?: string;
          conversation_id?: string | null;
          input_data?: Json;
          output_data?: Json | null;
          status?: ExecutionStatus;
          created_at?: string;
        };
        Relationships: [];
      };
      agent_conversations: {
        Row: {
          id: string;
          profile_id: string;
          agent_id: string;
          title: string;
          last_message_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          agent_id: string;
          title?: string;
          last_message_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          agent_id?: string;
          title?: string;
          last_message_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      agent_purchases: {
        Row: {
          id: string;
          buyer_profile_id: string;
          agent_id: string;
          purchase_price: string;
          currency: string;
          payment_status: PaymentStatus;
          purchased_at: string;
        };
        Insert: {
          id?: string;
          buyer_profile_id: string;
          agent_id: string;
          purchase_price: string;
          currency?: string;
          payment_status?: PaymentStatus;
          purchased_at?: string;
        };
        Update: {
          id?: string;
          buyer_profile_id?: string;
          agent_id?: string;
          purchase_price?: string;
          currency?: string;
          payment_status?: PaymentStatus;
          purchased_at?: string;
        };
        Relationships: [];
      };
      agent_reviews: {
        Row: {
          id: string;
          profile_id: string;
          agent_id: string;
          rating: number;
          review_text: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          agent_id: string;
          rating: number;
          review_text?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          agent_id?: string;
          rating?: number;
          review_text?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      profile_role: ProfileRole;
      agent_owner_type: AgentOwnerType;
      agent_status: AgentStatus;
      agent_pricing_type: AgentPricingType;
      execution_status: ExecutionStatus;
      payment_status: PaymentStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};
