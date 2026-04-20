"use client";

import { motion } from "motion/react";
import { ShoppingBag, Zap, Play, Sparkles } from "lucide-react";

// ─── Feature data ────────────────────────────────────────────────────────────

const features = [
  {
    id: "marketplace",
    icon: ShoppingBag,
    title: "Marketplace de Agentes",
    description:
      "Explora y elige entre docenas de agentes listos para usar.",
    // accent colours (icon bg, glow, border tint)
    iconBg: "rgba(143, 144, 255, 0.15)",
    iconColor: "#8f90ff",
    glowColor: "rgba(143, 144, 255, 0.18)",
    borderHover: "rgba(143, 144, 255, 0.35)",
  },
  {
    id: "one-click",
    icon: Zap,
    title: "Instalación en 1 Clic",
    description: "Agrega cualquier agente a tu cuenta en segundos.",
    iconBg: "rgba(217, 255, 0, 0.12)",
    iconColor: "#d9ff00",
    glowColor: "rgba(217, 255, 0, 0.14)",
    borderHover: "rgba(217, 255, 0, 0.30)",
  },
  {
    id: "instant-run",
    icon: Play,
    title: "Ejecución Instantánea",
    description: "Obtén resultados en minutos sin complicaciones.",
    iconBg: "rgba(143, 144, 255, 0.15)",
    iconColor: "#8f90ff",
    glowColor: "rgba(143, 144, 255, 0.18)",
    borderHover: "rgba(143, 144, 255, 0.35)",
  },
  {
    id: "no-code",
    icon: Sparkles,
    title: "Sin Código Requerido",
    description: "Todo funciona con lenguaje natural, sin programar.",
    iconBg: "rgba(217, 255, 0, 0.12)",
    iconColor: "#d9ff00",
    glowColor: "rgba(217, 255, 0, 0.14)",
    borderHover: "rgba(217, 255, 0, 0.30)",
  },
] as const;

// ─── Single card ─────────────────────────────────────────────────────────────

function FeatureCard({
  feature,
  index,
}: {
  feature: (typeof features)[number];
  index: number;
}) {
  const Icon = feature.icon;

  return (
    <motion.article
      id={`feature-${feature.id}`}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{
        duration: 0.55,
        delay: index * 0.12,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={{
        y: -8,
        transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
      }}
      style={
        {
          "--glow": feature.glowColor,
          "--border-hover": feature.borderHover,
        } as React.CSSProperties
      }
      className="feature-card group relative flex flex-col gap-5 rounded-[1.4rem] border border-white/8 bg-[#0c0c0c] p-7 transition-shadow duration-300 hover:shadow-[0_20px_60px_var(--glow)]"
    >
      {/* subtle top-edge gradient line */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px rounded-t-[1.4rem] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `linear-gradient(90deg, transparent, ${feature.borderHover}, transparent)`,
        }}
      />

      {/* Icon container */}
      <motion.div
        whileHover={{ scale: 1.08, rotate: 4 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="flex h-14 w-14 items-center justify-center rounded-2xl"
        style={{ background: feature.iconBg }}
      >
        <Icon
          strokeWidth={1.6}
          className="h-7 w-7"
          style={{ color: feature.iconColor }}
        />
      </motion.div>

      {/* Text */}
      <div className="flex flex-col gap-2">
        <h3 className="text-[1.05rem] font-semibold leading-snug tracking-[-0.02em] text-white">
          {feature.title}
        </h3>
        <p className="text-[0.85rem] leading-[1.65] text-[#7a7a72] line-clamp-2">
          {feature.description}
        </p>
      </div>

      {/* Bottom accent bar */}
      <div
        className="mt-auto h-[2px] w-8 rounded-full opacity-0 transition-all duration-300 group-hover:w-14 group-hover:opacity-100"
        style={{ background: feature.iconColor }}
      />
    </motion.article>
  );
}

// ─── Section ─────────────────────────────────────────────────────────────────

export function FeaturesSection() {
  return (
    /**
     * Outer wrapper adds a top gradient fade so the section blends
     * smoothly as it scrolls up over the sticky hero panel.
     */
    <div className="relative">
      {/* Fade-in mask at the very top edge */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-28 z-10"
        style={{
          background:
            "linear-gradient(to bottom, #050505 0%, transparent 100%)",
        }}
      />

      <section
        id="features"
        aria-labelledby="features-heading"
        className="mx-auto w-full max-w-[1280px] px-5 pb-14 pt-20 sm:px-8 sm:pb-20 sm:pt-24"
      >
        {/* Section label */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mb-10 flex flex-col gap-3"
        >
          <p className="text-[0.68rem] uppercase tracking-[0.22em] text-[#6b8510]">
            Por qué Miunix
          </p>
          <h2
            id="features-heading"
            className="max-w-sm text-balance text-[1.9rem] font-medium leading-[1.1] tracking-[-0.045em] text-white sm:text-[2.3rem]"
          >
            Todo lo que necesitas,{" "}
            <span className="text-[#8f90ff]">listo en minutos.</span>
          </h2>
        </motion.div>

        {/* Cards grid — 4 columns on lg, 2 on sm, 1 on mobile */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, i) => (
            <FeatureCard key={feature.id} feature={feature} index={i} />
          ))}
        </div>
      </section>
    </div>
  );
}
