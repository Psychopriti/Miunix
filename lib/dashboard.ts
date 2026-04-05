export type DashboardAgent = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  totalRuns: number;
};

export type DashboardProgressItem = {
  id: string;
  kind: "status" | "tool";
  label: string;
  status: "running" | "completed" | "failed";
};

export type DashboardMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  executionStatus?: "pending" | "completed" | "failed";
  progressItems?: DashboardProgressItem[];
  isStreaming?: boolean;
};

export type DashboardChatHistory = Record<string, DashboardMessage[]>;
