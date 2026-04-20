import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Gauge, LayoutTemplate, LockKeyhole } from "lucide-react";

import { SiteHeader } from "@/components/layout/site-header";
import { getCurrentProfile, getDefaultRouteForRole } from "@/lib/auth";
import {
  countPremiumAgents,
  ensurePremiumUserProfile,
  getPremiumPlanDefinition,
  listPremiumAgents,
} from "@/lib/premium";
import { CreatorStudio } from "./creator-studio";

export const metadata: Metadata = {
  title: "MIUNIX+ Center",
  description: "Centro privado para usuarios premium que crean agentes zero-code.",
};

type MiunixPlusCenterPageProps = {
  searchParams?: Promise<{
    message?: string;
    type?: "success" | "error";
  }>;
};

const centerHighlights = [
  {
    icon: LayoutTemplate,
    title: "DSL guiado",
    description:
      "Define objetivo, tono, flujo, restricciones y criterio de exito sin tocar codigo.",
  },
  {
    icon: LockKeyhole,
    title: "Agentes privados",
    description:
      "Tus agentes MIUNIX+ viven para tu cuenta y no aparecen en el marketplace.",
  },
  {
    icon: Gauge,
    title: "Listos para ejecutar",
    description:
      "Aparecen tambien en dashboard para que los uses en el mismo entorno.",
  },
];

export default async function MiunixPlusCenterPage({
  searchParams,
}: MiunixPlusCenterPageProps) {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  if (profile.role !== "user") {
    redirect(getDefaultRouteForRole(profile.role));
  }

  const premiumProfile = ensurePremiumUserProfile(profile);
  const activePlan = premiumProfile.premium_plan;

  if (!activePlan) {
    redirect("/miunix-plus");
  }

  const params = searchParams ? await searchParams : undefined;
  const [plan, agents, currentCount] = await Promise.all([
    Promise.resolve(getPremiumPlanDefinition(activePlan)),
    listPremiumAgents(premiumProfile.id),
    countPremiumAgents(premiumProfile.id),
  ]);

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <section className="mx-auto flex min-h-screen w-full max-w-[1280px] flex-col px-5 py-5 sm:px-8 sm:py-7">
        <div className="flex min-h-[calc(100vh-2.5rem)] flex-1 flex-col rounded-[2rem] border border-white/8 bg-[#080808] px-5 py-5 shadow-[0_30px_120px_rgba(0,0,0,0.55)] sm:px-8 sm:py-7 lg:px-10 lg:py-8">
          <SiteHeader currentPath="/miunix-plus-center" />

          <section className="flex flex-1 flex-col gap-8 pb-8 pt-10 sm:pt-14">
            <div className="grid gap-6 rounded-[1.8rem] border border-white/10 bg-[linear-gradient(125deg,#0f2d2f_0%,#123d28_38%,#d9ff00_100%)] px-6 py-7 text-white shadow-[0_20px_55px_rgba(0,0,0,0.24)] lg:grid-cols-[1.15fr_0.85fr] lg:px-8">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-white/55">
                  MIUNIX+ Center
                </p>
                <h1 className="mt-3 max-w-3xl text-balance text-[2.35rem] font-medium leading-[0.95] tracking-[-0.06em] sm:text-[3.4rem]">
                  Tu espacio premium para crear agentes privados sin codigo
                </h1>
                <p className="mt-4 max-w-2xl text-sm leading-6 text-white/78 sm:text-base">
                  Usa la plantilla guiada para convertir un proceso repetitivo
                  en un agente util, claro y ejecutable.
                </p>
              </div>

              <div className="grid gap-3">
                <div className="rounded-[1.2rem] border border-white/14 bg-black/20 px-5 py-5">
                  <p className="text-xs uppercase tracking-[0.22em] text-white/45">
                    Plan actual
                  </p>
                  <h2 className="mt-3 text-2xl font-medium text-[#d9ff00]">
                    {plan?.name ?? "MIUNIX+"}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-white/72">
                    {plan?.summary}
                  </p>
                  <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-white/42">
                      Uso del plan
                    </p>
                    <p className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-white">
                      {currentCount}/{premiumProfile.premium_agent_limit}
                    </p>
                    <p className="mt-2 text-sm text-white/68">
                      agentes activos o en borrador
                    </p>
                  </div>
                </div>

                {centerHighlights.map(({ icon: Icon, title, description }) => (
                  <article
                    key={title}
                    className="rounded-[1.1rem] border border-white/14 bg-black/20 px-4 py-4 backdrop-blur"
                  >
                    <div className="inline-flex rounded-full bg-white/10 p-2">
                      <Icon className="size-4" />
                    </div>
                    <h2 className="mt-3 text-sm font-semibold">{title}</h2>
                    <p className="mt-2 text-sm leading-5 text-white/68">
                      {description}
                    </p>
                  </article>
                ))}
              </div>
            </div>

            {params?.message ? (
              <div
                className={`rounded-[1rem] border px-4 py-3 text-sm ${
                  params.type === "error"
                    ? "border-[#ff7a7a]/30 bg-[#3a1111] text-[#ffd0d0]"
                    : "border-[#d9ff00]/20 bg-[#11190a] text-[#e9ff9a]"
                }`}
              >
                {params.message}
              </div>
            ) : null}

            <CreatorStudio
              agents={agents}
              currentCount={currentCount}
              agentLimit={premiumProfile.premium_agent_limit}
              plan={plan}
            />
          </section>
        </div>
      </section>
    </main>
  );
}
