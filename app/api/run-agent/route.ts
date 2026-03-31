import { NextResponse } from "next/server";

import { runAgent } from "@/ai/agent-runner";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: Request) {
  let executionId: string | null = null;

  try {
    const body = await req.json();
    const { profileId, agentSlug, agentId, input } = body;

    if (!profileId || !input || (!agentSlug && !agentId)) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 },
      );
    }

    let agentQuery = supabaseAdmin
      .from("agents")
      .select(
        "id, owner_profile_id, owner_type, name, slug, prompt_template, is_active, is_published",
      );

    if (agentId) {
      agentQuery = agentQuery.eq("id", agentId);
    } else {
      agentQuery = agentQuery.eq("slug", agentSlug);
    }

    const { data: agent, error: agentError } = await agentQuery.single();

    if (agentError || !agent) {
      return NextResponse.json(
        { success: false, error: "Agent not found" },
        { status: 404 },
      );
    }

    if (!agent.is_active) {
      return NextResponse.json(
        { success: false, error: "Agent is inactive" },
        { status: 403 },
      );
    }

    const canRunPublished = agent.is_published === true;
    const isDeveloperOwner =
      agent.owner_type === "developer" &&
      agent.owner_profile_id === profileId;

    const canRun =
      (agent.owner_type === "platform" && canRunPublished) ||
      (agent.owner_type === "developer" &&
        (canRunPublished || isDeveloperOwner));

    if (!canRun) {
      return NextResponse.json(
        {
          success: false,
          error: "You do not have permission to run this agent",
        },
        { status: 403 },
      );
    }

    const { data: execution, error: executionError } = await supabaseAdmin
      .from("agent_executions")
      .insert({
        profile_id: profileId,
        agent_id: agent.id,
        input_data: {
          input,
        },
        status: "pending",
      })
      .select("id")
      .single();

    if (executionError || !execution) {
      return NextResponse.json(
        { success: false, error: "Failed to create execution" },
        { status: 500 },
      );
    }

    executionId = execution.id;

    const output = await runAgent(agent, input);

    const { error: updateError } = await supabaseAdmin
      .from("agent_executions")
      .update({
        status: "completed",
        output_data: {
          text: output,
        },
      })
      .eq("id", executionId);

    if (updateError) {
      return NextResponse.json(
        { success: false, error: "Failed to save execution output" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      executionId,
      output,
    });
  } catch (error) {
    if (executionId) {
      await supabaseAdmin
        .from("agent_executions")
        .update({
          status: "failed",
          output_data: {
            error: error instanceof Error ? error.message : "Unknown error",
          },
        })
        .eq("id", executionId);
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
