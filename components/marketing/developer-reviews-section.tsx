import { MessageSquareText, Star } from "lucide-react";

import type { DeveloperReview } from "@/lib/developers";

type DeveloperReviewsSectionProps = {
  developerName: string;
  averageRating: number;
  totalReviews: number;
  reviews: DeveloperReview[];
};

function renderStars(rating: number, filledClassName: string) {
  return Array.from({ length: 5 }, (_, index) => {
    const starNumber = index + 1;
    const isFilled = starNumber <= rating;

    return (
      <Star
        key={starNumber}
        className={[
          "size-4",
          isFilled ? filledClassName : "fill-transparent text-white/18",
        ].join(" ")}
      />
    );
  });
}

function formatReviewDate(dateValue: string) {
  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString("es-NI", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function DeveloperReviewsSection({
  developerName,
  averageRating,
  totalReviews,
  reviews,
}: DeveloperReviewsSectionProps) {
  return (
    <section className="mt-10 grid gap-8 rounded-[1.75rem] border border-white/10 bg-[#0b0b0f] px-6 py-6 shadow-[0_24px_80px_rgba(0,0,0,0.22)] lg:grid-cols-[0.86fr_1.14fr] lg:px-8">
      <div className="rounded-[1.35rem] border border-white/10 bg-[linear-gradient(180deg,#12131b_0%,#0b0d12_100%)] p-5">
        <p className="text-[0.72rem] uppercase tracking-[0.24em] text-[#d9ff00]/70">
          Reviews
        </p>
        <h2 className="mt-3 text-[1.9rem] font-medium tracking-[-0.05em] text-white">
          Que dicen quienes trabajan con {developerName}
        </h2>

        <div className="mt-6 flex items-end gap-4">
          <p className="text-5xl font-semibold leading-none text-white">
            {totalReviews > 0 ? averageRating.toFixed(1) : "0.0"}
          </p>
          <div className="pb-1">
            <div className="flex items-center gap-1">
              {renderStars(
                Math.round(averageRating),
                "fill-[#d9ff00] text-[#d9ff00]",
              )}
            </div>
            <p className="mt-2 text-sm text-white/60">
              {totalReviews === 0
                ? "Sin reviews todavia"
                : `${totalReviews} review${totalReviews === 1 ? "" : "s"} publicadas`}
            </p>
          </div>
        </div>

        <div className="mt-8 rounded-[1.2rem] border border-white/10 bg-white/[0.03] p-4">
          <p className="text-sm leading-6 text-white/70">
            Estas reseñas resumen la experiencia de equipos que ya trabajaron con
            este developer dentro de Miunix.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {reviews.length > 0 ? (
          reviews.map((review) => (
            <article
              key={review.id}
              className="rounded-[1.2rem] border border-white/10 bg-[linear-gradient(180deg,#11131b_0%,#0c0d13_100%)] p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-medium text-white">
                      {review.author}
                    </p>
                  </div>
                  <div className="mt-2 flex items-center gap-1">
                    {renderStars(review.rating, "fill-[#f5f1d1] text-[#f5f1d1]")}
                  </div>
                </div>

                <p className="text-xs text-white/40">
                  {formatReviewDate(review.createdAt)}
                </p>
              </div>

              <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-white/72">
                {review.comment}
              </p>
            </article>
          ))
        ) : (
          <div className="flex min-h-[16rem] flex-col items-center justify-center rounded-[1.2rem] border border-dashed border-white/12 bg-white/[0.02] px-6 text-center">
            <MessageSquareText className="size-8 text-white/30" />
            <p className="mt-4 text-lg font-medium text-white">
              Aun no hay reviews publicadas
            </p>
            <p className="mt-2 max-w-md text-sm leading-6 text-white/55">
              Cuando otros equipos compartan su experiencia con este developer,
              apareceran aqui para ayudar a tomar una mejor decision.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
