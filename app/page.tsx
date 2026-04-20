import { HeroSection } from "@/app/_components/hero-section";
import { FeaturesSection } from "@/app/_components/features-section";
import { SiteHeader } from "@/components/layout/site-header";

export default function Home() {
  return (
    <main className="bg-[#050505] text-white">
      <section className="mx-auto w-full max-w-[1280px] px-5 py-5 sm:px-8 sm:py-7">
        <div className="flex min-h-screen flex-col rounded-[2rem] border border-white/8 bg-[#080808] px-5 py-5 shadow-[0_30px_120px_rgba(0,0,0,0.55)] sm:px-8 sm:py-7 lg:px-10 lg:py-8">
          <SiteHeader currentPath="/" />
          <HeroSection />
        </div>
      </section>

      <FeaturesSection />
    </main>
  );
}
