import type { AgentProgressReporter } from "@/ai/execution-events";
import { ensureConversationForExecution, updateConversationMetadata } from "@/ai/agent-conversations";
import { runAgentWithLangChain, runAgentWithLangChainStream, canRunWithLangChain } from "@/ai/langchain";
import { getPlatformAgentPrompt } from "@/ai/prompts";
import { getPlatformAgentSystemPrompt } from "@/ai/prompts";
import { listToolSecretsForAgent } from "@/lib/dev-center";
import { parseToolDefinitions } from "@/lib/dev-tools";
import { OPENAI_DEFAULT_MODEL, OPENAI_QUALITY_MODEL, openai } from "@/lib/openai";
import { supabaseAdmin } from "@/lib/supabase";
import { decryptSecretValue } from "@/lib/tool-secrets";

import type { Database } from "@/types/database";
import type { Json } from "@/types/database";

type AgentRow = Database["public"]["Tables"]["agents"]["Row"];
type AgentExecutionRow =
  Database["public"]["Tables"]["agent_executions"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export type AgentListItem = Pick<
  AgentRow,
  | "id"
  | "name"
  | "slug"
  | "description"
  | "short_description"
  | "pricing_type"
  | "price"
  | "currency"
  | "average_rating"
  | "total_reviews"
  | "total_runs"
  | "cover_image_url"
> & {
  ownerLabel: string;
};

export type AgentRunnerInput = Pick<
  AgentRow,
  | "id"
  | "slug"
  | "name"
  | "owner_type"
  | "owner_profile_id"
  | "prompt_template"
  | "model"
  | "tool_definitions"
  | "is_active"
  | "is_published"
  | "status"
  | "total_runs"
>;

export type ExecuteAgentInput = {
  profileId: string;
  agentId?: string;
  agentSlug?: string;
  conversationId?: string;
  input: string;
};

type ExecuteAgentWithProgressInput = ExecuteAgentInput & {
  onProgress?: AgentProgressReporter;
};

export type ExecuteAgentResult = {
  agent: AgentRow;
  execution: AgentExecutionRow;
  conversationId: string;
  output: string;
  metadata?: Record<string, Json>;
};

export type ExecutionHistoryItem = {
  id: string;
  conversationId: string | null;
  agentId: string;
  agentSlug: string;
  agentName: string;
  createdAt: string;
  status: AgentExecutionRow["status"];
  input: string;
  output: string | null;
};

export class AgentExecutionError extends Error {
  constructor(
    message: string,
    public readonly statusCode = 500,
  ) {
    super(message);
    this.name = "AgentExecutionError";
  }
}

const builtInAgentOutputExpectations: Partial<Record<string, string[]>> = {
  "marketing-content": [
    "1. Strategic Direction",
    "2. Core Campaign Concept",
    "5. Primary Marketing Copy",
    "8. Optimization Notes",
  ],
  research: [
    "1. Research Scope",
    "2. Executive Summary",
    "6. Strategic Recommendation",
    "7. Next Questions to Investigate",
  ],
};

const builtInAgentRewriteRubric: Partial<Record<string, string[]>> = {
  "lead-generation": [
    "Answer the user's actual task instead of forcing a preset lead-generation template.",
    "If the user did not request a format, choose the simplest structure that makes the answer clear and useful.",
    "Choose segments, pains, and buyers that are concrete and reachable, not broad abstractions.",
    "Translate AI or automation into operational outcomes, not generic efficiency claims.",
    "If you include outreach, make it credible, channel-aware, and specific to the workflow pain.",
    "Avoid generic pain points or recommendations that could fit almost any business.",
    "If you sourced real companies, include a source URL for each company whenever one was found.",
    "If sourcing results are partial, return the best real companies found with confidence notes instead of retreating into generic advice.",
    "Prefer operational buyer candidates over competitors, agencies, CRM vendors, chatbot vendors, or automation providers.",
    "When sourcing companies, clearly separate observed signals from inferred pains and lower confidence for directory-like sources.",
  ],
  "marketing-content": [
    "Make the strategy and copy feel tailored to the specific offer, buyer, and channel instead of sounding generic.",
    "Sharpen the positioning before writing louder copy; do not hide weak strategy behind polished language.",
    "Translate AI, automation, or software features into concrete workflow or business outcomes.",
    "Make headlines and hooks meaningfully different in angle, not cosmetic rewrites of the same idea.",
    "Keep proof, objections, tone, and CTA aligned to the buyer's stage of awareness and commitment.",
    "Avoid hype, invented claims, vague empowerment language, and interchangeable startup copy.",
    "Make the final copy usable by a real founder or marketer without major rewriting.",
  ],
  research: [
    "Turn the topic into a decision-ready analysis instead of a generic summary.",
    "Prioritize the insights, tradeoffs, and risks that most affect what the user should do next.",
    "Clearly separate observed evidence from informed inference and recommendation.",
    "If the user is comparing options, make the ranking and tradeoffs explicit instead of leaving them implied.",
    "Avoid encyclopedic trend lists, vague caveats, and conclusions that are not earned by the analysis.",
    "Translate AI, automation, or software themes into concrete business, workflow, or adoption implications when relevant.",
    "Make the recommendation specific enough that a founder or operator could act on it immediately.",
  ],
};

async function findProfile(profileId: string) {
  const result = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("id", profileId)
    .maybeSingle();

  if (result.error) {
    throw new AgentExecutionError(result.error.message, 500);
  }

  return result.data;
}

async function findPurchasedAgentIds(profileId: string) {
  const result = await supabaseAdmin
    .from("agent_purchases")
    .select("agent_id")
    .eq("buyer_profile_id", profileId)
    .eq("payment_status", "completed");

  if (result.error) {
    throw new AgentExecutionError(result.error.message, 500);
  }

  return new Set(result.data.map((purchase) => purchase.agent_id));
}

export async function listOwnedAgentIds(profileId: string) {
  return findPurchasedAgentIds(profileId);
}

async function findAgent({
  agentId,
  agentSlug,
}: {
  agentId?: string;
  agentSlug?: string;
}) {
  if (!agentId && !agentSlug) {
    throw new AgentExecutionError("agentId or agentSlug is required.", 400);
  }

  let query = supabaseAdmin.from("agents").select("*");

  if (agentId) {
    query = query.eq("id", agentId);
  } else if (agentSlug) {
    query = query.eq("slug", agentSlug);
  }

  const result = await query.maybeSingle();

  if (result.error) {
    throw new AgentExecutionError(result.error.message, 500);
  }

  return result.data;
}

function canExecuteAgent({
  agent,
  profile,
  purchasedAgentIds,
}: {
  agent: AgentRow;
  profile: ProfileRow;
  purchasedAgentIds: Set<string>;
}) {
  if (!agent.is_active || agent.status === "archived") {
    return false;
  }

  const ownsAccess = purchasedAgentIds.has(agent.id);

  if (agent.owner_type === "platform") {
    return agent.status === "published" && agent.is_published && ownsAccess;
  }

  if (agent.owner_type === "developer") {
    if (agent.owner_profile_id === profile.id) {
      return true;
    }

    return agent.status === "published" && agent.is_published && ownsAccess;
  }

  return false;
}

function resolvePrompt(agent: AgentRunnerInput, input: string) {
  if (agent.owner_type === "platform") {
    const builtInPrompt = getPlatformAgentPrompt(agent.slug, input);

    if (builtInPrompt) {
      return builtInPrompt;
    }

    return agent.prompt_template
      ? `${agent.prompt_template}\n\nUser input:\n${input}`
      : input;
  }

  if (!agent.prompt_template) {
    throw new AgentExecutionError(
      "Developer agent is missing prompt_template.",
      500,
    );
  }

  return `${agent.prompt_template}\n\nUser input:\n${input}`;
}

function interpolateTemplate(template: string, values: Record<string, unknown>) {
  return template.replace(/\{([^}]+)\}/g, (_, key: string) => {
    const value = values[key];
    return value == null ? "" : String(value);
  });
}

