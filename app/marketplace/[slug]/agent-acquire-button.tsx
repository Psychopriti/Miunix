"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckCircle2, LoaderCircle, ShoppingBag } from "lucide-react";

import { Button } from "@/components/ui/button";

type AgentAcquireButtonProps = {
  agentId: string;
  agentSlug: string;
  agentName: string;
  isAuthenticated: boolean;
  initiallyOwned: boolean;
};

export function AgentAcquireButton({
  agentId,
  agentSlug,
  agentName,
  isAuthenticated,
  initiallyOwned,
}: AgentAcquireButtonProps) {
  const [isOwned, setIsOwned] = useState(initiallyOwned);
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  async function handleConfirmPurchase() {
    setIsSubmitting(true);
    setFeedback(null);

    try {
      const response = await fetch("/api/purchase-agent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          agentId,
          agentSlug,
        }),
      });

      const payload = (await response.json()) as {
        success: boolean;
        alreadyOwned?: boolean;
        error?: string;
      };

      if (!response.ok || !payload.success) {
        throw new Error(payload.error ?? "No se pudo adquirir el agente.");
      }

      setIsOwned(true);
      setFeedback(
        payload.alreadyOwned
          ? "Este agente ya estaba disponible en tu cuenta."
          : "Listo. El agente ya aparece entre tus disponibles.",
      );
      setIsOpen(false);
    } catch (error) {
      setFeedback(
        error instanceof Error
          ? error.message
          : "No se pudo adquirir el agente.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isAuthenticated) {
    return (
      <Button
        asChild
        className="absolute bottom-4 right-4 h-auto rounded-full border border-white/10 bg-[#727145] px-5 py-4 text-sm font-medium text-[#f4f1d9] shadow-[0_14px_28px_rgba(0,0,0,0.28)] hover:bg-[#838254]"
      >
        <Link href="/login">Inicia sesion para adquirir</Link>
      </Button>
    );
  }

  if (isOwned) {
    return (
      <div className="absolute bottom-4 right-4 flex flex-col items-end gap-2">
        <Button
          asChild
          className="h-auto rounded-full border border-[#d9ff00]/30 bg-[#1d2a12] px-5 py-4 text-sm font-medium text-[#eff8c1] shadow-[0_14px_28px_rgba(0,0,0,0.28)] hover:bg-[#263718]"
        >
          <Link href="/dashboard">
            Disponible en dashboard
            <CheckCircle2 className="size-4" />
          </Link>
        </Button>
        {feedback ? (
          <p className="max-w-[16rem] text-right text-xs text-white/75">
            {feedback}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <>
      <Button
        type="button"
        onClick={() => setIsOpen(true)}
        className="absolute bottom-4 right-4 h-auto rounded-full border border-white/10 bg-[#727145] px-5 py-4 text-sm font-medium text-[#f4f1d9] shadow-[0_14px_28px_rgba(0,0,0,0.28)] hover:bg-[#838254]"
      >
        Adquirir Agente
        <ShoppingBag className="size-4" />
      </Button>

      {feedback ? (
        <p className="absolute bottom-[-2.5rem] right-4 max-w-[16rem] text-right text-xs text-white/75">
          {feedback}
        </p>
      ) : null}

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[1.5rem] border border-white/12 bg-[#0f1015] p-6 text-white shadow-[0_28px_80px_rgba(0,0,0,0.45)]">
            <p className="text-[0.7rem] uppercase tracking-[0.24em] text-[#d9ff00]/70">
              Confirmacion
            </p>
            <h2 className="mt-3 text-2xl font-medium tracking-[-0.04em]">
              Agregar {agentName} a tu cuenta
            </h2>
            <p className="mt-4 text-sm leading-6 text-white/70">
              Esta compra es solo una confirmacion simple para el MVP. Al
              continuar, el agente quedara habilitado en tu dashboard como si lo
              hubieras adquirido desde el marketplace.
            </p>

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/75">
              Acceso: inmediato
              <br />
              Costo: 0 USD en esta demo
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  if (!isSubmitting) {
                    setIsOpen(false);
                  }
                }}
                className="text-white/70 hover:text-white"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={() => void handleConfirmPurchase()}
                disabled={isSubmitting}
                className="bg-[#d9ff00] text-[#11140a] hover:bg-[#ebff5a]"
              >
                {isSubmitting ? (
                  <>
                    Procesando
                    <LoaderCircle className="size-4 animate-spin" />
                  </>
                ) : (
                  "Confirmar compra"
                )}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
