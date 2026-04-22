import Link from "next/link";
import { notFound } from "next/navigation";

import { getPublishedAgentBySlug, listOwnedAgentIds } from "@/ai/agent-runner";
import { getAgentReviewComposer, listAgentReviews } from "@/ai/agent-reviews";
import { SiteHeader } from "@/components/layout/site-header";
import { getCurrentProfile } from "@/lib/auth";
import { featuredAgents, getAgentBySlug } from "@/lib/agents";
import { supabaseAdmin } from "@/lib/supabase";
import { AgentDetailClient } from "./agent-detail-client";

type AgentDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

const genericBenefits = [
  {
    icon: "*",
    title: "Listo para usarse en Miunix.",
    description:
      "El agente ya paso por revision y puede activarse desde el marketplace como una opcion publicada.",
  },
  {
    icon: "+",
    title: "Enfocado en una tarea clara.",
    description:
      "Su prompt y configuracion se evaluaron para entregar una experiencia concreta y util.",
  },
  {
    icon: ">",
    title: "Mantenido dentro del ecosistema.",
    description:
      "Si deja de cumplir el estandar de Miunix, el equipo puede retirarlo del marketplace.",
  },
] as const;

export function generateStaticParams() {
  return featuredAgents.map((agent) => ({ slug: agent.slug }));
}

async function getOwnerLabel(ownerProfileId: string | null, ownerType: string) {
  if (ownerType === "platform") return "Miunix";
  if (!ownerProfileId) return "Developer";

  const profileResult = await supabaseAdmin
    .from("profiles")
    .select("full_name, email")
    .eq("id", ownerProfileId)
    .maybeSingle();

  if (profileResult.error) return "Developer";
  return profileResult.data?.full_name ?? profileResult.data?.email ?? "Developer";
}

export default async function AgentDetailPage({ params }: AgentDetailPageProps) {
  const { slug } = await params;
  const featuredAgent = getAgentBySlug(slug);
  const publishedAgent = await getPublishedAgentBySlug(slug);

  if (!publishedAgent) notFound();

  const profile = await getCurrentProfile();
  const [ownedAgentIds, reviewComposer, reviews, ownerLabel] = await Promise.all([
    profile ? listOwnedAgentIds(profile.id) : Promise.resolve(new Set<string>()),
    getAgentReviewComposer(publishedAgent.id, profile?.id),
    listAgentReviews(publishedAgent.id, profile?.id),
    getOwnerLabel(publishedAgent.owner_profile_id, publishedAgent.owner_type),
  ]);

  const averageRating = Number(publishedAgent.average_rating);
  const detailTitle = featuredAgent?.title ?? publishedAgent.name;
  const heroDescription =
    featuredAgent?.heroDescription ??
    publishedAgent.description ??
    publishedAgent.short_description ??
    "Agente publicado por un developer dentro del marketplace de Miunix.";
  const priceLabel =
    featuredAgent?.priceLabel ??
    (publishedAgent.pricing_type === "free"
      ? "Acceso inmediato gratis"
      : `Compra por $${Number(publishedAgent.price ?? 0).toFixed(2)}`);
  const conversationsLabel = featuredAgent?.conversationsLabel ?? `by ${ownerLabel}`;
  const benefits = featuredAgent?.benefits ?? genericBenefits;

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <section className="mx-auto flex min-h-screen w-full max-w-[1280px] flex-col px-5 py-5 sm:px-8 sm:py-7">
        <div className="flex min-h-[calc(100vh-2.5rem)] flex-1 flex-col rounded-[2rem] border border-white/8 bg-[#080808] px-5 py-5 shadow-[0_30px_120px_rgba(0,0,0,0.55)] sm:px-8 sm:py-7 lg:px-10 lg:py-8">
          <div className="rounded-[1.5rem] border border-[#8f23ff] px-4 py-4 sm:px-6">
            <SiteHeader currentPath="/marketplace" />
          </div>

          <AgentDetailClient
            slug={slug}
            featuredAgent={featuredAgent ?? null}
            publishedAgent={{
              id: publishedAgent.id,
              total_reviews: publishedAgent.total_reviews,
              owner_type: publishedAgent.owner_type,
              tool_definitions: publishedAgent.tool_definitions,
            }}
            detailTitle={detailTitle}
            ownerLabel={ownerLabel}
            averageRating={averageRating}
            heroDescription={heroDescription}
            priceLabel={priceLabel}
            conversationsLabel={conversationsLabel}
            benefits={benefits}
            isAuthenticated={Boolean(profile)}
            initiallyOwned={ownedAgentIds.has(publishedAgent.id)}
            reviewComposer={reviewComposer}
            reviews={reviews}
          />
        </div>
      </section>
    </main>
  );
}
