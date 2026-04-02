import { NextResponse } from "next/server";

import { AgentExecutionError, listAgents } from "@/ai/agent-runner";

export async function GET() {
  try {
    const agents = await listAgents();

    return NextResponse.json({
      success: true,
      agents,
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
