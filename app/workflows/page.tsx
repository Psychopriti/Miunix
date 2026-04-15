import type { Metadata } from "next";

import { MarketingPageShell } from "@/components/marketing/marketing-page-shell";
import { WorkflowsContent } from "./workflows-content";
import { featuredAgents } from "@/lib/agents";

export const metadata: Metadata = {
  title: "Workflows",
  description: "Paquetes de workflows y agentes para necesidades concretas.",
};

export default function WorkflowsPage() {
  return (
    <MarketingPageShell currentPath="/workflows">
      <WorkflowsContent agents={featuredAgents} />
    </MarketingPageShell>
  );
}
