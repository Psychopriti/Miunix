import { supabaseAdmin } from "@/lib/supabase";

import type { Database } from "@/types/database";

import { AgentExecutionError } from "@/ai/agent-runner";

type ConversationRow = Database["public"]["Tables"]["agent_conversations"]["Row"];
type AgentRow = Database["public"]["Tables"]["agents"]["Row"];

export type AgentConversationItem = {
  id: string;
  agentId: string;
  agentSlug: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string;
};

function truncateConversationTitle(input: string) {
  const normalized = input.replace(/\s+/g, " ").trim();

  if (!normalized) {
    return "Nueva conversacion";
  }

  return normalized.length > 72
    ? `${normalized.slice(0, 69).trimEnd()}...`
    : normalized;
}

async function findConversation(conversationId: string) {
  const result = await supabaseAdmin
    .from("agent_conversations")
    .select("*")
    .eq("id", conversationId)
    .maybeSingle();

  if (result.error) {
    throw new AgentExecutionError(result.error.message, 500);
  }

  return result.data;
}

async function assertConversationAccess({
  conversationId,
  profileId,
  agentId,
}: {
  conversationId: string;
  profileId: string;
  agentId?: string;
}) {
  const conversation = await findConversation(conversationId);

  if (!conversation) {
    throw new AgentExecutionError("Conversation not found.", 404);
  }

  if (conversation.profile_id !== profileId) {
    throw new AgentExecutionError("You do not have access to this conversation.", 403);
  }

  if (agentId && conversation.agent_id !== agentId) {
    throw new AgentExecutionError(
      "Conversation does not belong to this agent.",
      400,
    );
  }

  return conversation;
}

function mapConversationItem(
  conversation: ConversationRow,
  agentsById: Map<string, Pick<AgentRow, "id" | "slug">>,
) {
  const agent = agentsById.get(conversation.agent_id);

  if (!agent) {
    return null;
  }

  return {
    id: conversation.id,
    agentId: conversation.agent_id,
    agentSlug: agent.slug,
    title: conversation.title,
    createdAt: conversation.created_at,
    updatedAt: conversation.updated_at,
    lastMessageAt: conversation.last_message_at,
  } satisfies AgentConversationItem;
}

export async function listAgentConversations(profileId: string) {
  const conversationsResult = await supabaseAdmin
    .from("agent_conversations")
    .select("*")
    .eq("profile_id", profileId)
    .order("last_message_at", { ascending: false });

  if (conversationsResult.error) {
    throw new AgentExecutionError(conversationsResult.error.message, 500);
  }

  const agentIds = Array.from(
    new Set(conversationsResult.data.map((conversation) => conversation.agent_id)),
  );

  if (agentIds.length === 0) {
    return [] satisfies AgentConversationItem[];
  }

  const agentsResult = await supabaseAdmin
    .from("agents")
    .select("id, slug")
    .in("id", agentIds);

  if (agentsResult.error) {
    throw new AgentExecutionError(agentsResult.error.message, 500);
  }

  const agentsById = new Map(
    agentsResult.data.map((agent) => [agent.id, agent] as const),
  );

  return conversationsResult.data.flatMap((conversation) => {
    const item = mapConversationItem(conversation, agentsById);
    return item ? [item] : [];
  });
}

export async function createAgentConversation({
  profileId,
  agentId,
  title,
}: {
  profileId: string;
  agentId: string;
  title?: string;
}) {
  const result = await supabaseAdmin
    .from("agent_conversations")
    .insert({
      profile_id: profileId,
      agent_id: agentId,
      title: truncateConversationTitle(title ?? ""),
    })
    .select("*")
    .single();

  if (result.error) {
    throw new AgentExecutionError(result.error.message, 500);
  }

  const agentResult = await supabaseAdmin
    .from("agents")
    .select("id, slug")
    .eq("id", agentId)
    .single();

  if (agentResult.error) {
    throw new AgentExecutionError(agentResult.error.message, 500);
  }

  return mapConversationItem(
    result.data,
    new Map([[agentResult.data.id, agentResult.data]]),
  );
}

export async function updateConversationMetadata({
  conversationId,
  profileId,
  title,
  lastMessageAt,
}: {
  conversationId: string;
  profileId: string;
  title?: string;
  lastMessageAt?: string;
}) {
  const conversation = await assertConversationAccess({
    conversationId,
    profileId,
  });

  const payload: Database["public"]["Tables"]["agent_conversations"]["Update"] = {};

  if (typeof title === "string") {
    payload.title = truncateConversationTitle(title);
  }

  if (lastMessageAt) {
    payload.last_message_at = lastMessageAt;
  }

  const result = await supabaseAdmin
    .from("agent_conversations")
    .update(payload)
    .eq("id", conversation.id)
    .select("*")
    .single();

  if (result.error) {
    throw new AgentExecutionError(result.error.message, 500);
  }

  const agentResult = await supabaseAdmin
    .from("agents")
    .select("id, slug")
    .eq("id", result.data.agent_id)
    .single();

  if (agentResult.error) {
    throw new AgentExecutionError(agentResult.error.message, 500);
  }

  return mapConversationItem(
    result.data,
    new Map([[agentResult.data.id, agentResult.data]]),
  );
}

export async function deleteConversation({
  conversationId,
  profileId,
}: {
  conversationId: string;
  profileId: string;
}) {
  await assertConversationAccess({
    conversationId,
    profileId,
  });

  const result = await supabaseAdmin
    .from("agent_conversations")
    .delete()
    .eq("id", conversationId);

  if (result.error) {
    throw new AgentExecutionError(result.error.message, 500);
  }
}

export async function ensureConversationForExecution({
  profileId,
  agentId,
  conversationId,
  input,
}: {
  profileId: string;
  agentId: string;
  conversationId?: string;
  input: string;
}) {
  if (conversationId) {
    return assertConversationAccess({
      conversationId,
      profileId,
      agentId,
    });
  }

  const conversation = await createAgentConversation({
    profileId,
    agentId,
    title: input,
  });

  if (!conversation) {
    throw new AgentExecutionError("Could not create conversation.", 500);
  }

  const persistedConversation = await findConversation(conversation.id);

  if (!persistedConversation) {
    throw new AgentExecutionError("Could not create conversation.", 500);
  }

  return persistedConversation;
}
