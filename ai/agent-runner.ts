import type { AgentProgressReporter } from "@/ai/execution-events";
import { runAgentWithLangChain, runAgentWithLangChainStream, canRunWithLangChain } from "@/ai/langchain";
import { getPlatformAgentPrompt } from "@/ai/prompts";
import { OPENAI_DEFAULT_MODEL, openai } from "@/lib/openai";
import { supabaseAdmin } from "@/lib/supabase";

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
>;

export type AgentRunnerInput = Pick<
  AgentRow,
  | "id"
  | "slug"
  | "name"
  | "owner_type"
  | "owner_profile_id"
  | "prompt_template"
  | "is_active"
  | "is_published"
  | "status"
  | "total_runs"
>;

export type ExecuteAgentInput = {
  profileId: string;
  agentId?: string;
  agentSlug?: string;
  input: string;
};

type ExecuteAgentWithProgressInput = ExecuteAgentInput & {
  onProgress?: AgentProgressReporter;
};

export type ExecuteAgentResult = {
  agent: AgentRow;
  execution: AgentExecutionRow;
  output: string;
  metadata?: Record<string, Json>;
};

export type ExecutionHistoryItem = {
  id: string;
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
    model: OPENAI_DEFAULT_MODEL,
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
      model: OPENAI_DEFAULT_MODEL,
    },
  };
}

async function createPendingExecution({
  agent,
  input,
  profile,
}: {
  agent: AgentRow;
  input: string;
  profile: ProfileRow;
}) {
  const result = await supabaseAdmin
    .from("agent_executions")
    .insert({
      profile_id: profile.id,
      agent_id: agent.id,
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

  const execution = await createPendingExecution({
    agent,
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
    const output = runResult.output;

    const completedExecution = await updateExecution(execution.id, {
      status: "completed",
      output_data: {
        text: output,
        ...(runResult.metadata ?? {}),
      },
    });

    await incrementAgentRunCount(agent);
    await onProgress?.({
      id: "execution-persisted",
      kind: "status",
      label: "Resultado guardado",
      status: "completed",
    });

    return {
      agent,
      execution: completedExecution,
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
  input,
}: ExecuteAgentInput): Promise<ExecuteAgentResult> {
  return executeAgentInternal({
    profileId,
    agentId,
    agentSlug,
    input,
  });
}

export async function executeAgentWithProgress(
  input: ExecuteAgentWithProgressInput,
): Promise<ExecuteAgentResult> {
  return executeAgentInternal(input);
}
