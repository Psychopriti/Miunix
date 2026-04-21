import { HeroSection } from "@/app/_components/hero-section";
import { FeaturesSection } from "@/app/_components/features-section";
import { MiunixAssistantBubble } from "@/app/_components/miunix-assistant-bubble";
import { PageGradient } from "@/app/_components/page-gradient";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

export default function Home() {
  return (
    <div className="relative flex min-h-screen flex-col bg-[#09090b] text-white">
      {/* Full-page cursor-reactive gradient — fixed behind everything */}
      <PageGradient />

      {/* Sticky global header */}
      <SiteHeader currentPath="/" />

      {/* Main content */}
      <main className="relative z-10 flex flex-1 flex-col">
        {/* Hero */}
        <div className="mx-auto w-full max-w-[1280px] px-5 sm:px-8">
          <HeroSection />
        </div>

        {/* Features — gradient shows through */}
        <FeaturesSection />
      </main>

      {/* Public footer */}
      <SiteFooter />

      <MiunixAssistantBubble />
    </div>
  );
}
