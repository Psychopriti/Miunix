"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles, Star } from "lucide-react";
import { motion } from "motion/react";

import { Button } from "@/components/ui/button";

type MarketplaceCardProps = {
  title: string;
  description: string;
  ownerLabel: string;
  variant: "lead-generation" | "marketing-content" | "research" | "developer";
  href: string;
  averageRating: number;
  totalReviews: number;
};

/**
 * Colores del gradiente animado por variante (c1 = bottom, c2 = top).
 * El keyframe card-border-shift mueve el background-position de arriba a abajo,
 * lo que hace que el gradiente parezca "fluir".
 */
const variantGradient: Record<
  MarketplaceCardProps["variant"],
  { c1: string; c2: string }
> = {
  "lead-generation": { c1: "#00e5ff", c2: "#0044ff" },
  "marketing-content": { c1: "#d9ff00", c2: "#00cc88" },
  research: { c1: "#00ffcc", c2: "#ff2255" },
  developer: { c1: "#8f90ff", c2: "#d9ff00" },
};

function MarketplaceCardIcon({
  variant,
}: {
  variant: MarketplaceCardProps["variant"];
}) {
  if (variant === "lead-generation") {
    return (
      <div className="relative h-10 w-10">
        <div className="absolute left-0 top-1 h-8 w-4 bg-[linear-gradient(180deg,#3bc7dd,#173580)]" />
        <div className="absolute left-4 top-3 h-5 w-5 border border-white/60 bg-transparent" />
        <div className="absolute left-1 top-5 h-2 w-8 bg-[linear-gradient(90deg,#072b30,#6ee0bf)]" />
      </div>
    );
  }
  if (variant === "marketing-content") {
    return (
      <div className="relative h-10 w-10">
        <div className="absolute inset-x-1 top-1 h-4 rotate-[1deg] bg-[linear-gradient(180deg,#f3dd8c,#689a84)] [clip-path:polygon(50%_0%,100%_52%,50%_100%,0%_52%)]" />
        <div className="absolute inset-x-1 top-4 h-4 bg-[linear-gradient(180deg,#24494b,#7dd5b2)] [clip-path:polygon(50%_0%,100%_52%,50%_100%,0%_52%)] opacity-90" />
        <div className="absolute inset-x-2 top-7 h-2 border border-white/50 [clip-path:polygon(50%_0%,100%_52%,50%_100%,0%_52%)]" />
      </div>
    );
  }
  if (variant === "research") {
    return (
      <div className="relative h-10 w-10">
        <div className="absolute left-2 top-0 h-6 w-6 rotate-45 border border-white/80" />
        <div className="absolute bottom-1 left-0 h-4 w-5 bg-[#f04e37]" />
        <div className="absolute bottom-1 right-0 h-4 w-5 bg-[linear-gradient(90deg,#0f6d63,#1fd7bd)]" />
      </div>
    );
  }
  return <Sparkles className="size-5 text-[#d9ff00]" />;
}

export function MarketplaceCard({
  title,
  description,
  ownerLabel,
  variant,
  href,
  averageRating,
  totalReviews,
}: MarketplaceCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const { c1, c2 } = variantGradient[variant];

  // Estilo compartido: gradiente que se anima (replica el ::before/::after del CodePen)
  const gradientStyle: React.CSSProperties = {
    backgroundImage: `linear-gradient(0deg, ${c1}, ${c2})`,
    backgroundSize: "100% 200%",
    backgroundPosition: "center center",
    animation: "card-border-shift 3s ease infinite alternate",
  };

  return (
    /**
     * El wrapper actúa como el .card del CodePen.
     * Los dos divs dentro son los ::before y ::after — el segundo tiene blur enorme.
     * La motion.article tiene bg propio que cubre el centro, dejando solo
     * los 3px del borde visibles con el gradiente de color.
     */
    <div className="relative">
      {/* ── ::before — borde de gradiente fino (3px alrededor de la card) ── */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-[3px] rounded-[2rem]"
        style={{
          ...gradientStyle,
          opacity: isHovered ? 1 : 0,
          transition: "opacity 0.45s ease",
        }}
      />

      {/* ── ::after — mismo gradiente pero con blur ENORME (125-150px).
               Esto es lo que crea el gran halo que se funde con el fondo negro. ── */}
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

      {/* ── Card principal (equivalente al .content del CodePen) ── */}
      <motion.article
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        whileHover={{ y: -8, scale: 1.02 }}
        transition={{ type: "spring", stiffness: 320, damping: 26 }}
        className="relative flex min-h-[26rem] flex-col items-center rounded-[calc(2rem-3px)] border border-white/10 bg-[linear-gradient(180deg,#8b8b90_0%,#5b5b72_62%,#43436d_100%)] px-6 pb-7 pt-8 text-center shadow-[0_24px_60px_rgba(0,0,0,0.35)]"
      >
        {/* Icono con leve escala en hover */}
        <motion.div
          animate={isHovered ? { scale: 1.12 } : { scale: 1 }}
          transition={{ type: "spring", stiffness: 320, damping: 22 }}
          className="flex size-[4.6rem] items-center justify-center rounded-full bg-[#08282c] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]"
        >
          <MarketplaceCardIcon variant={variant} />
        </motion.div>

        <h2 className="mt-6 text-balance text-[2rem] font-medium leading-[0.92] tracking-[-0.05em] text-white">
          {title}
        </h2>

        <p className="mt-5 max-w-[14rem] text-[0.7rem] leading-[1.55] text-white/88">
          {description}
        </p>

        <p className="mt-3 text-[0.72rem] uppercase tracking-[0.18em] text-white/58">
          by {ownerLabel}
        </p>

        <div className="mt-5 flex items-center gap-2 rounded-full border border-white/10 bg-black/15 px-3 py-1.5 text-xs text-white/78">
          <Star className="size-3.5 fill-[#d9ff00] text-[#d9ff00]" />
          <span>
            {totalReviews > 0
              ? `${averageRating.toFixed(1)} · ${totalReviews} review${totalReviews === 1 ? "" : "s"}`
              : "Sin reviews"}
          </span>
        </div>

        <motion.div
          className="mt-auto w-full"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <Button
            asChild
            className="h-auto w-full rounded-full border border-white/10 bg-white/20 px-5 py-3 text-[0.68rem] font-medium text-white backdrop-blur hover:bg-white/28"
          >
            <Link href={href}>Try for Free</Link>
          </Button>
        </motion.div>
      </motion.article>
    </div>
  );
}
