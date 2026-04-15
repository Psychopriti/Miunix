import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { SiteHeader } from "@/components/layout/site-header";
import { MarketplaceCard } from "@/components/marketing/marketplace-card";
import { listMarketplaceDevelopers } from "@/lib/developer-marketplace";
import { DeveloperDetailClient } from "./developer-detail-client";

type DeveloperDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

const developerBenefits = [
  {
    icon: "*",
    title: "Agentes ya aprobados.",
    description:
      "Todo lo que aparece aqui ya fue revisado y aprobado antes de publicarse en Miunix.",
  },
  {
    icon: "+",
    title: "Perfil publico del developer.",
    description:
      "La pagina concentra los agentes publicados de cada developer para que sea mas facil explorarlos.",
  },
  {
    icon: ">",
    title: "Curacion continua.",
    description:
      "Si un agente deja de cumplir el estandar, Miunix puede retirarlo del marketplace.",
  },
] as const;

export async function generateStaticParams() {
  const developers = await listMarketplaceDevelopers();
  return developers.map((developer) => ({ slug: developer.slug }));
}

export default async function DeveloperDetailPage({
  params,
}: DeveloperDetailPageProps) {
  const { slug } = await params;
  const developers = await listMarketplaceDevelopers();
  const developer = developers.find((item) => item.slug === slug);

  if (!developer) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <section className="mx-auto flex min-h-screen w-full max-w-[1280px] flex-col px-5 py-5 sm:px-8 sm:py-7">
        <div className="flex min-h-[calc(100vh-2.5rem)] flex-1 flex-col rounded-[2rem] border border-white/8 bg-[#080808] px-5 py-5 shadow-[0_30px_120px_rgba(0,0,0,0.55)] sm:px-8 sm:py-7 lg:px-10 lg:py-8">
          <div className="rounded-[1.5rem] border border-[#8f23ff] px-4 py-4 sm:px-6">
            <SiteHeader currentPath="/developers" />
          </div>

          <DeveloperDetailClient
            developer={developer}
            developerBenefits={developerBenefits}
          />
        </div>
      </section>
    </main>
  );
}
