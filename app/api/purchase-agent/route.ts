import { NextResponse } from "next/server";

import { AgentExecutionError, purchaseAgentAccess } from "@/ai/agent-runner";
import { ensureProfileForUser } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const userResult = await supabase.auth.getUser();

    if (userResult.error || !userResult.data.user) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 },
      );
    }

    const profile = await ensureProfileForUser(userResult.data.user);
    const body = await request.json();
    const agentId = typeof body.agentId === "string" ? body.agentId.trim() : "";
    const agentSlug =
      typeof body.agentSlug === "string" ? body.agentSlug.trim() : "";

    const result = await purchaseAgentAccess({
      profileId: profile.id,
      agentId: agentId || undefined,
      agentSlug: agentSlug || undefined,
    });

    return NextResponse.json({
      success: true,
      alreadyOwned: result.alreadyOwned,
      agent: {
        id: result.agent.id,
        slug: result.agent.slug,
        name: result.agent.name,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    const status =
      error instanceof AgentExecutionError ? error.statusCode : 500;

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status },
    );
  }
}
