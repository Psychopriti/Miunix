import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { listAccessibleAgents, listExecutionHistory } from "@/ai/agent-runner";
import { ensureProfileForUser } from "@/lib/auth";
import type {
  DashboardAgent,
  DashboardChatHistory,
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
    const nextMessages = [...(history[execution.agentSlug] ?? [])];

    if (execution.input) {
      nextMessages.push({
        id: `${execution.id}-input`,
        role: "user",
        content: execution.input,
        timestamp: execution.createdAt,
        executionStatus: execution.status,
      });
    }

    if (execution.output) {
      nextMessages.push({
        id: `${execution.id}-output`,
        role: "assistant",
        content: execution.output,
        timestamp: execution.createdAt,
        executionStatus: execution.status,
      });
    }

    history[execution.agentSlug] = nextMessages;
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
  const [agents, executionHistory] = await Promise.all([
    listAccessibleAgents(profile.id),
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

  return (
    <DashboardClient
      agents={dashboardAgents}
      initialChatHistory={buildChatHistory(executionHistory)}
      userEmail={user.email}
    />
  );
}
