import Link from "next/link";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";

type MarketplaceCardProps = {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  averageRating: number;
  totalReviews: number;
};

export function MarketplaceCard({
  title,
  description,
  icon,
  href,
  averageRating,
  totalReviews,
}: MarketplaceCardProps) {
  return (
    <article className="flex min-h-[26rem] flex-col items-center rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,#8b8b90_0%,#5b5b72_62%,#43436d_100%)] px-6 pb-7 pt-8 text-center shadow-[0_24px_60px_rgba(0,0,0,0.25)]">
      <div className="flex size-[4.6rem] items-center justify-center rounded-full bg-[#08282c] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]">
        {icon}
      </div>

      <h2 className="mt-6 text-balance text-[2rem] font-medium leading-[0.92] tracking-[-0.05em] text-white">
        {title}
      </h2>

      <p className="mt-5 max-w-[14rem] text-[0.7rem] leading-[1.55] text-white/88">
        {description}
      </p>

      <div className="mt-5 flex items-center gap-2 rounded-full border border-white/10 bg-black/15 px-3 py-1.5 text-xs text-white/78">
        <Star className="size-3.5 fill-[#d9ff00] text-[#d9ff00]" />
        <span>
          {totalReviews > 0
            ? `${averageRating.toFixed(1)} · ${totalReviews} review${totalReviews === 1 ? "" : "s"}`
            : "Sin reviews"}
        </span>
      </div>

      <Button
        asChild
        className="mt-auto h-auto rounded-full border border-white/10 bg-white/20 px-5 py-3 text-[0.68rem] font-medium text-white backdrop-blur hover:bg-white/28"
      >
        <Link href={href}>Try for Free</Link>
      </Button>
    </article>
  );
}
