"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { motion } from "motion/react";

import { MarketplaceCard } from "@/components/marketing/marketplace-card";
import type { DeveloperMarketplaceProfile } from "@/lib/developer-marketplace";

type DeveloperDetailClientProps = {
  developer: DeveloperMarketplaceProfile;
  developerBenefits: ReadonlyArray<{
    icon: string;
    title: string;
    description: string;
  }>;
};

export function DeveloperDetailClient({
  developer,
  developerBenefits,
}: DeveloperDetailClientProps) {
  return (
    <section className="flex flex-1 flex-col justify-center gap-8 pb-4 pt-9 sm:pt-11">
      {/* ── Hero banner ── */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-[linear-gradient(90deg,#d8ff17_0%,#edf0d1_44%,#8f90ff_100%)] px-6 py-7 shadow-[0_20px_45px_rgba(0,0,0,0.2)] sm:px-10 sm:py-10"
      >
        <div className="absolute -left-10 top-1/2 h-32 w-32 -translate-y-1/2 rounded-full bg-[#d8ff17]/45 blur-3xl" />
        <div className="absolute right-0 top-0 h-full w-1/3 bg-[radial-gradient(circle_at_60%_40%,rgba(255,255,255,0.35),transparent_38%)]" />

        <div className="flex items-end justify-between gap-6">
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.88 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5, type: "spring", stiffness: 260, damping: 22 }}
            className="relative mt-14 flex size-[7.8rem] items-center justify-center overflow-hidden rounded-full border-[5px] border-white bg-[linear-gradient(180deg,#8f90ff_0%,#4c4fa9_100%)] shadow-[0_12px_30px_rgba(0,0,0,0.24)] sm:size-[8.8rem]"
          >
            <span className="text-4xl font-semibold text-white">{developer.initials}</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35, duration: 0.45 }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
          >
            <Link
              href="/developers"
              className="inline-flex items-center gap-2 rounded-full bg-black/18 px-4 py-2 text-xs font-medium text-white/90 backdrop-blur transition hover:bg-black/26"
            >
              <ArrowLeft className="size-4" />
              Volver a developers
            </Link>
          </motion.div>
        </div>
      </motion.div>

      {/* ── Content grid ── */}
      <div className="grid gap-10 lg:grid-cols-[1.1fr_0.7fr] lg:items-start">

        {/* Left: name + benefits */}
        <div>
          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-3xl text-balance text-[2.7rem] font-medium leading-[0.95] tracking-[-0.065em] text-white sm:text-[4rem]"
          >
            {developer.name}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            className="mt-5 text-sm uppercase tracking-[0.22em] text-white/42"
          >
            {developer.role}
          </motion.p>

          {/* Benefit cards con stagger */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              visible: { transition: { staggerChildren: 0.1, delayChildren: 0.5 } },
              hidden: {},
            }}
            className="mt-6 grid gap-4 md:grid-cols-3"
          >
            {developerBenefits.map((benefit) => (
              <motion.article
                key={benefit.title}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
                }}
                className="rounded-[0.45rem] border border-white/10 bg-[linear-gradient(180deg,#1a1d37_0%,#1d2244_100%)] px-5 py-6 shadow-[0_16px_32px_rgba(0,0,0,0.18)]"
              >
                <div className="text-center text-lg text-white/85">{benefit.icon}</div>
                <h2 className="mt-5 text-center text-[0.82rem] font-medium leading-tight text-white">
                  {benefit.title}
                </h2>
                <p className="mt-4 text-[0.64rem] leading-[1.5] text-white/75">
                  {benefit.description}
                </p>
              </motion.article>
            ))}
          </motion.div>
        </div>

        {/* Right: avatar card + tagline */}
        <motion.aside
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="justify-self-center lg:justify-self-end"
        >
          <div className="relative w-full max-w-[19rem]">
            <div className="overflow-hidden rounded-[45%_45%_36%_36%/32%_32%_18%_18%] border border-[#d8d0bb] bg-[linear-gradient(180deg,#fbf3e7_0%,#d8c4af_55%,#7a4d2e_100%)] shadow-[0_28px_50px_rgba(0,0,0,0.28)]">
              <div className="relative aspect-[0.8] w-full bg-[radial-gradient(circle_at_32%_18%,rgba(255,255,255,0.48),transparent_18%),linear-gradient(180deg,#e8e0d5_0%,#cab7a6_55%,#815433_100%)]">
                <div className="absolute inset-x-[18%] bottom-[18%] top-[12%] flex items-center justify-center overflow-hidden rounded-[2rem] bg-[linear-gradient(180deg,#8f90ff_0%,#4c4fa9_100%)]">
                  <span className="text-6xl font-semibold text-white">{developer.initials}</span>
                </div>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_28%,rgba(255,255,255,0.5),transparent_16%),radial-gradient(circle_at_55%_60%,rgba(0,0,0,0.2),transparent_20%)]" />
              </div>
            </div>

            <div className="absolute inset-x-4 -bottom-5">
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                <Link
                  href="/marketplace"
                  className="flex items-center justify-center rounded-full border border-white/12 bg-[#8f90ff] px-5 py-3 text-sm font-medium text-white shadow-[0_14px_30px_rgba(143,144,255,0.35)] transition hover:bg-[#a0a1ff]"
                >
                  Ver marketplace
                </Link>
              </motion.div>
            </div>
          </div>

          <div className="mt-10 space-y-1 text-left">
            <p className="text-[1.45rem] font-semibold leading-tight text-white">
              {developer.taglinePrimary}
            </p>
            <p className="text-[1.45rem] font-semibold leading-tight text-white">
              {developer.taglineSecondary}
            </p>
            <p className="mt-5 max-w-[18rem] text-sm leading-6 text-white/76">
              {developer.heroDescription}
            </p>
          </div>
        </motion.aside>
      </div>

      {/* ── Agent catalog ── */}
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-white/42">
              Agentes publicados
            </p>
            <h2 className="mt-3 text-2xl font-medium tracking-[-0.04em] text-white">
              Catalogo del developer
            </h2>
          </div>
          <p className="text-sm text-white/55">
            {developer.approvedAgentCount} agente
            {developer.approvedAgentCount === 1 ? "" : "s"}
          </p>
        </div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            visible: { transition: { staggerChildren: 0.09, delayChildren: 0.85 } },
            hidden: {},
          }}
          className="mt-8 grid gap-8 lg:grid-cols-3"
        >
          {developer.approvedAgents.map((agent) => (
            <motion.div
              key={agent.id}
              variants={{
                hidden: { opacity: 0, y: 24 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
              }}
            >
              <MarketplaceCard
                title={agent.name}
                description={agent.shortDescription}
                ownerLabel={developer.name}
                variant={agent.variant}
                href={`/marketplace/${agent.slug}`}
                averageRating={agent.averageRating}
                totalReviews={agent.totalReviews}
              />
            </motion.div>
          ))}
        </motion.div>
      </motion.section>
    </section>
  );
}
