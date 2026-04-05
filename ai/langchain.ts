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
import { OPENAI_QUALITY_MODEL, openai } from "@/lib/openai";
import { hasConfiguredSearchProvider } from "@/ai/lead-sourcing";

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
        model: env.openAiModelQuality,
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

function isLeadSourcingRequest(agent: AgentRunnerInput, input: string) {
  if (agent.slug !== "lead-generation") {
    return false;
  }

  return /(empresa|empresas|company|companies|prospect|prospects|negocio|negocios|lead sourcing|sourcing|nombres reales|nombres de empresas|lista de empresas)/i.test(
    input,
  );
}

function buildRuntimeSystemPrompt(agent: AgentRunnerInput, input: string) {
  const systemPrompt = getPlatformAgentSystemPrompt(agent.slug);

  if (!systemPrompt) {
    return null;
  }

  if (!isLeadSourcingRequest(agent, input)) {
    return systemPrompt;
  }

  return [
    systemPrompt,
    "",
    "Runtime sourcing instructions:",
    "- This request requires real company sourcing, not generic strategy advice.",
    "- You must use multi_query_company_search or web_company_search before answering.",
    "- You should inspect promising pages with web_page_extractor when possible.",
    "- Return the best real companies you actually found, even if the list is incomplete.",
    "- Include a source URL for every company whenever one is available.",
    "- If signal quality varies, include confidence labels such as alta, media, or baja.",
    "- Do not answer with generic suggestions like 'use LinkedIn' or 'check directories' unless the user explicitly asked for strategy instead of sourced companies.",
  ].join("\n");
}

function extractTextFromMessageContent(content: unknown) {
  if (typeof content === "string") {
    return content;
  }

  if (!Array.isArray(content)) {
    return "";
  }

  return content
    .map((block) => {
      if (typeof block === "string") {
        return block;
      }

      if (block && typeof block === "object" && "text" in block && typeof block.text === "string") {
        return block.text;
      }

      return "";
    })
    .join("\n");
}

function getToolEvidence(messages: unknown[]) {
  return messages.flatMap((message) => {
    const toolData = getToolMessageData(message);

    if (!toolData || !message || typeof message !== "object" || !("content" in message)) {
      return [];
    }

    const content = extractTextFromMessageContent(message.content).trim();

    if (!content) {
      return [];
    }

    return [
      {
        toolName: toolData.name,
        content,
      },
    ];
  });
}

function looksLikeGenericSourcingFailure(output: string) {
  const normalized = output.toLowerCase();

  return (
    /(no he podido encontrar|no pude encontrar|lamentablemente|sin embargo, puedo sugerir|puedo sugerir algunas estrategias|cámaras de comercio|directorios locales|linkedin|páginas amarillas)/i.test(
      output,
    ) &&
    !/https?:\/\//i.test(output)
  ) || normalized.length < 400;
}

async function synthesizeSourcingFallback(
  input: string,
  evidence: Array<{ toolName: string; content: string }>,
) {
  const response = await openai.chat.completions.create({
    model: OPENAI_QUALITY_MODEL,
    messages: [
      {
        role: "system",
        content: [
          "You are rewriting a lead sourcing answer using only tool evidence that was already collected.",
          "The user asked for real companies, so do not give generic advice.",
          "Return the best real companies supported by the evidence, even if the list is incomplete.",
          "For each company include source URL when available and a confidence label: alta, media, or baja.",
          "Do not invent companies, URLs, cities, or signals.",
          "Write in the same language as the user's request.",
        ].join("\n"),
      },
      {
        role: "user",
        content: [
          "User request:",
          input,
          "",
          "Tool evidence:",
          ...evidence.map(
            (item, index) =>
              `Evidence ${index + 1} (${item.toolName}):\n${item.content}`,
          ),
        ].join("\n\n"),
      },
    ],
  });

  return response.choices[0]?.message?.content?.trim() ?? "";
}

function buildMissingSearchProviderMessage() {
  return [
    "No puedo hacer sourcing web confiable en este momento porque el proyecto no tiene configurado un proveedor de busqueda para el agente.",
    "",
    "Falta al menos una de estas variables:",
    "- SERPER_API_KEY",
    "- TAVILY_API_KEY",
    "",
    "Sin eso, el agente queda dependiendo de un fallback debil y puede devolver respuestas vacias o poco confiables cuando le pides empresas reales.",
  ].join("\n");
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

  const systemPrompt = buildRuntimeSystemPrompt(agent, input);

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

  let finalOutput = output;

  if (isLeadSourcingRequest(agent, input) && looksLikeGenericSourcingFailure(output)) {
    const evidence = getToolEvidence(latestMessages).filter((item) =>
      [
        "multi_query_company_search",
        "web_company_search",
        "web_page_extractor",
        "company_prospect_scorer",
      ].includes(item.toolName),
    );

    if (evidence.length > 0) {
      await onProgress?.({
        id: "sourcing-recovery",
        kind: "status",
        label: "Reconstruyendo salida con evidencia encontrada",
        status: "running",
      });

      const fallbackOutput = await synthesizeSourcingFallback(input, evidence);

      if (fallbackOutput) {
        finalOutput = fallbackOutput;
      }

      await onProgress?.({
        id: "sourcing-recovery",
        kind: "status",
        label: "Salida reconstruida",
        status: "completed",
      });
    } else if (!hasConfiguredSearchProvider()) {
      finalOutput = buildMissingSearchProviderMessage();
    }
  }

  return {
    output: finalOutput,
    metadata: {
      provider: "langchain",
      model: getOpenAiEnv().openAiModelQuality,
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