function ensureSafeRemoteUrl(url: string) {
  const parsed = new URL(url);

  if (parsed.protocol !== "https:") {
    throw new AgentExecutionError("Only https endpoints are allowed.", 400);
  }

  if (
    parsed.hostname === "localhost" ||
    parsed.hostname === "127.0.0.1" ||
    parsed.hostname.endsWith(".local")
  ) {
    throw new AgentExecutionError("Local endpoints are not allowed.", 400);
  }

  return parsed.toString();
}

async function executeStructuredDeveloperTool(
  agent: AgentRunnerInput,
  toolName: string,
  rawArguments: string,
) {
  const toolDefinitions = parseToolDefinitions(
    JSON.stringify(agent.tool_definitions ?? []),
  );
  const toolDefinition = toolDefinitions.find((tool) => tool.tool_name === toolName);

  if (!toolDefinition) {
    throw new AgentExecutionError(`Tool "${toolName}" was not found.`, 404);
  }

  const parsedArguments = rawArguments.trim()
    ? (JSON.parse(rawArguments) as Record<string, unknown>)
    : {};
  const secrets = await listToolSecretsForAgent(agent.id);
  const storedSecret = secrets.find((secret) => secret.tool_name === toolName);
  const resolvedHeaders = Object.fromEntries(
    Object.entries(toolDefinition.headers_template).map(([key, value]) => [
      key,
      interpolateTemplate(value, parsedArguments),
    ]),
  );

  if (toolDefinition.auth_type !== "none") {
    if (!storedSecret) {
      throw new AgentExecutionError(
        `Tool "${toolName}" is missing its secret configuration.`,
        400,
      );
    }

    const secretValue = decryptSecretValue(storedSecret.encrypted_value);

    if (toolDefinition.auth_type === "api_key") {
      resolvedHeaders[toolDefinition.auth_header_name ?? "x-api-key"] = secretValue;
    }

    if (toolDefinition.auth_type === "bearer") {
      resolvedHeaders.Authorization = `Bearer ${secretValue}`;
    }

    if (toolDefinition.auth_type === "header_custom") {
      if (!toolDefinition.auth_header_name) {
        throw new AgentExecutionError(
          `Tool "${toolName}" requires auth_header_name.`,
          400,
        );
      }

      resolvedHeaders[toolDefinition.auth_header_name] = toolDefinition.auth_prefix
        ? `${toolDefinition.auth_prefix} ${secretValue}`.trim()
        : secretValue;
    }
  }

  const endpointBase =
    toolDefinition.source_type === "webhook"
      ? toolDefinition.webhook_url
      : `${toolDefinition.base_url}${interpolateTemplate(
          toolDefinition.path_template ?? "",
          parsedArguments,
        )}`;

  if (!endpointBase) {
    throw new AgentExecutionError(`Tool "${toolName}" is missing an endpoint.`, 400);
  }

  const url = ensureSafeRemoteUrl(endpointBase);
  const method =
    toolDefinition.source_type === "webhook"
      ? "POST"
      : toolDefinition.method ?? "GET";
  const bodyAllowed = !["GET", "HEAD"].includes(method);
  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...resolvedHeaders,
    },
    body: bodyAllowed ? JSON.stringify(parsedArguments) : undefined,
    signal: AbortSignal.timeout(toolDefinition.timeout_ms),
  });
  const responseText = await response.text();
  let parsedResponse: unknown = responseText;

  try {
    parsedResponse = JSON.parse(responseText);
  } catch {
    // Keep plain text when the provider does not return JSON.
  }

  return {
    ok: response.ok,
    status: response.status,
    tool_name: toolName,
    data: parsedResponse,
  };
}

