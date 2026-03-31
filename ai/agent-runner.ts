import { buildLeadGenerationPrompt } from "@/ai/prompts/lead-generation";
import { buildMarketingContentPrompt } from "@/ai/prompts/marketing-content";
import { buildResearchPrompt } from "@/ai/prompts/research";
import { openai } from "@/lib/openai";
import { supabaseAdmin } from "@/lib/supabase";

import type { Database } from "@/types/database";

type AgentRow = Database["public"]["Tables"]["agents"]["Row"];
type AgentExecutionRow =
  Database["public"]["Tables"]["agent_executions"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export type AgentRunnerInput = Pick<
  AgentRow,
  "id" | "slug" | "name" | "owner_type" | "prompt_template"
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
  if (agentId) {
    const byIdResult = await supabaseAdmin
      .from("agents")
      .select("*")
      .eq("id", agentId)
      .maybeSingle();

    if (byIdResult.error) {
      throw new AgentExecutionError(byIdResult.error.message, 500);
    }

    if (byIdResult.data) {
      return byIdResult.data;
    }
  }

  if (agentSlug) {
    const bySlugResult = await supabaseAdmin
      .from("agents")
      .select("*")
      .eq("slug", agentSlug)
      .maybeSingle();

    if (bySlugResult.error) {
      throw new AgentExecutionError(bySlugResult.error.message, 500);
    }

    return bySlugResult.data;
  }

  return null;
}

function canExecuteAgent({
  agent,
  profile,
}: {
  agent: AgentRow;
  profile: ProfileRow;
}) {
  if (!agent.is_active) {
    return false;
  }

  if (agent.is_published) {
    return true;
  }

  return (
    agent.owner_type === "developer" &&
    agent.owner_profile_id === profile.id
  );
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

  if (agent.owner_type === "developer") {
    if (!agent.prompt_template) {
      throw new Error("Developer agent is missing prompt_template");
    }

    return `${agent.prompt_template}\n\nUser input:\n${input}`;
  }

  throw new Error("Unsupported agent owner_type");
}

export async function runAgent(agent: AgentRunnerInput, input: string) {
  const normalizedInput = input.trim();

  if (!normalizedInput) {
    throw new AgentExecutionError("input is required.", 400);
  }

  const prompt = resolvePrompt(agent, normalizedInput);

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
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

  if (!agent.is_active) {
    throw new AgentExecutionError("Agent is not active.", 403);
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
    const outputText = await runAgent(agent, normalizedInput);

    const completedExecution = await updateExecution(execution.id, {
      status: "completed",
      output_data: {
        text: outputText,
        model: "gpt-4o-mini",
      },
    });

    return {
      agent,
      execution: completedExecution,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected agent error.";

    await updateExecution(execution.id, {
      status: "failed",
      output_data: {
        error: message,
      },
    });

    if (error instanceof AgentExecutionError) {
      throw error;
    }

    throw new AgentExecutionError(message, 500);
  }
}
