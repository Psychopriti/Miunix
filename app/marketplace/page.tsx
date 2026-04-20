import { listAgents } from "@/ai/agent-runner";
import { SiteHeader } from "@/components/layout/site-header";
import { getAgentBySlug } from "@/lib/agents";
import { InView } from "@/components/ui/in-view";
import { MarketplaceHeading } from "./marketplace-heading";
import { MarketplaceCarousel } from "./marketplace-carousel";

export default async function MarketplacePage() {
  const publishedAgents = await listAgents();
  const marketplaceItems = publishedAgents.map((agent) => {
    const builtInAgent = getAgentBySlug(agent.slug);

    return {
      slug: agent.slug,
      title: builtInAgent?.title ?? agent.name,
      description:
        agent.short_description ??
        builtInAgent?.shortDescription ??
        "Agente publicado en Miunix.",
      ownerLabel: agent.ownerLabel,
      averageRating: Number(agent.average_rating),
      totalReviews: agent.total_reviews,
      variant: (builtInAgent?.slug ?? "developer") as
        | "lead-generation"
        | "marketing-content"
        | "research"
        | "developer",
    };
  });

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <section className="mx-auto flex min-h-screen w-full max-w-[1280px] flex-col px-5 py-5 sm:px-8 sm:py-7">
        <div className="flex min-h-[calc(100vh-2.5rem)] flex-1 flex-col rounded-[2rem] border border-white/8 bg-[#080808] px-5 py-5 shadow-[0_30px_120px_rgba(0,0,0,0.55)] sm:px-8 sm:py-7 lg:px-10 lg:py-8">
          <SiteHeader currentPath="/marketplace" />

          <section className="flex flex-1 flex-col items-center justify-center pb-6 pt-12 sm:pt-16">
            <MarketplaceHeading />

            {marketplaceItems.length === 0 ? (
              <InView
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 },
                }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                viewOptions={{ once: true }}
              >
                <div className="mt-12 w-full max-w-2xl rounded-[1.5rem] border border-dashed border-white/12 bg-white/[0.02] px-6 py-8 text-center text-sm leading-6 text-white/58">
                  Todavia no hay agentes publicados en el marketplace.
                </div>
              </InView>
            ) : (
              <MarketplaceCarousel items={marketplaceItems} />
            )}
          </section>
        </div>
      </section>
    </main>
  );
}