async function runDeveloperAgentWithTools(
  agent: AgentRunnerInput,
  input: string,
  onProgress?: AgentProgressReporter,
) {
  const toolDefinitions = parseToolDefinitions(
    JSON.stringify(agent.tool_definitions ?? []),
  );
  const tools = toolDefinitions.map((toolDefinition) => ({
    type: "function" as const,
    function: {
      name: toolDefinition.tool_name,
      description: toolDefinition.description,
      parameters: toolDefinition.input_schema,
    },
  }));
  const messages: Array<Record<string, unknown>> = [
    {
      role: "system",
      content: agent.prompt_template,
    },
    {
      role: "user",
      content: input,
    },
  ];

  await onProgress?.({
    id: "tool-capabilities",
    kind: "status",
    label: "Cargando tools del agente",
    status: "completed",
  });

  for (let step = 0; step < 4; step += 1) {
    const response = await openai.chat.completions.create({
      model: agent.model || OPENAI_QUALITY_MODEL,
      messages: messages as never,
      tools,
    });
    const message = response.choices[0]?.message;

    if (!message) {
      throw new AgentExecutionError("Developer agent returned an empty response.", 500);
    }

    messages.push(message as never);

    if (!message.tool_calls?.length) {
      return {
        output: message.content?.trim() || "",
        metadata: {
          provider: "openai",
          model: response.model,
          tool_count: toolDefinitions.length,
        },
      };
    }

    for (const toolCall of message.tool_calls) {
      if (!("function" in toolCall)) {
        throw new AgentExecutionError(
          "Unsupported tool call format returned by the model.",
          500,
        );
      }

      await onProgress?.({
        id: `tool-${toolCall.function.name}`,
        kind: "status",
        label: `Ejecutando ${toolCall.function.name}`,
        status: "running",
      });

      const toolResult = await executeStructuredDeveloperTool(
        agent,
        toolCall.function.name,
        toolCall.function.arguments,
      );

      messages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: JSON.stringify(toolResult),
      });

      await onProgress?.({
        id: `tool-${toolCall.function.name}`,
        kind: "status",
        label: `${toolCall.function.name} completada`,
        status: "completed",
      });
    }
  }

  throw new AgentExecutionError(
    "The developer agent exceeded the maximum tool call depth.",
    500,
  );
}

