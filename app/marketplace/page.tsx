import { ChevronLeft, ChevronRight } from "lucide-react";

import { listAgents } from "@/ai/agent-runner";
import { SiteHeader } from "@/components/layout/site-header";
import { MarketplaceCard } from "@/components/marketing/marketplace-card";
import { featuredAgents } from "@/lib/agents";

export default async function MarketplacePage() {
  const publishedAgents = await listAgents();
  const agentsBySlug = new Map(
    publishedAgents.map((agent) => [agent.slug, agent] as const),
  );

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <section className="mx-auto flex min-h-screen w-full max-w-[1280px] flex-col px-5 py-5 sm:px-8 sm:py-7">
        <div className="flex min-h-[calc(100vh-2.5rem)] flex-1 flex-col rounded-[2rem] border border-white/8 bg-[#080808] px-5 py-5 shadow-[0_30px_120px_rgba(0,0,0,0.55)] sm:px-8 sm:py-7 lg:px-10 lg:py-8">
          <SiteHeader currentPath="/marketplace" />

          <section className="flex flex-1 flex-col items-center justify-center pb-6 pt-12 sm:pt-16">
            <h1 className="font-heading text-center text-[2.65rem] uppercase leading-none tracking-[-0.04em] text-white sm:text-[4.1rem]">
              Agentes Destacados
            </h1>

            <div className="mt-12 grid w-full gap-8 lg:grid-cols-3 lg:gap-16">
              {featuredAgents.flatMap((agent) => {
                const publishedAgent = agentsBySlug.get(agent.slug);

                if (!publishedAgent) {
                  return [];
                }

                return [
                  <MarketplaceCard
                    key={agent.title}
                    title={agent.title}
                    description={
                      publishedAgent.short_description ?? agent.shortDescription
                    }
                    icon={agent.icon}
                    href={`/marketplace/${agent.slug}`}
                    averageRating={Number(publishedAgent.average_rating)}
                    totalReviews={publishedAgent.total_reviews}
                  />,
                ];
              })}
            </div>

            <div className="mt-8 flex items-center gap-2 text-sm text-[#b891e9]">
              <span className="text-base">✦</span>
              <span>Arrow ...</span>
            </div>

            <div className="mt-5 flex items-center gap-4">
              <button
                type="button"
                aria-label="Anterior"
                className="flex size-9 items-center justify-center rounded-lg bg-white text-black transition hover:bg-white/85"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                type="button"
                aria-label="Siguiente"
                className="flex size-9 items-center justify-center rounded-lg bg-[#e6f8ca] text-black transition hover:bg-[#f0ffdc]"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
