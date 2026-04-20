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
export type WorkflowOwnerType = "platform" | "developer";
export type WorkflowStatus = "draft" | "published" | "archived";
export type WorkflowPricingType = "free" | "one_time" | "subscription";
export type WorkflowExecutionStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed";
export type WorkflowStepRunStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "skipped";
export type AgentReviewStatus =
  | "draft"
  | "ready_for_review"
  | "in_review"
  | "changes_requested"
  | "approved";
export type AgentTestRunStatus = "not_run" | "passed" | "failed";
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
          model: string;
          tool_definitions: Json;
          is_active: boolean;
          is_published: boolean;
          status: AgentStatus;
          review_status: AgentReviewStatus;
          validation_report: Json;
          last_test_run_status: AgentTestRunStatus;
          last_test_run_at: string | null;
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
          model?: string;
          tool_definitions?: Json;
          is_active?: boolean;
          is_published?: boolean;
          status?: AgentStatus;
          review_status?: AgentReviewStatus;
          validation_report?: Json;
          last_test_run_status?: AgentTestRunStatus;
          last_test_run_at?: string | null;
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
          model?: string;
          tool_definitions?: Json;
          is_active?: boolean;
          is_published?: boolean;
          status?: AgentStatus;
          review_status?: AgentReviewStatus;
          validation_report?: Json;
          last_test_run_status?: AgentTestRunStatus;
          last_test_run_at?: string | null;
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
      workflows: {
        Row: {
          id: string;
          slug: string;
          name: string;
          short_description: string | null;
          description: string | null;
          owner_type: WorkflowOwnerType;
          owner_profile_id: string | null;
          price: string;
          currency: string;
          pricing_type: WorkflowPricingType;
          is_active: boolean;
          is_published: boolean;
          status: WorkflowStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          short_description?: string | null;
          description?: string | null;
          owner_type: WorkflowOwnerType;
          owner_profile_id?: string | null;
          price?: string;
          currency?: string;
          pricing_type?: WorkflowPricingType;
          is_active?: boolean;
          is_published?: boolean;
          status?: WorkflowStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          short_description?: string | null;
          description?: string | null;
          owner_type?: WorkflowOwnerType;
          owner_profile_id?: string | null;
          price?: string;
          currency?: string;
          pricing_type?: WorkflowPricingType;
          is_active?: boolean;
          is_published?: boolean;
          status?: WorkflowStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      workflow_steps: {
        Row: {
          id: string;
          workflow_id: string;
          position: number;
          agent_slug: string;
          step_key: string;
          title: string;
          input_mapping: Json;
          output_mapping: Json;
          is_required: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          workflow_id: string;
          position: number;
          agent_slug: string;
          step_key: string;
          title: string;
          input_mapping?: Json;
          output_mapping?: Json;
          is_required?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          workflow_id?: string;
          position?: number;
          agent_slug?: string;
          step_key?: string;
          title?: string;
          input_mapping?: Json;
          output_mapping?: Json;
          is_required?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      workflow_purchases: {
        Row: {
          id: string;
          buyer_profile_id: string;
          workflow_id: string;
          purchase_price: string;
          currency: string;
          payment_status: PaymentStatus;
          purchased_at: string;
        };
        Insert: {
          id?: string;
          buyer_profile_id: string;
          workflow_id: string;
          purchase_price: string;
          currency?: string;
          payment_status?: PaymentStatus;
          purchased_at?: string;
        };
        Update: {
          id?: string;
          buyer_profile_id?: string;
          workflow_id?: string;
          purchase_price?: string;
          currency?: string;
          payment_status?: PaymentStatus;
          purchased_at?: string;
        };
        Relationships: [];
      };
      workflow_executions: {
        Row: {
          id: string;
          workflow_id: string;
          profile_id: string;
          status: WorkflowExecutionStatus;
          input_data: Json;
          shared_context: Json;
          final_output: Json | null;
          started_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          workflow_id: string;
          profile_id: string;
          status?: WorkflowExecutionStatus;
          input_data?: Json;
          shared_context?: Json;
          final_output?: Json | null;
          started_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          workflow_id?: string;
          profile_id?: string;
          status?: WorkflowExecutionStatus;
          input_data?: Json;
          shared_context?: Json;
          final_output?: Json | null;
          started_at?: string;
          completed_at?: string | null;
        };
        Relationships: [];
      };
      workflow_step_runs: {
        Row: {
          id: string;
          workflow_execution_id: string;
          workflow_step_id: string;
          agent_id: string | null;
          status: WorkflowStepRunStatus;
          input_data: Json;
          output_data: Json | null;
          started_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          workflow_execution_id: string;
          workflow_step_id: string;
          agent_id?: string | null;
          status?: WorkflowStepRunStatus;
          input_data?: Json;
          output_data?: Json | null;
          started_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          workflow_execution_id?: string;
          workflow_step_id?: string;
          agent_id?: string | null;
          status?: WorkflowStepRunStatus;
          input_data?: Json;
          output_data?: Json | null;
          started_at?: string;
          completed_at?: string | null;
        };
        Relationships: [];
      };
      agent_tool_secrets: {
        Row: {
          id: string;
          agent_id: string;
          tool_name: string;
          secret_key: string;
          encrypted_value: string;
          masked_value: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          agent_id: string;
          tool_name: string;
          secret_key?: string;
          encrypted_value: string;
          masked_value: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          agent_id?: string;
          tool_name?: string;
          secret_key?: string;
          encrypted_value?: string;
          masked_value?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      agent_test_runs: {
        Row: {
          id: string;
          agent_id: string;
          profile_id: string;
          status: Exclude<AgentTestRunStatus, "not_run">;
          input_data: Json;
          output_data: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          agent_id: string;
          profile_id: string;
          status?: Exclude<AgentTestRunStatus, "not_run">;
          input_data?: Json;
          output_data?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          agent_id?: string;
          profile_id?: string;
          status?: Exclude<AgentTestRunStatus, "not_run">;
          input_data?: Json;
          output_data?: Json | null;
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
      agent_status: AgentStatus;
      agent_pricing_type: AgentPricingType;
      execution_status: ExecutionStatus;
      workflow_owner_type: WorkflowOwnerType;
      workflow_status: WorkflowStatus;
      workflow_pricing_type: WorkflowPricingType;
      workflow_execution_status: WorkflowExecutionStatus;
      workflow_step_run_status: WorkflowStepRunStatus;
      agent_review_status: AgentReviewStatus;
      agent_test_run_status: AgentTestRunStatus;
      payment_status: PaymentStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};
