import { createAgent } from "langchain";
import type { AIMessage } from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";

import type { AgentProgressReporter } from "@/ai/execution-events";
import { getAgentTools } from "@/ai/tools";
import {
  getPlatformAgentSystemPrompt,
  isPlatformAgentWithBuiltInPrompt,
} from "@/ai/prompts";
import type { AgentRunnerInput } from "@/ai/agent-runner";
import { getOpenAiEnv } from "@/lib/env/server";

type LangChainRunResult = {
  output: string;
  metadata: {
    provider: "langchain";
    model: string;
    toolsAvailable: string[];
    toolsUsed: string[];
  };
};

type LangChainChunk = {
  messages?: unknown[];
};

let sharedChatModelPromise: Promise<ChatOpenAI> | undefined;

async function getSharedChatModel() {
  if (!sharedChatModelPromise) {
    const env = getOpenAiEnv();

    sharedChatModelPromise = Promise.resolve(
      new ChatOpenAI({
        model: env.openAiModelDefault,
        apiKey: env.openAiApiKey,
        temperature: 0.2,
      }),
    );
  }

  return sharedChatModelPromise;
}

function createLangChainAgent(agent: AgentRunnerInput, systemPrompt: string) {
  return getSharedChatModel().then((model) =>
    createAgent({
      model,
      tools: getAgentTools(agent.slug),
      systemPrompt,
    }),
  );
}

function normalizeLangChainContent(content: AIMessage["content"]) {
  if (typeof content === "string") {
    return content.trim();
  }

  if (!Array.isArray(content)) {
    return "";
  }

  return content
    .map((block) => {
      if (typeof block === "string") {
        return block;
      }

      if ("text" in block && typeof block.text === "string") {
        return block.text;
      }

      return "";
    })
    .join("\n")
    .trim();
}

function getToolNamesFromMessages(messages: unknown[]) {
  return messages.flatMap((message) => {
    if (
      !message ||
      typeof message !== "object" ||
      !("tool_calls" in message) ||
      !Array.isArray(message.tool_calls)
    ) {
      return [];
    }

    return message.tool_calls.flatMap((toolCall) => {
      if (
        !toolCall ||
        typeof toolCall !== "object" ||
        !("name" in toolCall) ||
        typeof toolCall.name !== "string"
      ) {
        return [];
      }

      return [toolCall.name];
    });
  });
}

function getLastAssistantContent(messages: unknown[]) {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];

    if (
      !message ||
      typeof message !== "object" ||
      !("content" in message) ||
      !("getType" in message) ||
      typeof message.getType !== "function"
    ) {
      continue;
    }

    if (message.getType() !== "ai") {
      continue;
    }

    return normalizeLangChainContent(message.content as AIMessage["content"]);
  }

  return "";
}

function getMessageType(message: unknown) {
  if (
    !message ||
    typeof message !== "object" ||
    !("getType" in message) ||
    typeof message.getType !== "function"
  ) {
    return null;
  }

  const type = message.getType();
  return typeof type === "string" ? type : null;
}

function getToolCalls(message: unknown) {
  if (
    !message ||
    typeof message !== "object" ||
    !("tool_calls" in message) ||
    !Array.isArray(message.tool_calls)
  ) {
    return [];
  }

  return message.tool_calls.flatMap((toolCall) => {
    if (
      !toolCall ||
      typeof toolCall !== "object" ||
      !("name" in toolCall) ||
      typeof toolCall.name !== "string"
    ) {
      return [];
    }

    return [
      {
        id:
          "id" in toolCall && typeof toolCall.id === "string"
            ? toolCall.id
            : toolCall.name,
        name: toolCall.name,
      },
    ];
  });
}

function getToolMessageData(message: unknown) {
  if (getMessageType(message) !== "tool" || !message || typeof message !== "object") {
    return null;
  }

  const toolCallId =
    "tool_call_id" in message && typeof message.tool_call_id === "string"
      ? message.tool_call_id
      : null;
  const name = "name" in message && typeof message.name === "string"
    ? message.name
    : toolCallId ?? "tool";

  return {
    id: toolCallId ?? name,
    name,
  };
}

