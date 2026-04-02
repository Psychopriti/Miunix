export type OpenAIModelId =
  | "gpt-5"
  | "gpt-5-mini"
  | "gpt-4o-mini"
  | "gpt-4.1"
  | "gpt-4.1-mini";

export type ChatMessageRole = "system" | "user" | "assistant" | "tool";

export type ChatMessage = {
  id: string;
  role: ChatMessageRole;
  content: string;
  createdAt: string;
};
