"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import { MarketplaceCard } from "@/components/marketing/marketplace-card";

export type MarketplaceCarouselItem = {
  slug: string;
  title: string;
  description: string;
  ownerLabel: string;
  averageRating: number;
  totalReviews: number;
  variant: "lead-generation" | "marketing-content" | "research" | "developer";
};

type MarketplaceCarouselProps = {
  items: MarketplaceCarouselItem[];
};

const PAGE_SIZE = 3;

export function MarketplaceCarousel({ items }: MarketplaceCarouselProps) {
  const [page, setPage] = useState(0);
  const [direction, setDirection] = useState(0);
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));

  const visibleItems = useMemo(() => {
    const start = page * PAGE_SIZE;
    return items.slice(start, start + PAGE_SIZE);
  }, [items, page]);

  function goTo(next: number) {
    setDirection(next > page ? 1 : -1);
    setPage(next);
  }

  return (
    <>
      <div className="mt-12 w-full">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={page}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="grid w-full gap-8 lg:grid-cols-3 lg:gap-16"
          >
            {visibleItems.map((agent, i) => (
              <motion.div
                key={agent.slug}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.45,
                  delay: i * 0.08,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <MarketplaceCard
                  title={agent.title}
                  description={agent.description}
                  ownerLabel={agent.ownerLabel}
                  variant={agent.variant}
                  href={`/marketplace/${agent.slug}`}
                  averageRating={agent.averageRating}
                  totalReviews={agent.totalReviews}
                />
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {items.length > PAGE_SIZE ? (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-8 flex items-center gap-2 text-sm text-[#b891e9]"
          >
            <span className="text-base">*</span>
            <span>
              Pagina {page + 1} de {totalPages}
            </span>
          </motion.div>

          <div className="mt-5 flex items-center gap-4">
            <motion.button
              type="button"
              aria-label="Anterior"
              onClick={() => goTo(Math.max(0, page - 1))}
              disabled={page === 0}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              className="flex size-9 items-center justify-center rounded-lg bg-white text-black transition hover:bg-white/85 disabled:cursor-not-allowed disabled:bg-white/25 disabled:text-white/40"
            >
              <ChevronLeft className="size-4" />
            </motion.button>
            <motion.button
              type="button"
              aria-label="Siguiente"
              onClick={() => goTo(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              className="flex size-9 items-center justify-center rounded-lg bg-[#e6f8ca] text-black transition hover:bg-[#f0ffdc] disabled:cursor-not-allowed disabled:bg-white/25 disabled:text-white/40"
            >
              <ChevronRight className="size-4" />
            </motion.button>
          </div>
        </>
      ) : null}
    </>
  );
}