function readJsonTextValue(
  value: Json | null | undefined,
  key: "input" | "text" | "error",
) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const candidate = value[key];
  return typeof candidate === "string" ? candidate : null;
}

function looksLikeSpanish(text: string) {
  return /\b(el|la|los|las|para|con|una|unas|unos|que|por|donde|porque|automatizacion|seguimiento|empresa|empresas)\b/i.test(
    text,
  );
}

function looksHeavilyEnglish(text: string) {
  const matches = text.match(
    /\b(the|and|for|with|your|small|business|goal|offer|audience|campaign|promise|service|solution)\b/gi,
  );

  return (matches?.length ?? 0) >= 8;
}

function isCompetitorComparisonPrompt(text: string) {
  return /(hubspot|pipedrive|zoho|salesforce|competidor|competitors?|vs\.?|versus|compare|compara|posicionamiento)/i.test(
    text,
  );
}

function shouldPolishBuiltInOutput(
  agent: AgentRunnerInput,
  input: string,
  output: string,
) {
  const expectations = builtInAgentOutputExpectations[agent.slug];

  if (!expectations) {
    return false;
  }

  const normalizedOutput = output.trim();

  if (normalizedOutput.length < 900) {
    return true;
  }

  const matchedHeadings = expectations.filter((heading) =>
    normalizedOutput.includes(heading),
  ).length;

  if (matchedHeadings < Math.max(2, expectations.length - 1)) {
    return true;
  }

  if (looksLikeSpanish(input) && looksHeavilyEnglish(normalizedOutput)) {
    return true;
  }

  if (
    (agent.slug === "marketing-content" || agent.slug === "research") &&
    isCompetitorComparisonPrompt(input) &&
    !/https?:\/\//i.test(normalizedOutput)
  ) {
    return true;
  }

  return false;
}

async function polishBuiltInOutput(
  agent: AgentRunnerInput,
  input: string,
  draftOutput: string,
) {
  const systemPrompt = getPlatformAgentSystemPrompt(agent.slug);

  if (!systemPrompt) {
    return draftOutput;
  }

  const rubric = builtInAgentRewriteRubric[agent.slug] ?? [];

  const response = await openai.chat.completions.create({
    model: OPENAI_QUALITY_MODEL,
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: [
          "The following draft is too shallow or does not fully satisfy the user's request.",
          "Rewrite it from scratch so it is materially more specific, commercially useful, and complete.",
          "Keep the same language as the user's request.",
          "Do not mention this rewrite process.",
          ...(rubric.length > 0
            ? ["Apply this quality rubric:", ...rubric.map((item) => `- ${item}`), ""]
            : []),
          "",
          "User request:",
          input,
          "",
          "Current draft:",
          draftOutput,
        ].join("\n"),
      },
    ],
  });

  return response.choices[0]?.message?.content?.trim() || draftOutput;
}

