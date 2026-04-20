"use client";

import { useMemo, useState } from "react";

import {
  getDeveloperPricingGuidance,
  SUPPORTED_DEV_MODELS,
} from "@/lib/dev-tools";

type PricingFieldsProps = {
  defaultModel: (typeof SUPPORTED_DEV_MODELS)[number];
};

export function PricingFields({ defaultModel }: PricingFieldsProps) {
  const [model, setModel] = useState<string>(defaultModel);
  const [pricingType, setPricingType] = useState<"free" | "one_time">("free");
  const [price, setPrice] = useState("0");
  const guidance = useMemo(
    () => getDeveloperPricingGuidance({ model, toolCount: 1 }),
    [model],
  );

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-[0.55fr_0.25fr_0.2fr]">
        <label className="block">
          <span className="mb-2 block text-xs uppercase tracking-[0.22em] text-white/45">
            Modelo
          </span>
          <select
            name="model"
            value={model}
            onChange={(event) => {
              const nextModel = event.target.value;
              setModel(nextModel);

              if (pricingType === "one_time") {
                const nextGuidance = getDeveloperPricingGuidance({
                  model: nextModel,
                  toolCount: 1,
                });
                setPrice(nextGuidance.recommendedPriceUsd.toFixed(2));
              }
            }}
            className="w-full rounded-[1rem] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-[#8f90ff]"
          >
            {SUPPORTED_DEV_MODELS.map((supportedModel) => (
              <option
                key={supportedModel}
                value={supportedModel}
                className="bg-[#0d0d0d] text-white"
              >
                {supportedModel}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-xs uppercase tracking-[0.22em] text-white/45">
            Pricing
          </span>
          <select
            name="pricingType"
            value={pricingType}
            onChange={(event) => {
              const nextPricingType =
                event.target.value === "one_time" ? "one_time" : "free";
              setPricingType(nextPricingType);
              setPrice(
                nextPricingType === "one_time"
                  ? guidance.recommendedPriceUsd.toFixed(2)
                  : "0",
              );
            }}
            className="w-full rounded-[1rem] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-[#8f90ff]"
          >
            <option value="free" className="bg-[#0d0d0d] text-white">
              Gratis
            </option>
            <option value="one_time" className="bg-[#0d0d0d] text-white">
              Pago unico
            </option>
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-xs uppercase tracking-[0.22em] text-white/45">
            USD
          </span>
          <input
            name="price"
            type="number"
            step="0.01"
            min={pricingType === "one_time" ? guidance.minimumPriceUsd : 0}
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            className="w-full rounded-[1rem] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-[#8f90ff]"
          />
        </label>
      </div>

      <div className="rounded-[1rem] border border-white/10 bg-black/18 px-4 py-4 text-sm text-white/72">
        <p className="font-medium text-white">
          Costo base estimado para {model}: ${guidance.baseModelCostUsd.toFixed(2)}
        </p>
        <p className="mt-2 leading-6">
          Para agentes de pago, Miunix recomienda iniciar en ${guidance.recommendedPriceUsd.toFixed(2)} y no bajar de ${guidance.minimumPriceUsd.toFixed(2)}. Esta base luego sube si el agente usa varias tools externas.
        </p>
      </div>
    </>
  );
}
