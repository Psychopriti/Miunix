import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { listAgentConversations } from "@/ai/agent-conversations";
import { listAccessibleAgents, listExecutionHistory } from "@/ai/agent-runner";
import { ensureProfileForUser, getDefaultRouteForRole } from "@/lib/auth";
import type {
  DashboardAgent,
  DashboardChatHistory,
  DashboardConversation,
  DashboardWorkflow,
  DashboardWorkflowExecution,
} from "@/lib/dashboard";
import { createServerSupabaseClient } from "@/lib/supabase";
import { listOwnedWorkflows, listWorkflowExecutionHistory } from "@/lib/workflows";

import { DashboardClient } from "./_components/dashboard-client";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Ejecuta tus agentes y revisa los resultados guardados.",
};

function buildChatHistory(
  executions: Awaited<ReturnType<typeof listExecutionHistory>>,
) {
  return executions.reduce<DashboardChatHistory>((history, execution) => {
    if (!execution.conversationId) {
      return history;
    }

    const nextMessages = [...(history[execution.conversationId] ?? [])];

    if (execution.input) {
      nextMessages.push({
        id: `${execution.id}-input`,
        conversationId: execution.conversationId,
        role: "user",
        content: execution.input,
        timestamp: execution.createdAt,
        executionStatus: execution.status,
      });
    }

    if (execution.output) {
      nextMessages.push({
        id: `${execution.id}-output`,
        conversationId: execution.conversationId,
        role: "assistant",
        content: execution.output,
        timestamp: execution.createdAt,
        executionStatus: execution.status,
      });
    }

    history[execution.conversationId] = nextMessages;
    return history;
  }, {});
}

function extractTextFromJson(value: unknown) {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (
    typeof value === "object" &&
    value !== null &&
    "text" in value &&
    typeof value.text === "string"
  ) {
    return value.text;
  }

  return JSON.stringify(value, null, 2);
}

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await ensureProfileForUser(user);

  if (profile.role === "admin") {
    redirect(getDefaultRouteForRole(profile.role));
  }

  const [
    agents,
    conversations,
    executionHistory,
    workflows,
    workflowExecutions,
  ] = await Promise.all([
    listAccessibleAgents(profile.id),
    listAgentConversations(profile.id),
    listExecutionHistory(profile.id),
    listOwnedWorkflows(profile.id),
    listWorkflowExecutionHistory(profile.id),
  ]);

  const dashboardAgents: DashboardAgent[] = agents.map((agent) => ({
    id: agent.id,
    slug: agent.slug,
    name: agent.name,
    shortDescription: agent.short_description ?? "Agente listo para ejecutarse.",
    description: agent.description ?? agent.short_description ?? "",
    totalRuns: agent.total_runs,
    ownerType: agent.owner_type,
    ownerLabel: agent.ownerLabel,
  }));
  const dashboardConversations: DashboardConversation[] = conversations;
  const dashboardWorkflows: DashboardWorkflow[] = workflows.map((workflow) => ({
    id: workflow.id,
    slug: workflow.slug,
    name: workflow.name,
    shortDescription: workflow.shortDescription,
    description: workflow.description,
    deliverable: workflow.deliverable,
    includedAgents: workflow.includedAgents,
    steps: workflow.steps.map((step) => ({
      id: step.id,
      position: step.position,
      title: step.title,
      stepKey: step.step_key,
      agentSlug: step.agent_slug,
    })),
  }));
  const dashboardWorkflowExecutions: DashboardWorkflowExecution[] =
    workflowExecutions.map((execution) => ({
      id: execution.id,
      workflowId: execution.workflowId,
      workflowSlug: execution.workflowSlug,
      workflowName: execution.workflowName,
      status: execution.status,
      startedAt: execution.startedAt,
      completedAt: execution.completedAt,
      finalOutputText: extractTextFromJson(execution.finalOutput),
      stepRuns: execution.stepRuns.map((stepRun) => ({
        id: stepRun.id,
        stepKey: stepRun.stepKey,
        title: stepRun.title,
        agentSlug: stepRun.agentSlug,
        status: stepRun.status,
        outputText: extractTextFromJson(stepRun.outputData),
      })),
    }));

  return (
    <DashboardClient
      agents={dashboardAgents}
      workflows={dashboardWorkflows}
      initialWorkflowExecutions={dashboardWorkflowExecutions}
      initialConversations={dashboardConversations}
      initialChatHistory={buildChatHistory(executionHistory)}
      userEmail={user.email}
    />
  );
}
