import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { listAgentConversations } from "@/ai/agent-conversations";
import { listAccessibleAgents, listExecutionHistory } from "@/ai/agent-runner";
import { ensureProfileForUser } from "@/lib/auth";
import type {
  DashboardAgent,
  DashboardChatHistory,
  DashboardConversation,
} from "@/lib/dashboard";
import { createServerSupabaseClient } from "@/lib/supabase";

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

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await ensureProfileForUser(user);
  const [agents, conversations, executionHistory] = await Promise.all([
    listAccessibleAgents(profile.id),
    listAgentConversations(profile.id),
    listExecutionHistory(profile.id),
  ]);

  const dashboardAgents: DashboardAgent[] = agents.map((agent) => ({
    id: agent.id,
    slug: agent.slug,
    name: agent.name,
    shortDescription: agent.short_description ?? "Agente listo para ejecutarse.",
    description: agent.description ?? agent.short_description ?? "",
    totalRuns: agent.total_runs,
  }));
  const dashboardConversations: DashboardConversation[] = conversations;

  return (
    <DashboardClient
      agents={dashboardAgents}
      initialConversations={dashboardConversations}
      initialChatHistory={buildChatHistory(executionHistory)}
      userEmail={user.email}
    />
  );
}
