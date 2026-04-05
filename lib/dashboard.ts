export type DashboardAgent = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  totalRuns: number;
};

export type DashboardMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  executionStatus?: "pending" | "completed" | "failed";
};

export type DashboardChatHistory = Record<string, DashboardMessage[]>;
