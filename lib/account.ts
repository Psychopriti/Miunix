import { supabaseAdmin } from "@/lib/supabase";
import type { Database } from "@/types/database";

type AgentRow = Database["public"]["Tables"]["agents"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export type AccountPurchasedAgent = Pick<AgentRow, "id" | "name" | "slug">;

export async function countCompletedAgentPurchases(profileId: string) {
  const result = await supabaseAdmin
    .from("agent_purchases")
    .select("id", { count: "exact", head: true })
    .eq("buyer_profile_id", profileId)
    .eq("payment_status", "completed");

  if (result.error) {
    throw new Error(result.error.message);
  }

  return result.count ?? 0;
}

export async function countCompletedWorkflowPurchases(profileId: string) {
  const result = await supabaseAdmin
    .from("workflow_purchases")
    .select("id", { count: "exact", head: true })
    .eq("buyer_profile_id", profileId)
    .eq("payment_status", "completed");

  if (result.error) {
    throw new Error(result.error.message);
  }

  return result.count ?? 0;
}

export async function countPromptRuns(profileId: string) {
  const result = await supabaseAdmin
    .from("agent_executions")
    .select("id", { count: "exact", head: true })
    .eq("profile_id", profileId);

  if (result.error) {
    throw new Error(result.error.message);
  }

  return result.count ?? 0;
}

export async function listPurchasedAgentsForAccount(profileId: string) {
  const purchasesResult = await supabaseAdmin
    .from("agent_purchases")
    .select("agent_id")
    .eq("buyer_profile_id", profileId)
    .eq("payment_status", "completed");

  if (purchasesResult.error) {
    throw new Error(purchasesResult.error.message);
  }

  const agentIds = purchasesResult.data.map((purchase) => purchase.agent_id);

  if (agentIds.length === 0) {
    return [] satisfies AccountPurchasedAgent[];
  }

  const agentsResult = await supabaseAdmin
    .from("agents")
    .select("id, name, slug")
    .in("id", agentIds)
    .order("name", { ascending: true });

  if (agentsResult.error) {
    throw new Error(agentsResult.error.message);
  }

  return agentsResult.data satisfies AccountPurchasedAgent[];
}

export async function unsubscribeFromPurchasedAgent(
  profileId: string,
  agentId: string,
) {
  const result = await supabaseAdmin
    .from("agent_purchases")
    .update({ payment_status: "refunded" })
    .eq("buyer_profile_id", profileId)
    .eq("agent_id", agentId)
    .eq("payment_status", "completed");

  if (result.error) {
    throw new Error(result.error.message);
  }
}

export async function unsubscribeFromMiunixPlus(profile: ProfileRow) {
  const profileResult = await supabaseAdmin
    .from("profiles")
    .update({
      is_premium: false,
      premium_plan: null,
      premium_agent_limit: 0,
      premium_since: null,
    })
    .eq("id", profile.id)
    .eq("role", "user");

  if (profileResult.error) {
    throw new Error(profileResult.error.message);
  }

  const agentsResult = await supabaseAdmin
    .from("agents")
    .update({
      is_active: false,
      status: "archived",
    })
    .eq("owner_profile_id", profile.id)
    .eq("owner_type", "user")
    .neq("status", "archived");

  if (agentsResult.error) {
    throw new Error(agentsResult.error.message);
  }
}
