import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Star } from "lucide-react";
import { getPublishedAgentBySlug, listOwnedAgentIds } from "@/ai/agent-runner";
import { getAgentReviewComposer, listAgentReviews } from "@/ai/agent-reviews";
import { SiteHeader } from "@/components/layout/site-header";
import { getCurrentProfile } from "@/lib/auth";
import { featuredAgents, getAgentBySlug } from "@/lib/agents";
import { AgentAcquireButton } from "./agent-acquire-button";
import { AgentReviewsSection } from "./agent-reviews-section";

type AgentDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return featuredAgents.map((agent) => ({ slug: agent.slug }));
}

export default async function AgentDetailPage({
  params,
}: AgentDetailPageProps) {
  const { slug } = await params;
  const agent = getAgentBySlug(slug);

  if (!agent) {
    notFound();
  }

  const publishedAgent = await getPublishedAgentBySlug(agent.slug);

  if (!publishedAgent) {
    notFound();
  }

  const profile = await getCurrentProfile();
  const [ownedAgentIds, reviewComposer, reviews] = await Promise.all([
    profile ? listOwnedAgentIds(profile.id) : Promise.resolve(new Set<string>()),
    getAgentReviewComposer(publishedAgent.id, profile?.id),
    listAgentReviews(publishedAgent.id, profile?.id),
  ]);
  const averageRating = Number(publishedAgent.average_rating);

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <section className="mx-auto flex min-h-screen w-full max-w-[1280px] flex-col px-5 py-5 sm:px-8 sm:py-7">
        <div className="flex min-h-[calc(100vh-2.5rem)] flex-1 flex-col rounded-[2rem] border border-white/8 bg-[#080808] px-5 py-5 shadow-[0_30px_120px_rgba(0,0,0,0.55)] sm:px-8 sm:py-7 lg:px-10 lg:py-8">
          <div className="rounded-[1.5rem] border border-[#8f23ff] px-4 py-4 sm:px-6">
            <SiteHeader currentPath="/marketplace" />
          </div>

          <section className="flex flex-1 flex-col justify-center gap-8 pb-4 pt-9 sm:pt-11">
            <div className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-[linear-gradient(90deg,#d8ff17_0%,#edf0d1_44%,#8f90ff_100%)] px-6 py-7 shadow-[0_20px_45px_rgba(0,0,0,0.2)] sm:px-10 sm:py-10">
              <div className="absolute -left-10 top-1/2 h-32 w-32 -translate-y-1/2 rounded-full bg-[#d8ff17]/45 blur-3xl" />
              <div className="absolute right-0 top-0 h-full w-1/3 bg-[radial-gradient(circle_at_60%_40%,rgba(255,255,255,0.35),transparent_38%)]" />

              <div className="flex items-end justify-between gap-6">
                <div className="relative mt-14 flex size-[7.8rem] items-center justify-center rounded-full border-[5px] border-white bg-[#07282d] shadow-[0_12px_30px_rgba(0,0,0,0.24)] sm:size-[8.8rem]">
                  <div className="scale-[1.55]">{agent.icon}</div>
                </div>
                <Link
                  href="/marketplace"
                  className="inline-flex items-center gap-2 rounded-full bg-black/18 px-4 py-2 text-xs font-medium text-white/90 backdrop-blur transition hover:bg-black/26"
                >
                  <ArrowLeft className="size-4" />
                  Volver al marketplace
                </Link>
              </div>
            </div>

            <div className="grid gap-10 lg:grid-cols-[1.1fr_0.7fr] lg:items-start">
              <div>
                <h1 className="max-w-3xl text-balance text-[2.7rem] font-medium leading-[0.95] tracking-[-0.065em] text-white sm:text-[4rem]">
                  {agent.title}
                </h1>
                <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-white/70">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">
                    <Star className="size-4 fill-[#d9ff00] text-[#d9ff00]" />
                    <span>
                      {publishedAgent.total_reviews > 0
                        ? `${averageRating.toFixed(1)} de 5`
                        : "Sin rating aun"}
                    </span>
                  </div>
                  <span className="text-white/40">
                    {publishedAgent.total_reviews} review
                    {publishedAgent.total_reviews === 1 ? "" : "s"} publicadas
                  </span>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  {agent.benefits.map((benefit) => (
                    <article
                      key={benefit.title}
                      className="rounded-[0.45rem] border border-white/10 bg-[linear-gradient(180deg,#1a1d37_0%,#1d2244_100%)] px-5 py-6 shadow-[0_16px_32px_rgba(0,0,0,0.18)]"
                    >
                      <div className="text-center text-lg text-white/85">
                        {benefit.icon}
                      </div>
                      <h2 className="mt-5 text-center text-[0.82rem] font-medium leading-tight text-white">
                        {benefit.title}
                      </h2>
                      <p className="mt-4 text-[0.64rem] leading-[1.5] text-white/75">
                        {benefit.description}
                      </p>
                    </article>
                  ))}
                </div>
              </div>

              <aside className="justify-self-center lg:justify-self-end">
                <div className="relative w-full max-w-[19rem]">
                  <div className="overflow-hidden rounded-[45%_45%_36%_36%/32%_32%_18%_18%] border border-[#d8d0bb] bg-[linear-gradient(180deg,#fbf3e7_0%,#d8c4af_55%,#7a4d2e_100%)] shadow-[0_28px_50px_rgba(0,0,0,0.28)]">
                    <div className="relative aspect-[0.8] w-full">
                      <div className="absolute left-[18%] top-[14%] h-[70%] w-[26%] rounded-[40%] bg-[linear-gradient(180deg,#0d0e16,#1f212a)]" />
                      <div className="absolute left-[32%] top-[8%] h-[84%] w-[23%] rounded-[45%] bg-[linear-gradient(180deg,#462e1f,#1a1412)]" />
                      <div className="absolute left-[40%] top-[15%] h-[64%] w-[15%] rounded-[0.9rem] bg-[linear-gradient(180deg,#ecd1a2,#735642)]" />
                      <div className="absolute right-[9%] top-[16%] h-[30%] w-[25%] rounded-[0.8rem] bg-[linear-gradient(180deg,#f8f5f1,#d4d0c9)] shadow-[0_10px_18px_rgba(0,0,0,0.1)]" />
                      <div className="absolute bottom-[10%] left-[18%] h-[26%] w-[45%] rotate-[8deg] rounded-[0.8rem] bg-[linear-gradient(180deg,#f5efe5,#b9a693)]" />
                      <div className="absolute bottom-[22%] left-[38%] h-[24%] w-[15%] rotate-[18deg] rounded-[1rem] bg-[linear-gradient(180deg,#0f1117,#2b2c36)] shadow-[0_10px_18px_rgba(0,0,0,0.2)]" />
                      <div className="absolute bottom-0 right-0 h-[18%] w-full bg-[linear-gradient(180deg,transparent,#8b542d)]" />
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_28%,rgba(255,255,255,0.5),transparent_16%),radial-gradient(circle_at_55%_60%,rgba(0,0,0,0.2),transparent_20%)]" />
                    </div>
                  </div>

                  <AgentAcquireButton
                    agentId={publishedAgent.id}
                    agentSlug={agent.slug}
                    agentName={agent.title}
                    isAuthenticated={Boolean(profile)}
                    initiallyOwned={ownedAgentIds.has(publishedAgent.id)}
                  />
                </div>

                <div className="mt-6 space-y-1 text-left">
                  <p className="text-[1.45rem] font-semibold leading-tight text-white">
                    {agent.conversationsLabel}
                  </p>
                  <p className="text-[1.45rem] font-semibold leading-tight text-white">
                    {agent.priceLabel}
                  </p>
                  <p className="mt-5 max-w-[18rem] text-sm leading-6 text-white/76">
                    {agent.heroDescription}
                  </p>
                </div>
              </aside>
            </div>

            <AgentReviewsSection
              agentId={publishedAgent.id}
              agentName={agent.title}
              averageRating={averageRating}
              totalReviews={publishedAgent.total_reviews}
              reviews={reviews}
              existingReview={reviewComposer.existingReview}
              isAuthenticated={Boolean(profile)}
              canReview={reviewComposer.canReview}
              hasPurchased={reviewComposer.hasPurchased}
            />
          </section>
        </div>
      </section>
    </main>
  );
}