function formatToolLabel(toolName: string) {
  return toolName
    .split(/[_-]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function canRunWithLangChain(agent: AgentRunnerInput) {
  return (
    agent.owner_type === "platform" && isPlatformAgentWithBuiltInPrompt(agent.slug)
  );
}

export async function runAgentWithLangChainStream(
  agent: AgentRunnerInput,
  input: string,
  onProgress?: AgentProgressReporter,
): Promise<LangChainRunResult> {
  if (!canRunWithLangChain(agent)) {
    throw new Error("This agent is not configured for LangChain execution.");
  }

  const systemPrompt = getPlatformAgentSystemPrompt(agent.slug);

  if (!systemPrompt) {
    throw new Error("Missing system prompt for LangChain agent.");
  }

  await onProgress?.({
    id: "analyzing-request",
    kind: "status",
    label: "Analizando la solicitud",
    status: "running",
  });

  const langChainAgent = await createLangChainAgent(agent, systemPrompt);
  const tools = getAgentTools(agent.slug);
  const toolsUsed = new Set<string>();
  const startedToolIds = new Set<string>();
  const completedToolIds = new Set<string>();
  let latestMessages: unknown[] = [];
  let finalDraftStarted = false;

  const stream = await langChainAgent.stream(
    {
      messages: [
        {
          role: "user",
          content: input,
        },
      ],
    },
    {
      streamMode: "values",
    },
  );

  for await (const chunk of stream as AsyncIterable<LangChainChunk>) {
    const messages = Array.isArray(chunk.messages) ? chunk.messages : null;

    if (!messages) {
      continue;
    }

    latestMessages = messages;

    for (const message of messages) {
      if (getMessageType(message) === "ai") {
        const toolCalls = getToolCalls(message);

        if (toolCalls.length > 0) {
          await onProgress?.({
            id: "analyzing-request",
            kind: "status",
            label: "Analisis completado",
            status: "completed",
          });

          for (const toolCall of toolCalls) {
            toolsUsed.add(toolCall.name);

            if (startedToolIds.has(toolCall.id)) {
              continue;
            }

            startedToolIds.add(toolCall.id);
            await onProgress?.({
              id: `tool-${toolCall.id}`,
              kind: "tool",
              label: `Ejecutando ${formatToolLabel(toolCall.name)}`,
              status: "running",
            });
          }
        } else {
          const content = normalizeLangChainContent(
            "content" in (message as object)
              ? (message as AIMessage).content
              : "",
          );

          if (content && !finalDraftStarted) {
            finalDraftStarted = true;
            await onProgress?.({
              id: "drafting-response",
              kind: "status",
              label: "Redactando respuesta final",
              status: "running",
            });
          }
        }
      }

      const toolMessage = getToolMessageData(message);

      if (!toolMessage || completedToolIds.has(toolMessage.id)) {
        continue;
      }

      completedToolIds.add(toolMessage.id);
      await onProgress?.({
        id: `tool-${toolMessage.id}`,
        kind: "tool",
        label: `${formatToolLabel(toolMessage.name)} completado`,
        status: "completed",
      });
    }
  }

  const output = getLastAssistantContent(latestMessages);

  if (!output) {
    throw new Error("The agent returned an empty response.");
  }

  if (!finalDraftStarted) {
    await onProgress?.({
      id: "drafting-response",
      kind: "status",
      label: "Redactando respuesta final",
      status: "running",
    });
  }

  await onProgress?.({
    id: "drafting-response",
    kind: "status",
    label: "Respuesta final lista",
    status: "completed",
  });

  return {
    output,
    metadata: {
      provider: "langchain",
      model: getOpenAiEnv().openAiModelDefault,
      toolsAvailable: tools.map((tool) => tool.name),
      toolsUsed: Array.from(toolsUsed.size > 0 ? toolsUsed : new Set(getToolNamesFromMessages(latestMessages))),
    },
  };
}

export async function runAgentWithLangChain(
  agent: AgentRunnerInput,
  input: string,
): Promise<LangChainRunResult> {
  return runAgentWithLangChainStream(agent, input);
}
