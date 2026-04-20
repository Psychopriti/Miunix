"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";

import { Button } from "@/components/ui/button";

type DeveloperMarketplaceCardProps = {
  name: string;
  role: string;
  description: string;
  initials: string;
  approvedAgentCount: number;
  href: string;
};

// Gradiente único para las cards de developers (morado → cian, brand colors)
const GLOW_C1 = "#8f90ff";
const GLOW_C2 = "#00e5ff";

export function DeveloperMarketplaceCard({
  name,
  role,
  description,
  initials,
  approvedAgentCount,
  href,
}: DeveloperMarketplaceCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const gradientStyle: React.CSSProperties = {
    backgroundImage: `linear-gradient(0deg, ${GLOW_C1}, ${GLOW_C2})`,
    backgroundSize: "100% 200%",
    backgroundPosition: "center center",
    animation: "card-border-shift 3s ease infinite alternate",
  };

  return (
    <div className="relative">
      {/* ::before — borde de gradiente fino */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-[3px] rounded-[2rem]"
        style={{
          ...gradientStyle,
          opacity: isHovered ? 1 : 0,
          transition: "opacity 0.45s ease",
        }}
      />

      {/* ::after — mismo gradiente con blur enorme (halo que se funde al fondo) */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-[3px] rounded-[2rem]"
        style={{
          ...gradientStyle,
          filter: "blur(130px)",
          opacity: isHovered ? 1 : 0,
          transition: "opacity 0.6s ease",
        }}
      />

      <motion.article
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        whileHover={{ y: -8, scale: 1.02 }}
        transition={{ type: "spring", stiffness: 320, damping: 26 }}
        className="relative flex min-h-[26rem] flex-col items-center rounded-[calc(2rem-3px)] border border-white/10 bg-[linear-gradient(180deg,#8b8b90_0%,#5b5b72_62%,#43436d_100%)] px-6 pb-7 pt-8 text-center shadow-[0_24px_60px_rgba(0,0,0,0.35)]"
      >
        {/* Avatar con escala en hover */}
        <motion.div
          animate={isHovered ? { scale: 1.1 } : { scale: 1 }}
          transition={{ type: "spring", stiffness: 320, damping: 22 }}
          className="flex size-[4.6rem] items-center justify-center overflow-hidden rounded-full bg-[linear-gradient(180deg,#8f90ff_0%,#4c4fa9_100%)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]"
        >
          <span className="text-xl font-semibold text-white">{initials}</span>
        </motion.div>

        <h2 className="mt-6 text-balance text-[2rem] font-medium leading-[0.92] tracking-[-0.05em] text-white">
          {name}
        </h2>

        <p className="mt-2 text-[0.68rem] uppercase tracking-[0.18em] text-white/56">
          {role}
        </p>

        <p className="mt-5 max-w-[14rem] text-[0.7rem] leading-[1.55] text-white/88">
          {description}
        </p>

        <p className="mt-3 text-[0.72rem] uppercase tracking-[0.18em] text-white/58">
          {approvedAgentCount} agente{approvedAgentCount === 1 ? "" : "s"}{" "}
          aprobado{approvedAgentCount === 1 ? "" : "s"}
        </p>

        <motion.div
          className="mt-auto w-full"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <Button
            asChild
            className="h-auto w-full rounded-full border border-white/10 bg-white/20 px-5 py-3 text-[0.68rem] font-medium text-white backdrop-blur hover:bg-white/28"
          >
            <Link href={href}>Ver perfil</Link>
          </Button>
        </motion.div>
      </motion.article>
    </div>
  );
}
