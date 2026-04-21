import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { listAccessibleAgents } from "@/ai/agent-runner";
import {
  countCompletedAgentPurchases,
  countCompletedWorkflowPurchases,
  countPromptRuns,
  listPurchasedAgentsForAccount,
} from "@/lib/account";
import { getCurrentProfile, getDefaultRouteForRole } from "@/lib/auth";
import type { DashboardAccount } from "@/lib/dashboard";
import { getPremiumPlanDefinition } from "@/lib/premium";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

import { AccountPanel } from "./account-panel";

export const metadata: Metadata = {
  title: "Mi Cuenta",
  description: "Perfil, actividad y suscripciones de tu cuenta Miunix.",
};

type MiCuentaPageProps = {
  searchParams?: Promise<{
    message?: string;
    type?: "success" | "error";
  }>;
};

export default async function MiCuentaPage({ searchParams }: MiCuentaPageProps) {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  if (profile.role === "admin") {
    redirect(getDefaultRouteForRole(profile.role));
  }

  const [
    accessibleAgents,
    purchasedAgents,
    purchasedAgentCount,
    purchasedWorkflowCount,
    totalPromptRuns,
  ] = await Promise.all([
    listAccessibleAgents(profile.id),
    listPurchasedAgentsForAccount(profile.id),
    countCompletedAgentPurchases(profile.id),
    countCompletedWorkflowPurchases(profile.id),
    countPromptRuns(profile.id),
  ]);
  const params = searchParams ? await searchParams : undefined;
  const planDefinition = profile.premium_plan
    ? getPremiumPlanDefinition(profile.premium_plan)
    : null;
  const privateAgentCount = accessibleAgents.filter(
    (agent) => agent.owner_type === "user",
  ).length;
  const account: DashboardAccount = {
    profileName: profile.full_name ?? profile.email?.split("@")[0] ?? "Mi Perfil",
    email: profile.email,
    role: profile.role,
    isPremium: Boolean(profile.is_premium && profile.premium_plan),
    premiumPlanName: planDefinition?.name ?? null,
    premiumAgentLimit: profile.premium_agent_limit,
    premiumSince: profile.premium_since,
    privateAgentCount,
    purchasedAgentCount,
    purchasedWorkflowCount,
    totalPromptRuns,
    activeAgentCount: accessibleAgents.length,
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#09090b] text-white">
      <SiteHeader currentPath="/mi-cuenta" />
      <main className="relative z-10 mx-auto flex w-full max-w-[1280px] flex-1 flex-col px-5 sm:px-8">
        <AccountPanel
          account={account}
          purchasedAgents={purchasedAgents}
          flashMessage={params?.message}
          flashType={params?.type}
        />
      </main>
      <SiteFooter />
    </div>
  );
}
