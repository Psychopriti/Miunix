"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { ensureProfileForUser } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase";

function buildMessageRedirect(path: string, message: string) {
  return `${path}?message=${encodeURIComponent(message)}`;
}

async function getOrigin() {
  const headerStore = await headers();
  const origin = headerStore.get("origin");

  if (origin) {
    return origin;
  }

  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const protocol = headerStore.get("x-forwarded-proto") ?? "http";

  return host ? `${protocol}://${host}` : "http://localhost:3000";
}

export async function signInAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const supabase = await createServerSupabaseClient();

  const result = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (result.error) {
    redirect(buildMessageRedirect("/auth", result.error.message));
  }

  if (result.data.user) {
    await ensureProfileForUser(result.data.user);
  }

  redirect("/dashboard");
}

export async function signUpAction(formData: FormData) {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const origin = await getOrigin();
  const supabase = await createServerSupabaseClient();

  const result = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
      emailRedirectTo: `${origin}/auth/callback?next=/dashboard`,
    },
  });

  if (result.error) {
    redirect(buildMessageRedirect("/auth", result.error.message));
  }

  if (result.data.user && result.data.session) {
    await ensureProfileForUser(result.data.user);
    redirect("/dashboard");
  }

  redirect(
    buildMessageRedirect(
      "/auth",
      "Te enviamos un correo de confirmacion para activar tu cuenta.",
    ),
  );
}

export async function signOutAction() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect("/auth");
}
