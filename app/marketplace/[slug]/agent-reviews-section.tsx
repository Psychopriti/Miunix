"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, MessageSquareText, Star } from "lucide-react";

import { Button } from "@/components/ui/button";

import type { AgentReviewItem } from "@/ai/agent-reviews";

type AgentReviewsSectionProps = {
  agentId: string;
  agentName: string;
  averageRating: number;
  totalReviews: number;
  reviews: AgentReviewItem[];
  existingReview: AgentReviewItem | null;
  isAuthenticated: boolean;
  canReview: boolean;
  hasPurchased: boolean;
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

export function AgentReviewsSection({
  agentId,
  agentName,
  averageRating,
  totalReviews,
  reviews,
  existingReview,
  isAuthenticated,
  canReview,
  hasPurchased,
}: AgentReviewsSectionProps) {
  const router = useRouter();
  const [rating, setRating] = useState(existingReview?.rating ?? 5);
  const [reviewText, setReviewText] = useState(existingReview?.reviewText ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  async function handleSubmitReview() {
    setIsSubmitting(true);
    setFeedback(null);

    try {
      const response = await fetch("/api/agent-reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          agentId,
          rating,
          reviewText,
        }),
      });

      const payload = (await response.json()) as {
        success: boolean;
        error?: string;
      };

      if (!response.ok || !payload.success) {
        throw new Error(payload.error ?? "No se pudo guardar tu review.");
      }

      setFeedback(
        existingReview
          ? "Tu review fue actualizada."
          : "Tu review ya esta publicada.",
      );
      router.refresh();
    } catch (error) {
      setFeedback(
        error instanceof Error
          ? error.message
          : "No se pudo guardar tu review.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="mt-10 grid gap-8 rounded-[1.75rem] border border-white/10 bg-[#0b0b0f] px-6 py-6 shadow-[0_24px_80px_rgba(0,0,0,0.22)] lg:grid-cols-[0.86fr_1.14fr] lg:px-8">
      <div className="rounded-[1.35rem] border border-white/10 bg-[linear-gradient(180deg,#12131b_0%,#0b0d12_100%)] p-5">
        <p className="text-[0.72rem] uppercase tracking-[0.24em] text-[#d9ff00]/70">
          Reviews
        </p>
        <h2 className="mt-3 text-[1.9rem] font-medium tracking-[-0.05em] text-white">
          Que dicen quienes ya lo compraron
        </h2>

        <div className="mt-6 flex items-end gap-4">
          <p className="text-5xl font-semibold leading-none text-white">
            {totalReviews > 0 ? averageRating.toFixed(1) : "0.0"}
          </p>
          <div className="pb-1">
            <div className="flex items-center gap-1">
              {renderStars(Math.round(averageRating), "fill-[#d9ff00] text-[#d9ff00]")}
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
            {canReview
              ? `Ya puedes dejar tu experiencia con ${agentName}.`
              : isAuthenticated
                ? hasPurchased
                  ? "Tu acceso ya esta validado."
                  : "Compra este agente desde el marketplace para poder escribir una review."
                : "Inicia sesion y compra el agente para poder escribir una review."}
          </p>

          {canReview ? (
            <div className="mt-5 space-y-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-white/40">
                  Tu rating
                </p>
                <div className="mt-3 flex items-center gap-2">
                  {Array.from({ length: 5 }, (_, index) => {
                    const nextRating = index + 1;

                    return (
                      <button
                        key={nextRating}
                        type="button"
                        onClick={() => setRating(nextRating)}
                        className="transition hover:scale-105"
                        aria-label={`Calificar con ${nextRating} estrellas`}
                      >
                        <Star
                          className={[
                            "size-5",
                            nextRating <= rating
                              ? "fill-[#d9ff00] text-[#d9ff00]"
                              : "fill-transparent text-white/20",
                          ].join(" ")}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label
                  htmlFor="agent-review-text"
                  className="text-xs uppercase tracking-[0.18em] text-white/40"
                >
                  Tu review
                </label>
                <textarea
                  id="agent-review-text"
                  value={reviewText}
                  onChange={(event) => setReviewText(event.target.value)}
                  maxLength={1000}
                  rows={5}
                  placeholder="Cuenta que tan util te resulto, en que te ayudo o que podria mejorar."
                  className="mt-3 w-full resize-none rounded-[1rem] border border-white/10 bg-[#0f1117] px-4 py-3 text-sm leading-6 text-white/80 outline-none transition placeholder:text-white/25 focus:border-white/20"
                />
                <p className="mt-2 text-right text-[11px] text-white/35">
                  {reviewText.length}/1000
                </p>
              </div>

              <Button
                type="button"
                onClick={() => void handleSubmitReview()}
                disabled={isSubmitting}
                className="bg-[#d9ff00] text-[#11140a] hover:bg-[#ebff5a]"
              >
                {isSubmitting ? (
                  <>
                    Guardando
                    <LoaderCircle className="size-4 animate-spin" />
                  </>
                ) : existingReview ? (
                  "Actualizar review"
                ) : (
                  "Publicar review"
                )}
              </Button>
            </div>
          ) : null}

          {feedback ? (
            <p className="mt-4 text-sm text-white/70">{feedback}</p>
          ) : null}
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
                      {review.reviewerName}
                    </p>
                    {review.isCurrentUser ? (
                      <span className="rounded-full border border-[#d9ff00]/25 bg-[#d9ff00]/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-[#e9ff8a]">
                        Tu review
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-2 flex items-center gap-1">
                    {renderStars(review.rating, "fill-[#f5f1d1] text-[#f5f1d1]")}
                  </div>
                </div>

                <p className="text-xs text-white/40">
                  {formatReviewDate(review.updatedAt || review.createdAt)}
                </p>
              </div>

              <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-white/72">
                {review.reviewText?.trim() || "El usuario dejo una calificacion sin comentario adicional."}
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
              Cuando los compradores de este agente compartan su experiencia,
              apareceran aqui para ayudar a otros usuarios a decidir mejor.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
