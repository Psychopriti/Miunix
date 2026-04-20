"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, useSpring } from "motion/react";

interface HeroPanelProps {
  children: React.ReactNode;
}

/**
 * HeroPanel — wraps the dark rounded card in a sticky sticky container.
 * As the user scrolls, the card shrinks (scale), fades (opacity) and
 * gently rises (y) revealing the FeaturesSection below.
 *
 * Accepts children so that Server Components (SiteHeader, HeroSection)
 * can be composed by the parent Server Component (page.tsx) and passed in.
 */
export function HeroPanel({ children }: HeroPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollY } = useScroll();

  // Input: px scrolled. Output: visual transform values.
  const inputRange = [0, 480];

  const rawScale   = useTransform(scrollY, inputRange, [1, 0.88]);
  const rawOpacity = useTransform(scrollY, inputRange, [1, 0.3]);
  const rawY       = useTransform(scrollY, inputRange, [0, -44]);
  const rawRadius  = useTransform(scrollY, inputRange, [32, 52]);

  // Springs for buttery-smooth easing
  const springCfg  = { stiffness: 85, damping: 20, mass: 0.55 };
  const scale        = useSpring(rawScale,   springCfg);
  const opacity      = useSpring(rawOpacity, springCfg);
  const y            = useSpring(rawY,       springCfg);
  const borderRadius = useSpring(rawRadius,  springCfg);

  return (
    /* sticky pin: stays at top while features scroll over it */
    <div
      ref={containerRef}
      className="sticky top-0 z-10 flex h-full flex-col px-5 py-5 sm:px-8 sm:py-7"
    >
      <motion.div
        style={{ scale, opacity, y, borderRadius }}
        className="
          flex flex-1 flex-col
          border border-white/8 bg-[#080808]
          px-5 py-5 will-change-transform
          shadow-[0_30px_120px_rgba(0,0,0,0.55)]
          sm:px-8 sm:py-7 lg:px-10 lg:py-8
        "
      >
        {children}
      </motion.div>
    </div>
  );
}
