import type { Metadata } from "next";

import { MarketingPageShell } from "@/components/marketing/marketing-page-shell";
import { getCurrentProfile } from "@/lib/auth";
import {
  formatWorkflowPriceLabel,
  listPublishedWorkflows,
} from "@/lib/workflows";
import { WorkflowsContent } from "./workflows-content";

export const metadata: Metadata = {
  title: "Workflows",
  description: "Paquetes de workflows y agentes para necesidades concretas.",
};

export default async function WorkflowsPage() {
  const profile = await getCurrentProfile();
  const workflows = await listPublishedWorkflows(profile?.id ?? null);

  return (
    <MarketingPageShell currentPath="/workflows">
      <WorkflowsContent
        isAuthenticated={Boolean(profile)}
        workflows={workflows.map((workflow) => ({
          id: workflow.id,
          slug: workflow.slug,
          name: workflow.name,
          shortDescription: workflow.shortDescription,
          description: workflow.description,
          priceLabel: formatWorkflowPriceLabel(workflow),
          accessState: workflow.accessState,
          includedAgents: workflow.includedAgents,
          steps: workflow.steps.map((step) => ({
            id: step.id,
            position: step.position,
            title: step.title,
            stepKey: step.step_key,
            agentSlug: step.agent_slug,
          })),
          deliverable: workflow.deliverable,
          benefits: workflow.benefits,
        }))}
      />
    </MarketingPageShell>
  );
}
