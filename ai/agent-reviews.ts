import { supabaseAdmin } from "@/lib/supabase";

import type { Database } from "@/types/database";

import { AgentExecutionError } from "@/ai/agent-runner";

type AgentReviewRow = Database["public"]["Tables"]["agent_reviews"]["Row"];

type ReviewProfileRow = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "full_name" | "email"
>;

type AgentReviewWithProfile = AgentReviewRow & {
  profiles: ReviewProfileRow | ReviewProfileRow[] | null;
};

export type AgentReviewItem = {
  id: string;
  agentId: string;
  profileId: string;
  rating: number;
  reviewText: string | null;
  createdAt: string;
  updatedAt: string;
  reviewerName: string;
  isCurrentUser: boolean;
};

export type AgentReviewComposer = {
  canReview: boolean;
  hasPurchased: boolean;
  existingReview: AgentReviewItem | null;
};

function getReviewerName(profile: ReviewProfileRow | ReviewProfileRow[] | null) {
  const resolvedProfile = Array.isArray(profile) ? profile[0] : profile;

  if (resolvedProfile?.full_name?.trim()) {
    return resolvedProfile.full_name.trim();
  }

  if (resolvedProfile?.email?.trim()) {
    return resolvedProfile.email.split("@")[0] ?? "Usuario";
  }

  return "Usuario";
}

function mapReviewItem(review: AgentReviewWithProfile, currentProfileId?: string) {
  return {
    id: review.id,
    agentId: review.agent_id,
    profileId: review.profile_id,
    rating: review.rating,
    reviewText: review.review_text,
    createdAt: review.created_at,
    updatedAt: review.updated_at,
    reviewerName: getReviewerName(review.profiles),
    isCurrentUser: review.profile_id === currentProfileId,
  } satisfies AgentReviewItem;
}

async function findPublishedAgent(agentId: string) {
  const result = await supabaseAdmin
    .from("agents")
    .select("id, owner_profile_id, is_active, is_published, status")
    .eq("id", agentId)
    .maybeSingle();

  if (result.error) {
    throw new AgentExecutionError(result.error.message, 500);
  }

  if (
    !result.data ||
    !result.data.is_active ||
    !result.data.is_published ||
    result.data.status !== "published"
  ) {
    throw new AgentExecutionError("Agent not found.", 404);
  }

  return result.data;
}

async function hasPurchasedAgent(profileId: string, agentId: string) {
  const result = await supabaseAdmin
    .from("agent_purchases")
    .select("id")
    .eq("buyer_profile_id", profileId)
    .eq("agent_id", agentId)
    .eq("payment_status", "completed")
    .maybeSingle();

  if (result.error) {
    throw new AgentExecutionError(result.error.message, 500);
  }

  return Boolean(result.data);
}

async function findReviewByProfile(agentId: string, profileId: string) {
  const result = await supabaseAdmin
    .from("agent_reviews")
    .select("id, profile_id, agent_id, rating, review_text, created_at, updated_at, profiles(full_name, email)")
    .eq("agent_id", agentId)
    .eq("profile_id", profileId)
    .maybeSingle();

  if (result.error) {
    throw new AgentExecutionError(result.error.message, 500);
  }

  return result.data as AgentReviewWithProfile | null;
}

export async function listAgentReviews(
  agentId: string,
  currentProfileId?: string,
) {
  await findPublishedAgent(agentId);

  const result = await supabaseAdmin
    .from("agent_reviews")
    .select("id, profile_id, agent_id, rating, review_text, created_at, updated_at, profiles(full_name, email)")
    .eq("agent_id", agentId)
    .order("created_at", { ascending: false });

  if (result.error) {
    throw new AgentExecutionError(result.error.message, 500);
  }

  return result.data.map((review) =>
    mapReviewItem(review as AgentReviewWithProfile, currentProfileId),
  );
}

export async function getAgentReviewComposer(
  agentId: string,
  profileId?: string,
): Promise<AgentReviewComposer> {
  await findPublishedAgent(agentId);

  if (!profileId) {
    return {
      canReview: false,
      hasPurchased: false,
      existingReview: null,
    };
  }

  const [hasPurchased, existingReview] = await Promise.all([
    hasPurchasedAgent(profileId, agentId),
    findReviewByProfile(agentId, profileId),
  ]);

  return {
    canReview: hasPurchased,
    hasPurchased,
    existingReview: existingReview
      ? mapReviewItem(existingReview, profileId)
      : null,
  };
}

export async function upsertAgentReview({
  profileId,
  agentId,
  rating,
  reviewText,
}: {
  profileId: string;
  agentId: string;
  rating: number;
  reviewText?: string;
}) {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new AgentExecutionError("Rating must be between 1 and 5.", 400);
  }

  const normalizedReviewText = reviewText?.trim() ?? "";

  if (normalizedReviewText.length > 1000) {
    throw new AgentExecutionError(
      "Review text must be 1000 characters or fewer.",
      400,
    );
  }

  const agent = await findPublishedAgent(agentId);
  const purchased = await hasPurchasedAgent(profileId, agentId);

  if (!purchased) {
    throw new AgentExecutionError(
      "You can only review agents you have purchased.",
      403,
    );
  }

  if (agent.owner_profile_id === profileId) {
    throw new AgentExecutionError("You cannot review your own agent.", 403);
  }

  const result = await supabaseAdmin
    .from("agent_reviews")
    .upsert(
      {
        profile_id: profileId,
        agent_id: agentId,
        rating,
        review_text: normalizedReviewText || null,
      },
      {
        onConflict: "profile_id,agent_id",
      },
    )
    .select("id, profile_id, agent_id, rating, review_text, created_at, updated_at, profiles(full_name, email)")
    .single();

  if (result.error) {
    throw new AgentExecutionError(result.error.message, 500);
  }

  return mapReviewItem(result.data as AgentReviewWithProfile, profileId);
}
