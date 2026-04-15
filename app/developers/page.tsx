import { SiteHeader } from "@/components/layout/site-header";
import { listMarketplaceDevelopers } from "@/lib/developer-marketplace";
import { DevelopersHeading } from "./developers-heading";
import { DevelopersCarousel } from "./developers-carousel";
import { InView } from "@/components/ui/in-view";

export default async function DevelopersPage() {
  const developers = await listMarketplaceDevelopers();

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <section className="mx-auto flex min-h-screen w-full max-w-[1280px] flex-col px-5 py-5 sm:px-8 sm:py-7">
        <div className="flex min-h-[calc(100vh-2.5rem)] flex-1 flex-col rounded-[2rem] border border-white/8 bg-[#080808] px-5 py-5 shadow-[0_30px_120px_rgba(0,0,0,0.55)] sm:px-8 sm:py-7 lg:px-10 lg:py-8">
          <SiteHeader currentPath="/developers" />

          <section className="flex flex-1 flex-col items-center justify-center pb-6 pt-12 sm:pt-16">
            <DevelopersHeading />

            {developers.length === 0 ? (
              <InView
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 },
                }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                viewOptions={{ once: true }}
              >
                <div className="mt-12 w-full max-w-2xl rounded-[1.5rem] border border-dashed border-white/12 bg-white/[0.02] px-6 py-8 text-center text-sm leading-6 text-white/58">
                  Todavia no hay developers con agentes aprobados en el
                  marketplace.
                </div>
              </InView>
            ) : (
              <DevelopersCarousel developers={developers} />
            )}
          </section>
        </div>
      </section>
    </main>
  );
}
