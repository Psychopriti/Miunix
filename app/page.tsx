import { SiteHeader } from "@/components/layout/site-header";
import { HeroSection } from "@/app/_components/hero-section";
import { HeroPanel } from "@/app/_components/hero-panel";
import { FeaturesSection } from "@/app/_components/features-section";

export default function Home() {
  return (
    <main className="bg-[#050505] text-white">
      {/*
        ── Hero ──────────────────────────────────────────────────────────────
        100vh wrapper gives the sticky panel one full viewport to "sit" before
        the features section starts scrolling up over it.
      */}
      <div className="h-screen">
        {/*
          HeroPanel is a Client Component that animates, but SiteHeader and
          HeroSection are Server Components passed as children so they keep
          access to server-only APIs (cookies, etc.).
        */}
        <HeroPanel>
          <SiteHeader currentPath="/" />
          <HeroSection />
        </HeroPanel>
      </div>

      {/*
        ── Features ──────────────────────────────────────────────────────────
        z-20 ensures it renders on top of the sticky hero panel as it scrolls.
        bg-[#050505] matches the page background so the gradient mask blends.
      */}
      <div className="relative z-20 bg-[#050505]">
        <FeaturesSection />
      </div>
    </main>
  );
}
