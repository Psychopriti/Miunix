import { buildLeadGenerationPrompt } from "@/ai/prompts/lead-generation";
import { buildMarketingContentPrompt } from "@/ai/prompts/marketing-content";
import { buildResearchPrompt } from "@/ai/prompts/research";
import { OPENAI_DEFAULT_MODEL, openai } from "@/lib/openai";
import { supabaseAdmin } from "@/lib/supabase";

import type { Database } from "@/types/database";

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

export type ExecuteAgentResult = {
  agent: AgentRow;
  execution: AgentExecutionRow;
  output: string;
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
}: {
  agent: AgentRow;
  profile: ProfileRow;
}) {
  if (!agent.is_active || agent.status === "archived") {
    return false;
  }

  if (agent.owner_type === "platform") {
    return agent.status === "published" && agent.is_published;
  }

  if (agent.owner_type === "developer") {
    if (agent.owner_profile_id === profile.id) {
      return true;
    }

    return agent.status === "published" && agent.is_published;
  }

  return false;
}

function resolvePrompt(agent: AgentRunnerInput, input: string) {
  if (agent.owner_type === "platform") {
    switch (agent.slug) {
      case "lead-generation":
        return buildLeadGenerationPrompt(input);
      case "marketing-content":
        return buildMarketingContentPrompt(input);
      case "research":
        return buildResearchPrompt(input);
      default:
        return agent.prompt_template
          ? `${agent.prompt_template}\n\nUser input:\n${input}`
          : input;
    }
  }

  if (!agent.prompt_template) {
    throw new AgentExecutionError(
      "Developer agent is missing prompt_template.",
      500,
    );
  }

  return `${agent.prompt_template}\n\nUser input:\n${input}`;
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

export async function runAgent(agent: AgentRunnerInput, input: string) {
  const normalizedInput = input.trim();

  if (!normalizedInput) {
    throw new AgentExecutionError("input is required.", 400);
  }

  const prompt = resolvePrompt(agent, normalizedInput);

  const response = await openai.chat.completions.create({
    model: OPENAI_DEFAULT_MODEL,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  return response.choices[0]?.message?.content ?? "";
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

export async function executeAgent({
  profileId,
  agentId,
  agentSlug,
  input,
}: ExecuteAgentInput): Promise<ExecuteAgentResult> {
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

  if (!canExecuteAgent({ agent, profile })) {
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

  try {
    const output = await runAgent(agent, normalizedInput);

    const completedExecution = await updateExecution(execution.id, {
      status: "completed",
      output_data: {
        text: output,
        model: OPENAI_DEFAULT_MODEL,
      },
    });

    await incrementAgentRunCount(agent);

    return {
      agent,
      execution: completedExecution,
      output,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected agent error.";

    await updateExecution(execution.id, {
      status: "failed",
      output_data: {
        error: message,
        model: OPENAI_DEFAULT_MODEL,
      },
    });

    if (error instanceof AgentExecutionError) {
      throw error;
    }

    throw new AgentExecutionError(message, 500);
  }
}
