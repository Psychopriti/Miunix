import type { User } from "@supabase/supabase-js";

import { createServerSupabaseClient, supabaseAdmin } from "@/lib/supabase";

import type { Database } from "@/types/database";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type ProfileRole = Database["public"]["Enums"]["profile_role"];
type PremiumPlan = Database["public"]["Enums"]["premium_plan"];

type UpsertProfileInput = {
  email: string | null;
  fullName: string | null;
  role: ProfileRole;
  userId: string;
};

async function upsertProfile({
  email,
  fullName,
  role,
  userId,
}: UpsertProfileInput): Promise<ProfileRow> {
  const byUserId = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (byUserId.error) {
    throw new Error(byUserId.error.message);
  }

  if (byUserId.data) {
    const updated = await supabaseAdmin
      .from("profiles")
      .update({
        email,
        full_name: fullName,
      })
      .eq("id", byUserId.data.id)
      .select("*")
      .single();

    if (updated.error) {
      throw new Error(updated.error.message);
    }

    return updated.data;
  }

  if (email) {
    const byEmail = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("email", email)
      .maybeSingle();

    if (byEmail.error) {
      throw new Error(byEmail.error.message);
    }

    if (byEmail.data) {
      const updated = await supabaseAdmin
        .from("profiles")
      .update({
        user_id: userId,
        email,
        full_name: fullName,
        role: byEmail.data.role ?? role,
      })
        .eq("id", byEmail.data.id)
        .select("*")
        .single();

      if (updated.error) {
        throw new Error(updated.error.message);
      }

      return updated.data;
    }
  }

  const inserted = await supabaseAdmin
    .from("profiles")
    .insert({
      user_id: userId,
      email,
      full_name: fullName,
      role,
    })
    .select("*")
    .single();

  if (inserted.error) {
    throw new Error(inserted.error.message);
  }

  return inserted.data;
}

export async function ensureProfileForUser(user: User) {
  return upsertProfile({
    userId: user.id,
    email: user.email ?? null,
    fullName:
      typeof user.user_metadata?.full_name === "string"
        ? user.user_metadata.full_name
        : null,
    role:
      user.user_metadata?.role === "developer" ||
      user.user_metadata?.role === "admin"
        ? user.user_metadata.role
        : "user",
  });
}

export async function getCurrentUser() {
  const supabase = await createServerSupabaseClient();
  const result = await supabase.auth.getUser();

  if (result.error) {
    return null;
  }

  return result.data.user;
}

export async function getCurrentProfile() {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  return ensureProfileForUser(user);
}

export async function requireCurrentProfile() {
  const profile = await getCurrentProfile();

  if (!profile) {
    throw new Error("Unauthorized");
  }

  return profile;
}

export function getDefaultRouteForRole(role: ProfileRole) {
  return role === "admin" ? "/review-center" : "/dashboard";
}

export function isPremiumPlan(value: string | null): value is PremiumPlan {
  return value === "starter" || value === "pro" || value === "scale";
}

export function isPremiumUser(profile: ProfileRow | null) {
  return (
    profile?.role === "user" &&
    profile.is_premium &&
    isPremiumPlan(profile.premium_plan)
  );
}
