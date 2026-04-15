import { getAgentBySlug } from "@/lib/agents";
import { supabaseAdmin } from "@/lib/supabase";

import type { Database } from "@/types/database";

type AgentRow = Database["public"]["Tables"]["agents"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export type DeveloperMarketplaceAgent = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  averageRating: number;
  totalReviews: number;
  variant: "lead-generation" | "marketing-content" | "research" | "developer";
};

export type DeveloperMarketplaceProfile = {
  profileId: string;
  slug: string;
  name: string;
  role: string;
  shortDescription: string;
  heroDescription: string;
  taglinePrimary: string;
  taglineSecondary: string;
  initials: string;
  approvedAgentCount: number;
  approvedAgents: DeveloperMarketplaceAgent[];
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function getDeveloperName(profile: Pick<ProfileRow, "full_name" | "email">) {
  const fullName = profile.full_name?.trim();

  if (fullName) {
    return fullName;
  }

  const emailPrefix = profile.email?.split("@")[0]?.trim();
  return emailPrefix || "Developer";
}

function getDeveloperInitials(name: string) {
  const parts = name
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) {
    return "DV";
  }

  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
}

function getDeveloperSlug(profile: Pick<ProfileRow, "id" | "full_name" | "email">) {
  const base = getDeveloperName(profile);
  const normalizedBase = slugify(base) || "developer";
  return `${normalizedBase}-${profile.id.slice(0, 8)}`;
}

function mapApprovedAgent(agent: AgentRow): DeveloperMarketplaceAgent {
  const featuredAgent = getAgentBySlug(agent.slug);

  return {
    id: agent.id,
    slug: agent.slug,
    name: featuredAgent?.title ?? agent.name,
    shortDescription:
      agent.short_description ??
      featuredAgent?.shortDescription ??
      "Agente aprobado y publicado en Miunix.",
    averageRating: Number(agent.average_rating),
    totalReviews: agent.total_reviews,
    variant: (featuredAgent?.slug ?? "developer") as
      | "lead-generation"
      | "marketing-content"
      | "research"
      | "developer",
  };
}

export async function listMarketplaceDevelopers() {
  const agentsResult = await supabaseAdmin
    .from("agents")
    .select("*")
    .eq("owner_type", "developer")
    .eq("is_active", true)
    .eq("is_published", true)
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (agentsResult.error) {
    throw new Error(agentsResult.error.message);
  }

  const ownerIds = Array.from(
    new Set(
      agentsResult.data
        .map((agent) => agent.owner_profile_id)
        .filter((value): value is string => Boolean(value)),
    ),
  );

  if (ownerIds.length === 0) {
    return [] satisfies DeveloperMarketplaceProfile[];
  }

  const profilesResult = await supabaseAdmin
    .from("profiles")
    .select("id, full_name, email")
    .in("id", ownerIds)
    .eq("role", "developer");

  if (profilesResult.error) {
    throw new Error(profilesResult.error.message);
  }

  const profilesById = new Map(
    profilesResult.data.map((profile) => [profile.id, profile] as const),
  );
  const agentsByProfile = new Map<string, AgentRow[]>();

  for (const agent of agentsResult.data) {
    if (!agent.owner_profile_id || !profilesById.has(agent.owner_profile_id)) {
      continue;
    }

    const current = agentsByProfile.get(agent.owner_profile_id) ?? [];
    current.push(agent);
    agentsByProfile.set(agent.owner_profile_id, current);
  }

  return Array.from(agentsByProfile.entries())
    .flatMap(([profileId, agents]) => {
      const profile = profilesById.get(profileId);

      if (!profile || agents.length === 0) {
        return [];
      }

      const name = getDeveloperName(profile);
      const approvedAgents = agents.map(mapApprovedAgent);

      return [
        {
          profileId: profile.id,
          slug: getDeveloperSlug(profile),
          name,
          role: "Developer verificado en Miunix",
          shortDescription:
            approvedAgents[0]?.shortDescription ??
            "Publica agentes aprobados dentro del marketplace de Miunix.",
          heroDescription:
            approvedAgents.length === 1
              ? `${name} tiene 1 agente aprobado y publicado dentro de Miunix.`
              : `${name} tiene ${approvedAgents.length} agentes aprobados y publicados dentro de Miunix.`,
          taglinePrimary: "Agentes aprobados por Miunix",
          taglineSecondary:
            approvedAgents.length === 1
              ? "1 agente publicado"
              : `${approvedAgents.length} agentes publicados`,
          initials: getDeveloperInitials(name),
          approvedAgentCount: approvedAgents.length,
          approvedAgents,
        },
      ] satisfies DeveloperMarketplaceProfile[];
    })
    .sort((a, b) => b.approvedAgentCount - a.approvedAgentCount);
}