export async function listAgents() {
  const result = await supabaseAdmin
    .from("agents")
    .select("*")
    .eq("is_active", true)
    .eq("is_published", true)
    .eq("status", "published")
    .order("name", { ascending: true });

  if (result.error) {
    throw new AgentExecutionError(result.error.message, 500);
  }

  const ownerIds = Array.from(
    new Set(
      result.data
        .map((agent) => agent.owner_profile_id)
        .filter((value): value is string => Boolean(value)),
    ),
  );
  const profilesResult =
    ownerIds.length > 0
      ? await supabaseAdmin
          .from("profiles")
          .select("id, full_name, email")
          .in("id", ownerIds)
      : { data: [], error: null };

  if (profilesResult.error) {
    throw new AgentExecutionError(profilesResult.error.message, 500);
  }

  const profilesById = new Map(
    profilesResult.data.map((profile) => [profile.id, profile] as const),
  );

  return result.data.map((agent) => ({
    id: agent.id,
    name: agent.name,
    slug: agent.slug,
    description: agent.description,
    short_description: agent.short_description,
    pricing_type: agent.pricing_type,
    price: agent.price,
    currency: agent.currency,
    average_rating: agent.average_rating,
    total_reviews: agent.total_reviews,
    total_runs: agent.total_runs,
    cover_image_url: agent.cover_image_url,
    ownerLabel:
      agent.owner_type === "platform"
        ? "Miunix"
        : profilesById.get(agent.owner_profile_id ?? "")?.full_name ??
          profilesById.get(agent.owner_profile_id ?? "")?.email ??
          "Developer",
  })) satisfies AgentListItem[];
}

export async function listAccessibleAgents(profileId: string) {
  const purchasedAgentIds = await findPurchasedAgentIds(profileId);

  if (purchasedAgentIds.size === 0) {
    return [] satisfies AgentListItem[];
  }

  const result = await supabaseAdmin
    .from("agents")
    .select("*")
    .in("id", Array.from(purchasedAgentIds))
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (result.error) {
    throw new AgentExecutionError(result.error.message, 500);
  }

  const ownerIds = Array.from(
    new Set(
      result.data
        .map((agent) => agent.owner_profile_id)
        .filter((value): value is string => Boolean(value)),
    ),
  );
  const profilesResult =
    ownerIds.length > 0
      ? await supabaseAdmin
          .from("profiles")
          .select("id, full_name, email")
          .in("id", ownerIds)
      : { data: [], error: null };

  if (profilesResult.error) {
    throw new AgentExecutionError(profilesResult.error.message, 500);
  }

  const profilesById = new Map(
    profilesResult.data.map((profile) => [profile.id, profile] as const),
  );

  return result.data
    .filter((agent) => agent.status !== "archived")
    .map((agent) => ({
      id: agent.id,
      name: agent.name,
      slug: agent.slug,
      description: agent.description,
      short_description: agent.short_description,
      pricing_type: agent.pricing_type,
      price: agent.price,
      currency: agent.currency,
      average_rating: agent.average_rating,
      total_reviews: agent.total_reviews,
      total_runs: agent.total_runs,
      cover_image_url: agent.cover_image_url,
      ownerLabel:
        agent.owner_type === "platform"
          ? "Miunix"
          : profilesById.get(agent.owner_profile_id ?? "")?.full_name ??
            profilesById.get(agent.owner_profile_id ?? "")?.email ??
            "Developer",
    })) satisfies AgentListItem[];
}

export async function getPublishedAgentBySlug(slug: string) {
  const agent = await findAgent({ agentSlug: slug });

  if (!agent) {
    return null;
  }

  if (!agent.is_active || !agent.is_published || agent.status !== "published") {
    return null;
  }

  return agent;
}

export async function purchaseAgentAccess({
  profileId,
  agentId,
  agentSlug,
}: {
  profileId: string;
  agentId?: string;
  agentSlug?: string;
}) {
  const [profile, agent, purchasedAgentIds] = await Promise.all([
    findProfile(profileId),
    findAgent({ agentId, agentSlug }),
    findPurchasedAgentIds(profileId),
  ]);

  if (!profile) {
    throw new AgentExecutionError("Profile not found.", 404);
  }

  if (!agent) {
    throw new AgentExecutionError("Agent not found.", 404);
  }

  if (!agent.is_active || !agent.is_published || agent.status !== "published") {
    throw new AgentExecutionError("Agent is not available for purchase.", 400);
  }

  if (purchasedAgentIds.has(agent.id)) {
    return {
      alreadyOwned: true,
      agent,
    };
  }

  const purchaseResult = await supabaseAdmin.from("agent_purchases").insert({
    buyer_profile_id: profile.id,
    agent_id: agent.id,
    purchase_price: agent.price,
    currency: agent.currency,
    payment_status: "completed",
  });

  if (purchaseResult.error) {
    throw new AgentExecutionError(purchaseResult.error.message, 500);
  }

  return {
    alreadyOwned: false,
    agent,
  };
}

