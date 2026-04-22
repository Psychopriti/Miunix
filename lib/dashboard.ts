import type { Json } from "@/types/database";

export type DashboardAgent = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  totalRuns: number;
  ownerType: "platform" | "developer" | "user";
  ownerLabel: string;
  toolDefinitions: Json;
};

export type DashboardAccount = {
  profileName: string;
  email: string | null;
  role: "user" | "developer" | "admin";
  isPremium: boolean;
  premiumPlanName: string | null;
  premiumAgentLimit: number;
  premiumSince: string | null;
  privateAgentCount: number;
  purchasedAgentCount: number;
  purchasedWorkflowCount: number;
  totalPromptRuns: number;
  activeAgentCount: number;
};

export type DashboardWorkflow = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  deliverable: string;
  includedAgents: {
    slug: string;
    name: string;
  }[];
  steps: {
    id: string;
    position: number;
    title: string;
    stepKey: string;
    agentSlug: string;
  }[];
};

export type DashboardConversation = {
  id: string;
  agentId: string;
  agentSlug: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string;
};

export type DashboardProgressItem = {
  id: string;
  kind: "status" | "tool";
  label: string;
  status: "running" | "completed" | "failed";
};

export type DashboardMessage = {
  id: string;
  conversationId: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  executionStatus?: "pending" | "completed" | "failed";
  progressItems?: DashboardProgressItem[];
  isStreaming?: boolean;
};

export type DashboardChatHistory = Record<string, DashboardMessage[]>;

export type DashboardWorkflowExecution = {
  id: string;
  workflowId: string;
  workflowSlug: string;
  workflowName: string;
  status: "pending" | "running" | "completed" | "failed";
  startedAt: string;
  completedAt: string | null;
  finalOutputText: string;
  stepRuns: {
    id: string;
    stepKey: string;
    title: string;
    agentSlug: string;
    status: "pending" | "running" | "completed" | "failed" | "skipped";
    outputText: string;
  }[];
};
