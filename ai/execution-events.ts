export type AgentProgressItemStatus = "running" | "completed" | "failed";

export type AgentProgressEvent = {
  id: string;
  kind: "status" | "tool";
  label: string;
  status: AgentProgressItemStatus;
};

export type AgentProgressReporter = (
  event: AgentProgressEvent,
) => void | Promise<void>;
