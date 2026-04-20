"use client";

import { useState } from "react";
import { Crown, Sparkles, X } from "lucide-react";

import { selectMiunixPlanAction } from "@/app/actions/miunix-plus";
import type { PremiumPlanDefinition } from "@/lib/premium";

type PlanPurchaseCardsProps = {
  plans: PremiumPlanDefinition[];
};

export function PlanPurchaseCards({ plans }: PlanPurchaseCardsProps) {
  const [selectedPlan, setSelectedPlan] = useState<PremiumPlanDefinition | null>(
    null,
  );

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-3">
        {plans.map((plan) => (
          <article
            key={plan.slug}
            className={`flex flex-col rounded-[1.6rem] border px-5 py-5 ${
              plan.slug === "pro"
                ? "border-[#d9ff00]/35 bg-[linear-gradient(180deg,rgba(217,255,0,0.08),rgba(255,255,255,0.03))]"
                : "border-white/10 bg-white/[0.03]"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-white/45">
                  {plan.slug === "pro" ? "Recomendado" : "Plan"}
                </p>
                <h2 className="mt-3 text-2xl font-medium tracking-[-0.04em] text-white">
                  {plan.name}
                </h2>
              </div>
              {plan.slug === "pro" ? (
                <div className="rounded-full bg-[#d9ff00] p-2 text-black">
                  <Crown className="size-4" />
                </div>
              ) : null}
            </div>

            <p className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-[#d9ff00]">
              {plan.priceLabel}
            </p>
            <p className="mt-3 text-sm leading-6 text-white/65">
              {plan.summary}
            </p>
            <p className="mt-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-xs leading-5 text-white/68">
              {plan.recommendedFor}
            </p>

            <div className="mt-5 flex-1 space-y-3">
              {plan.features.map((feature) => (
                <div
                  key={feature}
                  className="flex items-start gap-3 rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3 text-sm text-white/78"
                >
                  <Sparkles className="mt-0.5 size-4 text-[#d9ff00]" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setSelectedPlan(plan)}
              className={`mt-6 w-full rounded-full px-5 py-3 text-sm font-medium transition ${
                plan.slug === "pro"
                  ? "border border-[#d9ff00]/25 bg-[#d9ff00] text-black hover:bg-[#e5ff45]"
                  : "border border-white/12 bg-white/6 text-white hover:bg-white/10"
              }`}
            >
              Activar {plan.name}
            </button>
          </article>
        ))}
      </div>

      {selectedPlan ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-[1.8rem] border border-white/10 bg-[#0c0c0c] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.5)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-white/45">
                  Confirmacion de compra
                </p>
                <h3 className="mt-3 text-2xl font-medium tracking-[-0.04em] text-white">
                  {selectedPlan.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPlan(null)}
                className="rounded-full border border-white/10 bg-white/5 p-2 text-white/65 transition hover:bg-white/10 hover:text-white"
                aria-label="Cerrar confirmacion"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="mt-5 rounded-[1.2rem] border border-[#d9ff00]/20 bg-[#11190a] px-4 py-4 text-sm leading-6 text-[#e9ff9a]">
              Este flujo es solo para testeo. No se procesa ningun pago real;
              al confirmar simplemente activamos el plan en tu perfil.
            </div>

            <div className="mt-5 grid gap-4 rounded-[1.2rem] border border-white/10 bg-white/[0.03] p-4 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-white/35">
                  Precio simulado
                </p>
                <p className="mt-2 text-2xl font-semibold text-[#d9ff00]">
                  {selectedPlan.priceLabel}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-white/35">
                  Capacidad del plan
                </p>
                <p className="mt-2 text-2xl font-semibold text-white">
                  {selectedPlan.agentLimit} agente
                  {selectedPlan.agentLimit === 1 ? "" : "s"}
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {selectedPlan.features.map((feature) => (
                <div
                  key={feature}
                  className="rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3 text-sm text-white/72"
                >
                  {feature}
                </div>
              ))}
            </div>

            <form action={selectMiunixPlanAction} className="mt-6 flex flex-col gap-3 sm:flex-row">
              <input type="hidden" name="plan" value={selectedPlan.slug} />
              <button
                type="button"
                onClick={() => setSelectedPlan(null)}
                className="flex-1 rounded-full border border-white/12 bg-white/6 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 rounded-full border border-[#d9ff00]/25 bg-[#d9ff00] px-5 py-3 text-sm font-medium text-black transition hover:bg-[#e5ff45]"
              >
                Confirmar compra de prueba
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
