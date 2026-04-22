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

function isMarketingEvidenceRequest(agent: AgentRunnerInput, input: string) {
  if (agent.slug !== "marketing-content") {
    return false;
  }

  return /(competidor|competitors?|landing page|pagina|p[aá]gina|sitio web|website|homepage|copy actual|copy de|brand|marca|empresa|ads?|anuncio|funnel|mensajes?)/i.test(
    input,
  );
}

function isMarketingImageRequest(agent: AgentRunnerInput, input: string) {
  if (agent.slug !== "marketing-content") {
    return false;
  }

  return /(imagen|imagenes|image|visual|grafica|gr[aá]fica|banner|thumbnail|miniatura|creativ[oa]|ad visual|anuncio visual|meta ads|facebook ads|instagram ads)/i.test(
    input,
  );
}

function isResearchEvidenceRequest(agent: AgentRunnerInput, input: string) {
  if (agent.slug !== "research") {
    return false;
  }

  return /(competidor|competitors?|mercado|market|pricing|posicionamiento|positioning|empresa|companies|actual|202[0-9]|tendencia|trend|landscape|segmento|nicho|web|website|sitio|p[aá]gina)/i.test(
    input,
  );
}

function isNamedCompetitorComparison(input: string) {
  return /(hubspot|pipedrive|zoho|salesforce|competidor|competitors?|vs\.?|versus|compare|compara|posicionamiento)/i.test(
    input,
  );
}

function buildRuntimeSystemPrompt(agent: AgentRunnerInput, input: string) {
  const systemPrompt = getPlatformAgentSystemPrompt(agent.slug);

  if (!systemPrompt) {
    return null;
  }

  if (isLeadSourcingRequest(agent, input)) {
    return [
      systemPrompt,
      "",
      "Runtime sourcing instructions:",
      "- This request requires real company sourcing, not generic strategy advice.",
      "- You must use multi_query_company_search or web_company_search before answering.",
      "- You should inspect promising pages with web_page_extractor when possible.",
      "- You must use company_prospect_scorer before the final answer when comparing multiple sourced companies.",
      "- Use qualification_scorecard when judging ICP quality or segment fit.",
      "- Use outbound_sequence_builder when the user asks for outreach, sales activation, or follow-up sequence.",
      "- Exclude any company marked or inferred as adjacent_or_competitor unless the user explicitly asked for vendors, software, or competitors.",
      "- Bias your searches toward operational service businesses, not CRM vendors, WhatsApp tools, agencies, or automation providers.",
      "- Return the best real companies you actually found, even if the list is incomplete.",
      "- Include a source URL for every company whenever one is available.",
      "- If signal quality varies, include confidence labels such as alta, media, or baja.",
      "- Do not answer with generic suggestions like 'use LinkedIn' or 'check directories' unless the user explicitly asked for strategy instead of sourced companies.",
    ].join("\n");
  }

  if (isMarketingEvidenceRequest(agent, input)) {
    const competitorInstruction = isNamedCompetitorComparison(input)
      ? [
          "- This prompt names specific competitors or comparison targets.",
          "- You must inspect at least one official page for each named company before making comparison claims.",
          "- Do not compare named competitors from memory alone.",
        ]
      : [];

    return [
      systemPrompt,
      "",
      "Runtime marketing instructions:",
      "- If the request references a real company, page, competitor, existing copy, or market context, inspect evidence before writing whenever possible.",
      "- Use web_company_search or multi_query_company_search to locate the relevant company or competitor pages when the user did not provide a URL.",
      "- Use web_page_extractor to inspect landing pages, product pages, or competitor pages when those pages will improve the messaging.",
      ...competitorInstruction,
      "- Use messaging_evidence_extractor to separate observed claims, proof, and CTA signals from your own interpretation.",
      "- Use competitive_gap_analyzer when the task involves differentiation, white-space, or competitor comparison.",
      "- Use offer_outcome_mapper when the offer needs sharper translation from features into buyer outcomes.",
      "- Use brand_voice_calibrator when tone, trust, buyer sophistication, or brand perception matters.",
      "- Use creative_testing_matrix when the task involves campaigns, ads, launches, or performance testing.",
      "- Use visual_asset_creator when the user asks for images, ad visuals, banners, thumbnails, campaign graphics, or image prompts.",
      "- The final answer must stay in the user's language even if the source pages are in another language.",
      "- Do not rely on generic copy instincts if concrete market or page evidence is available.",
    ].join("\n");
  }

  if (isResearchEvidenceRequest(agent, input)) {
    const competitorInstruction = isNamedCompetitorComparison(input)
      ? [
          "- This prompt names specific competitors or comparison targets.",
          "- You must inspect at least one official page for each named company before comparing them.",
          "- Do not compare named competitors from memory alone.",
        ]
      : [];

    return [
      systemPrompt,
      "",
      "Runtime research instructions:",
      "- This request likely benefits from current market evidence or real company context.",
      "- Use research_framework_selector early if the research frame is broad or ambiguous.",
      "- Use web_company_search or multi_query_company_search to locate relevant companies, competitors, or market pages when current evidence matters.",
      "- Use web_page_extractor to inspect official pages, pricing pages, or positioning pages before making strategic claims.",
      ...competitorInstruction,
      "- Use messaging_evidence_extractor to distinguish observed market signals from your own inference.",
      "- Use decision_matrix_builder when the user is comparing options and you need a clearer ranking.",
      "- Use competitive_gap_analyzer when competitor positioning or strategic white space is part of the question.",
      "- Use research_document_builder when the user asks for a doc, report, memo, markdown document, or shareable research brief.",
      "- Use evidence_confidence_ladder when claims have uneven evidence quality or the recommendation depends on uncertain signals.",
      "- Use assumption_risk_mapper when assumptions, risk, validation, or strategic uncertainty matter.",
      "- The final answer must stay in the user's language even if the evidence comes from English-language pages.",
      "- Do not answer as a generic memo if direct evidence can materially improve the recommendation.",
    ].join("\n");
  }

  return systemPrompt;
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

function extractVisualAssetPrompt(evidence: Array<{ toolName: string; content: string }>) {
  const visualAssetEvidence = evidence
    .filter((item) => item.toolName === "visual_asset_creator")
    .map((item) => item.content)
    .at(-1);

  if (!visualAssetEvidence) {
    return null;
  }

  try {
    const parsed = JSON.parse(visualAssetEvidence) as {
      productionPrompt?: unknown;
    };

    return typeof parsed.productionPrompt === "string"
      ? parsed.productionPrompt
      : null;
  } catch {
    const match = visualAssetEvidence.match(/"productionPrompt"\s*:\s*"([^"]+)"/);
    return match?.[1]?.replace(/\\"/g, "\"") ?? null;
  }
}

