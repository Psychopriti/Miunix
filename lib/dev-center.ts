import { AgentExecutionError } from "@/ai/agent-runner";
import { supabaseAdmin } from "@/lib/supabase";
import type {
  AgentReviewStatus,
  AgentTestRunStatus,
  Database,
} from "@/types/database";

type AgentInsert = Database["public"]["Tables"]["agents"]["Insert"];
type AgentRow = Database["public"]["Tables"]["agents"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type ToolSecretInsert =
  Database["public"]["Tables"]["agent_tool_secrets"]["Insert"];
type AgentTestRunInsert =
  Database["public"]["Tables"]["agent_test_runs"]["Insert"];
type AgentTestRunRow = Database["public"]["Tables"]["agent_test_runs"]["Row"];

export type DeveloperAgentListItem = Pick<
  AgentRow,
  | "id"
  | "name"
  | "slug"
  | "short_description"
  | "status"
  | "review_status"
  | "last_test_run_status"
  | "last_test_run_at"
  | "is_published"
  | "is_active"
  | "model"
  | "pricing_type"
  | "price"
  | "currency"
  | "total_runs"
  | "updated_at"
  | "tool_definitions"
> & {
  toolCount: number;
};

export type ReviewQueueItem = Pick<
  AgentRow,
  | "id"
  | "name"
  | "slug"
  | "short_description"
  | "description"
  | "model"
  | "pricing_type"
  | "price"
  | "currency"
  | "review_status"
  | "last_test_run_status"
  | "last_test_run_at"
  | "updated_at"
  | "created_at"
> & {
  developerName: string;
  developerEmail: string | null;
  toolCount: number;
};

export type LatestReviewTestRun = Pick<
  AgentTestRunRow,
  "id" | "agent_id" | "status" | "input_data" | "output_data" | "created_at"
>;

export function ensureDeveloperProfile(profile: ProfileRow) {
  if (profile.role !== "developer") {
    throw new AgentExecutionError(
      "Solo las cuentas developer pueden acceder al Dev Center.",
      403,
    );
  }

  return profile;
}

export function ensureAdminProfile(profile: ProfileRow) {
  if (profile.role !== "admin") {
    throw new AgentExecutionError(
      "Solo las cuentas admin pueden acceder al panel de revision.",
      403,
    );
  }

  return profile;
}

export async function listDeveloperAgents(profileId: string) {
  const result = await supabaseAdmin
    .from("agents")
    .select("*")
    .eq("owner_profile_id", profileId)
    .eq("owner_type", "developer")
    .order("updated_at", { ascending: false });

  if (result.error) {
    throw new AgentExecutionError(result.error.message, 500);
  }

  return result.data.map((agent) => ({
    id: agent.id,
    name: agent.name,
    slug: agent.slug,
    short_description: agent.short_description,
    status: agent.status,
    review_status: agent.review_status,
    last_test_run_status: agent.last_test_run_status,
    last_test_run_at: agent.last_test_run_at,
    is_published: agent.is_published,
    is_active: agent.is_active,
    model: agent.model,
    pricing_type: agent.pricing_type,
    price: agent.price,
    currency: agent.currency,
      total_runs: agent.total_runs,
      updated_at: agent.updated_at,
      tool_definitions: agent.tool_definitions,
      toolCount: Array.isArray(agent.tool_definitions)
      ? agent.tool_definitions.length
      : 0,
  })) satisfies DeveloperAgentListItem[];
}

export async function listReviewQueueAgents() {
  const result = await supabaseAdmin
    .from("agents")
    .select("*")
    .eq("owner_type", "developer")
    .in("review_status", [
      "ready_for_review",
      "in_review",
      "changes_requested",
      "approved",
    ])
    .order("updated_at", { ascending: false });

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

  return result.data.map((agent) => {
    const owner = agent.owner_profile_id
      ? profilesById.get(agent.owner_profile_id)
      : null;

    return {
      id: agent.id,
      name: agent.name,
      slug: agent.slug,
      short_description: agent.short_description,
      description: agent.description,
      model: agent.model,
      pricing_type: agent.pricing_type,
      price: agent.price,
      currency: agent.currency,
      review_status: agent.review_status,
      last_test_run_status: agent.last_test_run_status,
      last_test_run_at: agent.last_test_run_at,
      updated_at: agent.updated_at,
      created_at: agent.created_at,
      developerName: owner?.full_name ?? owner?.email ?? "Developer",
      developerEmail: owner?.email ?? null,
      toolCount: Array.isArray(agent.tool_definitions)
        ? agent.tool_definitions.length
        : 0,
    } satisfies ReviewQueueItem;
  });
}

export async function createDeveloperAgent(payload: AgentInsert) {
  const result = await supabaseAdmin
    .from("agents")
    .insert(payload)
    .select("*")
    .single();

  if (result.error) {
    throw new AgentExecutionError(result.error.message, 500);
  }

  return result.data;
}

export async function getDeveloperAgentById(agentId: string, profileId: string) {
  const result = await supabaseAdmin
    .from("agents")
    .select("*")
    .eq("id", agentId)
    .eq("owner_profile_id", profileId)
    .eq("owner_type", "developer")
    .maybeSingle();

  if (result.error) {
    throw new AgentExecutionError(result.error.message, 500);
  }

  return result.data;
}

export async function getReviewQueueAgentById(agentId: string) {
  const result = await supabaseAdmin
    .from("agents")
    .select("*")
    .eq("id", agentId)
    .eq("owner_type", "developer")
    .maybeSingle();

  if (result.error) {
    throw new AgentExecutionError(result.error.message, 500);
  }

  return result.data;
}

export async function updateDeveloperAgent(
  agentId: string,
  profileId: string,
  payload: Database["public"]["Tables"]["agents"]["Update"],
) {
  const result = await supabaseAdmin
    .from("agents")
    .update(payload)
    .eq("id", agentId)
    .eq("owner_profile_id", profileId)
    .eq("owner_type", "developer")
    .select("*")
    .single();

  if (result.error) {
    throw new AgentExecutionError(result.error.message, 500);
  }

  return result.data;
}

export async function updateAgentReviewByAdmin(
  agentId: string,
  payload: Database["public"]["Tables"]["agents"]["Update"],
) {
  const result = await supabaseAdmin
    .from("agents")
    .update(payload)
    .eq("id", agentId)
    .eq("owner_type", "developer")
    .select("*")
    .single();

  if (result.error) {
    throw new AgentExecutionError(result.error.message, 500);
  }

  return result.data;
}

export async function deleteApprovedDeveloperAgentByAdmin(agentId: string) {
  const existingAgent = await getReviewQueueAgentById(agentId);

  if (!existingAgent) {
    throw new AgentExecutionError("Agent not found.", 404);
  }

  if (existingAgent.owner_type !== "developer") {
    throw new AgentExecutionError(
      "Solo se pueden eliminar agentes de developers.",
      403,
    );
  }

  if (existingAgent.review_status !== "approved") {
    throw new AgentExecutionError(
      "Solo se pueden eliminar agentes ya aprobados.",
      400,
    );
  }

  const result = await supabaseAdmin
    .from("agents")
    .delete()
    .eq("id", agentId)
    .eq("owner_type", "developer");

  if (result.error) {
    throw new AgentExecutionError(result.error.message, 500);
  }
}

export async function upsertToolSecrets(secrets: ToolSecretInsert[]) {
  if (secrets.length === 0) {
    return;
  }

  const result = await supabaseAdmin
    .from("agent_tool_secrets")
    .upsert(secrets, { onConflict: "agent_id,tool_name,secret_key" });

  if (result.error) {
    throw new AgentExecutionError(result.error.message, 500);
  }
}

export async function listToolSecretsForAgent(agentId: string) {
  const result = await supabaseAdmin
    .from("agent_tool_secrets")
    .select("*")
    .eq("agent_id", agentId);

  if (result.error) {
    throw new AgentExecutionError(result.error.message, 500);
  }

  return result.data;
}

export async function createAgentTestRun(payload: AgentTestRunInsert) {
  const result = await supabaseAdmin
    .from("agent_test_runs")
    .insert(payload)
    .select("*")
    .single();

  if (result.error) {
    throw new AgentExecutionError(result.error.message, 500);
  }

  return result.data;
}

export async function listLatestReviewTestRuns(agentIds: string[]) {
  if (agentIds.length === 0) {
    return new Map<string, LatestReviewTestRun>();
  }

  const result = await supabaseAdmin
    .from("agent_test_runs")
    .select("*")
    .in("agent_id", agentIds)
    .order("created_at", { ascending: false });

  if (result.error) {
    throw new AgentExecutionError(result.error.message, 500);
  }

  const latestRuns = new Map<string, LatestReviewTestRun>();

  for (const testRun of result.data) {
    if (!latestRuns.has(testRun.agent_id)) {
      latestRuns.set(testRun.agent_id, testRun);
    }
  }

  return latestRuns;
}

export async function updateAgentReviewState({
  agentId,
  profileId,
  reviewStatus,
  lastTestRunStatus,
}: {
  agentId: string;
  profileId: string;
  reviewStatus?: AgentReviewStatus;
  lastTestRunStatus?: AgentTestRunStatus;
}) {
  return updateDeveloperAgent(agentId, profileId, {
    ...(reviewStatus ? { review_status: reviewStatus } : {}),
    ...(lastTestRunStatus ? { last_test_run_status: lastTestRunStatus } : {}),
  });
}
