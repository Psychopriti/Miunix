"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, ArrowUpRight, CheckCircle2, Lock, ShoppingBag, Sparkles } from "lucide-react";
import { motion } from "motion/react";

type WorkflowAccessState = "available" | "purchase_required" | "auth_required";

type WorkflowCard = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  priceLabel: string;
  accessState: WorkflowAccessState;
  includedAgents: {
    slug: string;
    name: string;
  }[];
  steps: {
    id: string;
    position: number;
    title: string;
    stepKey: string;
    agentSlug: string;
  }[];
  deliverable: string;
  benefits: string[];
};

type WorkflowsContentProps = {
  isAuthenticated: boolean;
  workflows: WorkflowCard[];
};

type PurchaseState = {
  loadingSlug: string | null;
  error: string | null;
};

export function WorkflowsContent({
  isAuthenticated,
  workflows,
}: WorkflowsContentProps) {
  const [selectedWorkflowSlug, setSelectedWorkflowSlug] = useState(
    workflows[0]?.slug ?? "",
  );
  const [purchaseState, setPurchaseState] = useState<PurchaseState>({
    loadingSlug: null,
    error: null,
  });

  const selectedWorkflow = useMemo(
    () =>
      workflows.find((workflow) => workflow.slug === selectedWorkflowSlug) ??
      workflows[0],
    [selectedWorkflowSlug, workflows],
  );

  async function handlePurchaseWorkflow(workflow: WorkflowCard) {
    setPurchaseState({
      loadingSlug: workflow.slug,
      error: null,
    });

    try {
      const response = await fetch("/api/purchase-workflow", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          workflowSlug: workflow.slug,
        }),
      });

      const payload = (await response.json()) as
        | {
            success: true;
            alreadyOwned: boolean;
            workflow: {
              slug: string;
            };
          }
        | {
            success: false;
            error: string;
          };

      if (!response.ok || !payload.success) {
        throw new Error(
          "error" in payload ? payload.error : "No se pudo comprar el workflow.",
        );
      }

      window.location.href = `/dashboard?mode=workflows&workflow=${payload.workflow.slug}`;
    } catch (error) {
      setPurchaseState({
        loadingSlug: null,
        error:
          error instanceof Error
            ? error.message
            : "No se pudo comprar el workflow.",
      });
      return;
    }

    setPurchaseState({
      loadingSlug: null,
      error: null,
    });
  }

  function renderPrimaryCta(workflow: WorkflowCard) {
    if (workflow.accessState === "available") {
      return (
        <Link
          href={`/dashboard?mode=workflows&workflow=${workflow.slug}`}
          className="inline-flex items-center gap-2 rounded-full border border-[#d7f205]/20 bg-[#d7f205]/10 px-5 py-3 text-sm text-[#f3ffc1] transition hover:bg-[#d7f205]/16"
        >
          Abrir en dashboard
          <ArrowUpRight className="size-4" />
        </Link>
      );
    }

    if (!isAuthenticated || workflow.accessState === "auth_required") {
      return (
        <Link
          href="/login"
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-5 py-3 text-sm text-white/82 transition hover:bg-white/[0.08]"
        >
          Iniciar sesion para comprar
          <ArrowUpRight className="size-4" />
        </Link>
      );
    }

    return (
      <button
        type="button"
        onClick={() => void handlePurchaseWorkflow(workflow)}
        disabled={purchaseState.loadingSlug === workflow.slug}
        className="inline-flex items-center gap-2 rounded-full border border-[#d7f205]/20 bg-[#d7f205]/10 px-5 py-3 text-sm text-[#f3ffc1] transition hover:bg-[#d7f205]/16 disabled:cursor-not-allowed disabled:opacity-55"
      >
        <ShoppingBag className="size-4" />
        {purchaseState.loadingSlug === workflow.slug ? "Procesando compra" : "Comprar workflow"}
      </button>
    );
  }

  return (
    <section className="relative flex flex-1 flex-col overflow-visible pb-12 pt-10 sm:pt-14">
      <div className="pointer-events-none absolute left-1/2 top-28 h-[18rem] w-[18rem] -translate-x-1/2 rounded-full bg-[#d7f205]/18 blur-[110px]" />
      <div className="pointer-events-none absolute left-1/2 top-16 h-[24rem] w-[34rem] -translate-x-1/2 rounded-full bg-[#8f90ff]/10 blur-[140px]" />

      <div className="relative flex w-full flex-1 flex-col">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-[62rem] text-center"
        >
          <h1 className="text-balance font-heading text-[2.55rem] uppercase leading-[0.92] tracking-[-0.06em] text-white sm:text-[4.4rem]">
            Workflows como producto, no como chat suelto
          </h1>
          <p className="mx-auto mt-5 max-w-[50rem] text-balance text-[1.05rem] leading-8 text-white/88 sm:text-[1.15rem]">
            Aqui compras paquetes de agentes que trabajan juntos. La ejecucion vive en el dashboard,
            dentro de un modo workflow que solo se desbloquea al comprar.
          </p>
        </motion.div>

        {workflows.length === 0 ? (
          <div className="mx-auto mt-12 w-full max-w-2xl rounded-[1.5rem] border border-dashed border-white/12 bg-white/[0.02] px-6 py-8 text-center text-sm leading-6 text-white/58">
            Todavia no hay workflows publicados.
          </div>
        ) : (
          <div className="mt-12 grid gap-6 xl:grid-cols-[1.12fr_0.98fr]">
            <div className="grid gap-5">
              {workflows.map((workflow, index) => {
                const isSelected = workflow.slug === selectedWorkflow?.slug;

                return (
                  <motion.button
                    key={workflow.id}
                    type="button"
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.45,
                      delay: index * 0.08,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    onClick={() => setSelectedWorkflowSlug(workflow.slug)}
                    className={`rounded-[1.75rem] border px-6 py-6 text-left transition ${
                      isSelected
                        ? "border-[#d7f205]/40 bg-[linear-gradient(180deg,rgba(43,52,16,0.95),rgba(12,12,12,0.94))] shadow-[0_26px_80px_rgba(0,0,0,0.32)]"
                        : "border-white/10 bg-[linear-gradient(180deg,rgba(28,28,28,0.96),rgba(10,10,10,0.94))] hover:border-white/18"
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="max-w-[36rem]">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full border border-[#d7f205]/20 bg-[#d7f205]/10 px-3 py-1 text-[0.65rem] uppercase tracking-[0.2em] text-[#d7f205]">
                            Workflow nativo
                          </span>
                          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[0.68rem] text-white/72">
                            {workflow.steps.length} etapas
                          </span>
                        </div>
                        <h2 className="mt-4 text-3xl font-light text-white">
                          {workflow.name}
                        </h2>
                        <p className="mt-3 max-w-[34rem] text-sm leading-7 text-white/76">
                          {workflow.shortDescription}
                        </p>
                      </div>

                      <div className="text-right">
                        <div className="text-3xl font-light text-[#d7f205]">
                          {workflow.priceLabel}
                        </div>
                        <p className="mt-2 text-xs uppercase tracking-[0.18em] text-white/45">
                          Licencia workflow
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-2">
                      {workflow.includedAgents.map((agent) => (
                        <span
                          key={`${workflow.slug}-${agent.slug}`}
                          className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[0.72rem] text-white/85"
                        >
                          {agent.name}
                        </span>
                      ))}
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {selectedWorkflow ? (
              <motion.div
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="rounded-[1.9rem] border border-white/10 bg-[linear-gradient(180deg,rgba(18,18,18,0.98),rgba(8,8,8,0.98))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[0.68rem] uppercase tracking-[0.24em] text-[#d7f205]">
                      Saber mas
                    </p>
                    <h3 className="mt-3 text-3xl font-light text-white">
                      {selectedWorkflow.name}
                    </h3>
                  </div>
                  <Sparkles className="mt-1 size-5 text-[#d7f205]" />
                </div>

                <p className="mt-4 text-sm leading-7 text-white/72">
                  {selectedWorkflow.description}
                </p>

                <div className="mt-6 rounded-[1.4rem] border border-white/8 bg-white/[0.03] px-4 py-4">
                  <p className="text-[0.72rem] uppercase tracking-[0.2em] text-white/46">
                    Entregable
                  </p>
                  <p className="mt-2 text-sm leading-7 text-white/82">
                    {selectedWorkflow.deliverable}
                  </p>
                </div>

                <div className="mt-6 grid gap-3">
                  {selectedWorkflow.benefits.map((benefit) => (
                    <div
                      key={benefit}
                      className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-4"
                    >
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="mt-0.5 size-4 text-[#d7f205]" />
                        <p className="text-sm leading-6 text-white/72">{benefit}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6">
                  <p className="text-[0.72rem] uppercase tracking-[0.2em] text-white/46">
                    Como trabaja
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {selectedWorkflow.steps.map((step, index) => (
                      <div key={step.id} className="flex items-center gap-2">
                        <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[0.72rem] text-white/84">
                          {step.position}. {step.title}
                        </span>
                        {index < selectedWorkflow.steps.length - 1 ? (
                          <ArrowRight className="size-3.5 text-white/35" />
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 rounded-[1.4rem] border border-white/8 bg-[#0a1012] px-4 py-4">
                  <div className="flex items-center gap-2 text-sm text-white/82">
                    {selectedWorkflow.accessState === "available" ? (
                      <CheckCircle2 className="size-4 text-emerald-300" />
                    ) : (
                      <Lock className="size-4 text-[#d7f205]" />
                    )}
                    <span>
                      {selectedWorkflow.accessState === "available"
                        ? "Ya lo tienes desbloqueado. Ejecutalo desde dashboard en Workflow Mode."
                        : "La compra desbloquea ejecucion dentro del dashboard, no en esta pagina."}
                    </span>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  {renderPrimaryCta(selectedWorkflow)}

                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-5 py-3 text-sm text-white/82 transition hover:bg-white/[0.08]"
                  >
                    Ver dashboard
                    <ArrowUpRight className="size-4" />
                  </Link>
                </div>

                {purchaseState.error ? (
                  <div className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
                    {purchaseState.error}
                  </div>
                ) : null}
              </motion.div>
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}