export async function listExecutionHistory(profileId: string) {
  const executionsResult = await supabaseAdmin
    .from("agent_executions")
    .select("*")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: true });

  if (executionsResult.error) {
    throw new AgentExecutionError(executionsResult.error.message, 500);
  }

  const agentIds = Array.from(
    new Set(executionsResult.data.map((execution) => execution.agent_id)),
  );

  if (agentIds.length === 0) {
    return [] satisfies ExecutionHistoryItem[];
  }

  const agentsResult = await supabaseAdmin
    .from("agents")
    .select("id, slug, name")
    .in("id", agentIds);

  if (agentsResult.error) {
    throw new AgentExecutionError(agentsResult.error.message, 500);
  }

  const agentsById = new Map(
    agentsResult.data.map((agent) => [agent.id, agent] as const),
  );

  return executionsResult.data.flatMap((execution) => {
    const agent = agentsById.get(execution.agent_id);

    if (!agent) {
      return [];
    }

    const output =
      readJsonTextValue(execution.output_data, "text") ??
      readJsonTextValue(execution.output_data, "error");

    return [
      {
        id: execution.id,
        conversationId: execution.conversation_id,
        agentId: execution.agent_id,
        agentSlug: agent.slug,
        agentName: agent.name,
        createdAt: execution.created_at,
        status: execution.status,
        input: readJsonTextValue(execution.input_data, "input") ?? "",
        output,
      },
    ] satisfies ExecutionHistoryItem[];
  });
}

