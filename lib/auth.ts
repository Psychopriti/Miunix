import type { User } from "@supabase/supabase-js";

import { createServerSupabaseClient, supabaseAdmin } from "@/lib/supabase";

import type { Database } from "@/types/database";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

type UpsertProfileInput = {
  email: string | null;
  fullName: string | null;
  userId: string;
};

async function upsertProfile({
  email,
  fullName,
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
      role: "user",
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