async function generateMarketingImageAttachment({
  input,
  evidence,
  onProgress,
}: {
  input: string;
  evidence: Array<{ toolName: string; content: string }>;
  onProgress?: AgentProgressReporter;
}) {
  const prompt =
    extractVisualAssetPrompt(evidence) ??
    [
      "Create a polished marketing image for this campaign request:",
      input,
      "Use a clean composition, credible commercial style, strong focal point, realistic lighting, and enough negative space for ad copy.",
      "Avoid fake logos, unreadable text, exaggerated claims, and cluttered UI fragments.",
    ].join(" ");

  await onProgress?.({
    id: "image-generation",
    kind: "tool",
    label: "Generando imagen de marketing",
    status: "running",
  });

  const imageResponse = await openai.images.generate({
    model: "gpt-image-1.5",
    prompt,
    size: "1024x1024",
    quality: "medium",
    output_format: "png",
    n: 1,
  });
  const imageData = imageResponse.data?.[0]?.b64_json;

  await onProgress?.({
    id: "image-generation",
    kind: "tool",
    label: imageData ? "Imagen de marketing generada" : "No se recibio imagen",
    status: imageData ? "completed" : "failed",
  });

  return imageData
    ? {
        prompt,
        dataUrl: `data:image/png;base64,${imageData}`,
      }
    : null;
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
  const toolEvidence = getToolEvidence(latestMessages);

  if (isLeadSourcingRequest(agent, input) && looksLikeGenericSourcingFailure(output)) {
    const evidence = toolEvidence.filter((item) =>
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

  if (isMarketingImageRequest(agent, input)) {
    try {
      const generatedImage = await generateMarketingImageAttachment({
        input,
        evidence: toolEvidence,
        onProgress,
      });

      if (generatedImage) {
        finalOutput = [
          finalOutput,
          "",
          "Imagen generada",
          generatedImage.dataUrl,
          "",
          "**Prompt usado:**",
          generatedImage.prompt,
        ].join("\n");
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudo generar la imagen.";

      finalOutput = [
        finalOutput,
        "",
        "Imagen generada",
        `No pude generar la imagen por ahora: ${message}`,
      ].join("\n");

      await onProgress?.({
        id: "image-generation",
        kind: "tool",
        label: "La generacion de imagen fallo",
        status: "failed",
      });
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