export async function runAgent(
  agent: AgentRunnerInput,
  input: string,
  onProgress?: AgentProgressReporter,
) {
  const normalizedInput = input.trim();

  if (!normalizedInput) {
    throw new AgentExecutionError("input is required.", 400);
  }

  if (canRunWithLangChain(agent)) {
    if (onProgress) {
      return runAgentWithLangChainStream(agent, normalizedInput, onProgress);
    }

    return runAgentWithLangChain(agent, normalizedInput);
  }

  if (
    agent.owner_type === "developer" &&
    Array.isArray(agent.tool_definitions) &&
    agent.tool_definitions.length > 0
  ) {
    return runDeveloperAgentWithTools(agent, normalizedInput, onProgress);
  }

  const prompt = resolvePrompt(agent, normalizedInput);

  await onProgress?.({
    id: "preparing-request",
    kind: "status",
    label: "Preparando ejecucion",
    status: "completed",
  });
  await onProgress?.({
    id: "model-generation",
    kind: "status",
    label: "Generando respuesta",
    status: "running",
  });

  const response = await openai.chat.completions.create({
    model:
      agent.owner_type === "developer" && agent.model
        ? agent.model
        : OPENAI_QUALITY_MODEL,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const output = response.choices[0]?.message?.content ?? "";

  await onProgress?.({
    id: "model-generation",
    kind: "status",
    label: "Respuesta generada",
    status: "completed",
  });

  return {
    output,
      metadata: {
        provider: "openai",
        model:
          agent.owner_type === "developer" && agent.model
            ? agent.model
            : OPENAI_QUALITY_MODEL,
      },
    };
  }

async function createPendingExecution({
  agent,
  conversationId,
  input,
  profile,
}: {
  agent: AgentRow;
  conversationId: string;
  input: string;
  profile: ProfileRow;
}) {
  const result = await supabaseAdmin
    .from("agent_executions")
    .insert({
      profile_id: profile.id,
      agent_id: agent.id,
      conversation_id: conversationId,
      input_data: {
        input,
      },
      status: "pending",
    })
    .select("*")
    .single();

  if (result.error) {
    throw new AgentExecutionError(result.error.message, 500);
  }

  return result.data;
}

async function updateExecution(
  executionId: string,
  payload: Partial<AgentExecutionRow>,
) {
  const result = await supabaseAdmin
    .from("agent_executions")
    .update(payload)
    .eq("id", executionId)
    .select("*")
    .single();

  if (result.error) {
    throw new AgentExecutionError(result.error.message, 500);
  }

  return result.data;
}

async function incrementAgentRunCount(agent: AgentRow) {
  const result = await supabaseAdmin
    .from("agents")
    .update({
      total_runs: agent.total_runs + 1,
    })
    .eq("id", agent.id);

  if (result.error) {
    throw new AgentExecutionError(result.error.message, 500);
  }
}

async function executeAgentInternal({
  profileId,
  agentId,
  agentSlug,
  conversationId,
  input,
  onProgress,
}: ExecuteAgentWithProgressInput): Promise<ExecuteAgentResult> {
  const normalizedInput = input.trim();

  if (!profileId) {
    throw new AgentExecutionError("profileId is required.", 400);
  }

  if (!normalizedInput) {
    throw new AgentExecutionError("input is required.", 400);
  }

  const [profile, agent] = await Promise.all([
    findProfile(profileId),
    findAgent({ agentId, agentSlug }),
  ]);

  if (!profile) {
    throw new AgentExecutionError("Profile not found.", 404);
  }

  if (!agent) {
    throw new AgentExecutionError("Agent not found.", 404);
  }

  const purchasedAgentIds = await findPurchasedAgentIds(profile.id);

  if (!canExecuteAgent({ agent, profile, purchasedAgentIds })) {
    throw new AgentExecutionError(
      "You do not have permission to execute this agent.",
      403,
    );
  }

  const conversation = await ensureConversationForExecution({
    profileId: profile.id,
    agentId: agent.id,
    conversationId,
    input: normalizedInput,
  });

  const execution = await createPendingExecution({
    agent,
    conversationId: conversation.id,
    input: normalizedInput,
    profile,
  });

  await onProgress?.({
    id: "execution-created",
    kind: "status",
    label: "Ejecucion iniciada",
    status: "completed",
  });

  try {
    const runResult = await runAgent(agent, normalizedInput, onProgress);
    let output = runResult.output;

    if (
      agent.owner_type === "platform" &&
      shouldPolishBuiltInOutput(agent, normalizedInput, output)
    ) {
      output = await polishBuiltInOutput(agent, normalizedInput, output);
    }

    const completedExecution = await updateExecution(execution.id, {
      status: "completed",
      output_data: {
        text: output,
        ...(runResult.metadata ?? {}),
      },
    });

    await incrementAgentRunCount(agent);
    await updateConversationMetadata({
      conversationId: conversation.id,
      profileId: profile.id,
      lastMessageAt: completedExecution.created_at,
    });
    await onProgress?.({
      id: "execution-persisted",
      kind: "status",
      label: "Resultado guardado",
      status: "completed",
    });

    return {
      agent,
      execution: completedExecution,
      conversationId: conversation.id,
      output,
      metadata: runResult.metadata,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected agent error.";

    await updateExecution(execution.id, {
      status: "failed",
      output_data: {
        error: message,
        provider: canRunWithLangChain(agent) ? "langchain" : "openai",
        model: OPENAI_DEFAULT_MODEL,
      },
    });

    await updateConversationMetadata({
      conversationId: conversation.id,
      profileId: profile.id,
      lastMessageAt: execution.created_at,
    });

    await onProgress?.({
      id: "execution-failed",
      kind: "status",
      label: "La ejecucion fallo",
      status: "failed",
    });

    if (error instanceof AgentExecutionError) {
      throw error;
    }

    throw new AgentExecutionError(message, 500);
  }
}

export async function executeAgent({
  profileId,
  agentId,
  agentSlug,
  conversationId,
  input,
}: ExecuteAgentInput): Promise<ExecuteAgentResult> {
  return executeAgentInternal({
    profileId,
    agentId,
    agentSlug,
    conversationId,
    input,
  });
}

export async function executeAgentWithProgress(
  input: ExecuteAgentWithProgressInput,
): Promise<ExecuteAgentResult> {
  return executeAgentInternal(input);
}
