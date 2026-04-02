import { NextResponse } from "next/server";

import { ensureProfileForUser } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/dashboard";

  if (!code) {
    return NextResponse.redirect(new URL("/auth?message=Codigo invalido.", request.url));
  }

  const supabase = await createServerSupabaseClient();
  const exchangeResult = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeResult.error) {
    return NextResponse.redirect(
      new URL(`/auth?message=${encodeURIComponent(exchangeResult.error.message)}`, request.url),
    );
  }

  if (exchangeResult.data.user) {
    await ensureProfileForUser(exchangeResult.data.user);
  }

  return NextResponse.redirect(new URL(next, request.url));
}
