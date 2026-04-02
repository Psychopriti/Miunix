import { NextResponse } from "next/server";

import { AgentExecutionError, executeAgent } from "@/ai/agent-runner";
import { ensureProfileForUser } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase";

export async function POST(
  request: Request,
  context: RouteContext<"/api/execute/[agentId]">,
) {
  try {
    const { agentId } = await context.params;
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
    const input = typeof body.input === "string" ? body.input : "";

    const result = await executeAgent({
      profileId: profile.id,
      agentId,
      input,
    });

    return NextResponse.json({
      success: true,
      executionId: result.execution.id,
      agent: result.agent,
      execution: result.execution,
      output: result.output,
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
