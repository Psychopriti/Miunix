"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  CircleDashed,
  Play,
  Sparkles,
} from "lucide-react";

import type {
  DashboardWorkflow,
  DashboardWorkflowExecution,
} from "@/lib/dashboard";

type DashboardWorkflowModeProps = {
  workflows: DashboardWorkflow[];
  initialWorkflowExecutions: DashboardWorkflowExecution[];
};

type WorkflowRunState = {
  workflowSlug: string;
  loading: boolean;
  error: string | null;
  executionId: string | null;
  stepRuns: DashboardWorkflowExecution["stepRuns"];
  finalOutputText: string;
};

const emptyRunState: WorkflowRunState = {
  workflowSlug: "",
  loading: false,
  error: null,
  executionId: null,
  stepRuns: [],
  finalOutputText: "",
};

function getStatusPillClass(
  status: "pending" | "running" | "completed" | "failed" | "skipped",
) {
  if (status === "completed") {
    return "border-emerald-400/25 bg-emerald-400/10 text-emerald-200";
  }

  if (status === "running") {
    return "border-cyan-400/25 bg-cyan-400/10 text-cyan-200";
  }

  if (status === "failed") {
    return "border-rose-400/25 bg-rose-400/10 text-rose-200";
  }

  return "border-white/10 bg-white/5 text-white/65";
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "En curso";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("es-NI", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function DashboardWorkflowMode({
  workflows,
  initialWorkflowExecutions,
}: DashboardWorkflowModeProps) {
  const [selectedWorkflowSlug, setSelectedWorkflowSlug] = useState(
    workflows[0]?.slug ?? "",
  );
  const [formState, setFormState] = useState({
    business_goal: "",
    offer: "",
    geography: "",
    target_segment: "",
  });
  const [runState, setRunState] = useState<WorkflowRunState>(emptyRunState);
  const [workflowExecutions, setWorkflowExecutions] = useState(
    initialWorkflowExecutions,
  );

  const selectedWorkflow = useMemo(
    () =>
      workflows.find((workflow) => workflow.slug === selectedWorkflowSlug) ??
      workflows[0],
    [selectedWorkflowSlug, workflows],
  );

  const selectedWorkflowExecutions = useMemo(
    () =>
      workflowExecutions.filter(
        (execution) => execution.workflowSlug === selectedWorkflow?.slug,
      ),
    [selectedWorkflow?.slug, workflowExecutions],
  );

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);

    if (query.get("mode") !== "workflows" || workflows.length === 0) {
      return;
    }

    const requestedWorkflow = query.get("workflow");

    if (requestedWorkflow && workflows.some((workflow) => workflow.slug === requestedWorkflow)) {
      setSelectedWorkflowSlug(requestedWorkflow);
    }
  }, [workflows]);

  async function handleRunWorkflow() {
    if (!selectedWorkflow) {
      return;
    }

    setRunState({
      workflowSlug: selectedWorkflow.slug,
      loading: true,
      error: null,
      executionId: null,
      stepRuns: selectedWorkflow.steps.map((step, index) => ({
        id: step.id,
        stepKey: step.stepKey,
        title: step.title,
        agentSlug: step.agentSlug,
        status: index === 0 ? "running" : "pending",
        outputText: "",
      })),
      finalOutputText: "",
    });

    try {
      const response = await fetch(`/api/workflows/${selectedWorkflow.slug}/run`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputData: formState,
        }),
      });

      const payload = (await response.json()) as
        | {
            success: true;
            execution: {
              id: string;
              status: "pending" | "running" | "completed" | "failed";
              started_at: string;
              completed_at: string | null;
            };
            workflow: {
              id: string;
              slug: string;
              name: string;
            };
            stepRuns: Array<{
              id: string;
              stepKey: string;
              title: string;
              agentSlug: string;
              status: "pending" | "running" | "completed" | "failed" | "skipped";
              outputData: unknown;
            }>;
            finalOutput: { text?: string } | string;
          }
        | {
            success: false;
            error: string;
          };

      if (!response.ok || !payload.success) {
        const errorMessage =
          "error" in payload ? payload.error : "No se pudo ejecutar el workflow.";
        setRunState((current) => ({
          ...current,
          loading: false,
          error: errorMessage,
        }));
        return;
      }

      const normalizedExecution: DashboardWorkflowExecution = {
        id: payload.execution.id,
        workflowId: payload.workflow.id,
        workflowSlug: payload.workflow.slug,
        workflowName: payload.workflow.name,
        status: payload.execution.status,
        startedAt: payload.execution.started_at,
        completedAt: payload.execution.completed_at,
        finalOutputText:
          typeof payload.finalOutput === "string"
            ? payload.finalOutput
            : payload.finalOutput?.text ?? "",
        stepRuns: payload.stepRuns.map((stepRun) => ({
          id: stepRun.id,
          stepKey: stepRun.stepKey,
          title: stepRun.title,
          agentSlug: stepRun.agentSlug,
          status: stepRun.status,
          outputText:
            typeof stepRun.outputData === "object" &&
            stepRun.outputData !== null &&
            "text" in stepRun.outputData &&
            typeof stepRun.outputData.text === "string"
              ? stepRun.outputData.text
              : JSON.stringify(stepRun.outputData ?? "", null, 2),
        })),
      };

      setWorkflowExecutions((current) => [normalizedExecution, ...current]);
      setRunState({
        workflowSlug: selectedWorkflow.slug,
        loading: false,
        error: null,
        executionId: normalizedExecution.id,
        stepRuns: normalizedExecution.stepRuns,
        finalOutputText: normalizedExecution.finalOutputText,
      });
    } catch (error) {
      setRunState((current) => ({
        ...current,
        loading: false,
        error:
          error instanceof Error
            ? error.message
            : "No se pudo ejecutar el workflow.",
      }));
    }
  }

  if (workflows.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="max-w-xl rounded-[2rem] border border-white/10 bg-white/[0.03] p-8 text-center">
          <Sparkles className="mx-auto h-5 w-5 text-[#d7f205]" />
          <h2 className="mt-4 text-2xl font-light text-white">
            El modo workflow se activa al comprar un workflow
          </h2>
          <p className="mt-3 text-sm leading-7 text-white/62">
            Compra un paquete en `/workflows` y este espacio se convertira en tu
            consola para ejecutar equipos de agentes y revisar resultados.
          </p>
          <Link
            href="/workflows"
            className="mt-6 inline-flex items-center gap-2 rounded-full border border-[#d7f205]/20 bg-[#d7f205]/10 px-5 py-3 text-sm text-[#f3ffc1] transition hover:bg-[#d7f205]/15"
          >
            Explorar workflows
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      <aside className="hidden w-[290px] flex-shrink-0 flex-col border-r border-white/6 bg-[#0d0d0d] xl:flex">
        <div className="border-b border-white/6 p-4">
          <p className="text-[0.68rem] uppercase tracking-[0.22em] text-[#d7f205]">
            Workflow Mode
          </p>
          <h2 className="mt-3 text-lg font-medium text-white">
            Equipos de agentes comprados
          </h2>
          <p className="mt-2 text-xs leading-6 text-white/46">
            Ejecuta paquetes secuenciales con contexto compartido y revisa su historial.
          </p>
        </div>

        <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-3">
          {workflows.map((workflow) => {
            const isSelected = workflow.slug === selectedWorkflow?.slug;
            const executionCount = workflowExecutions.filter(
              (execution) => execution.workflowSlug === workflow.slug,
            ).length;

            return (
              <button
                key={workflow.id}
                type="button"
                onClick={() => setSelectedWorkflowSlug(workflow.slug)}
                className={`rounded-2xl border p-4 text-left transition ${
                  isSelected
                    ? "border-[#d7f205]/30 bg-[#d7f205]/8"
                    : "border-white/8 bg-white/[0.03] hover:border-white/16"
                }`}
              >
                <p className="text-sm text-white">{workflow.name}</p>
                <p className="mt-2 text-xs leading-6 text-white/48">
                  {workflow.shortDescription}
                </p>
                <p className="mt-3 text-[10px] uppercase tracking-[0.18em] text-white/30">
                  {executionCount} ejecuciones
                </p>
              </button>
            );
          })}
        </div>
      </aside>

      <main className="flex flex-1 flex-col overflow-y-auto">
        {selectedWorkflow ? (
          <>
            <div className="border-b border-white/6 px-5 py-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-[0.68rem] uppercase tracking-[0.24em] text-[#d7f205]">
                    Workflow activo
                  </p>
                  <h1 className="mt-2 text-2xl font-light text-white">
                    {selectedWorkflow.name}
                  </h1>
                  <p className="mt-2 max-w-3xl text-sm leading-7 text-white/60">
                    {selectedWorkflow.description}
                  </p>
                </div>
                <div className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs text-white/55">
                  {selectedWorkflow.steps.length} etapas
                </div>
              </div>
            </div>

            <div className="grid gap-6 px-5 py-5 2xl:grid-cols-[1.05fr_0.95fr]">
              <section className="grid gap-5">
                <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-5">
                  <p className="text-[0.72rem] uppercase tracking-[0.18em] text-white/38">
                    Pipeline
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {selectedWorkflow.steps.map((step, index) => (
                      <div key={step.id} className="flex items-center gap-2">
                        <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-[0.72rem] text-white/82">
                          {step.position}. {step.title}
                        </span>
                        {index < selectedWorkflow.steps.length - 1 ? (
                          <ArrowRight className="size-3.5 text-white/30" />
                        ) : null}
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 rounded-2xl border border-white/8 bg-black/20 px-4 py-4">
                    <p className="text-[0.72rem] uppercase tracking-[0.18em] text-white/40">
                      Entregable
                    </p>
                    <p className="mt-2 text-sm leading-7 text-white/75">
                      {selectedWorkflow.deliverable}
                    </p>
                  </div>
                </div>

                <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[0.72rem] uppercase tracking-[0.18em] text-white/38">
                        Ejecutar workflow
                      </p>
                      <p className="mt-2 text-sm leading-7 text-white/58">
                        Define el objetivo y deja que el equipo de agentes avance en secuencia.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleRunWorkflow}
                      disabled={runState.loading}
                      className="inline-flex items-center gap-2 rounded-full border border-[#d7f205]/25 bg-[#d7f205]/12 px-5 py-3 text-sm text-[#f3ffc1] transition hover:bg-[#d7f205]/18 disabled:cursor-not-allowed disabled:opacity-55"
                    >
                      <Play className="size-4" />
                      {runState.loading ? "Ejecutando" : "Correr workflow"}
                    </button>
                  </div>

                  <div className="mt-5 grid gap-3">
                    <label className="grid gap-2 text-sm text-white/70">
                      Objetivo de negocio
                      <textarea
                        value={formState.business_goal}
                        onChange={(event) =>
                          setFormState((current) => ({
                            ...current,
                            business_goal: event.target.value,
                          }))
                        }
                        className="min-h-28 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition focus:border-[#d7f205]/35"
                      />
                    </label>
                    <label className="grid gap-2 text-sm text-white/70">
                      Oferta
                      <input
                        value={formState.offer}
                        onChange={(event) =>
                          setFormState((current) => ({
                            ...current,
                            offer: event.target.value,
                          }))
                        }
                        className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition focus:border-[#d7f205]/35"
                      />
                    </label>
                    <div className="grid gap-3 md:grid-cols-2">
                      <label className="grid gap-2 text-sm text-white/70">
                        Geografia
                        <input
                          value={formState.geography}
                          onChange={(event) =>
                            setFormState((current) => ({
                              ...current,
                              geography: event.target.value,
                            }))
                          }
                          className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition focus:border-[#d7f205]/35"
                        />
                      </label>
                      <label className="grid gap-2 text-sm text-white/70">
                        Segmento objetivo
                        <input
                          value={formState.target_segment}
                          onChange={(event) =>
                            setFormState((current) => ({
                              ...current,
                              target_segment: event.target.value,
                            }))
                          }
                          className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition focus:border-[#d7f205]/35"
                        />
                      </label>
                    </div>
                  </div>

                  {runState.workflowSlug === selectedWorkflow.slug ? (
                    <div className="mt-5 grid gap-4">
                      <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-medium text-white">Estado por etapa</p>
                          {runState.executionId ? (
                            <span className="text-[0.68rem] uppercase tracking-[0.18em] text-white/40">
                              Exec {runState.executionId.slice(0, 8)}
                            </span>
                          ) : null}
                        </div>

                        <div className="mt-4 grid gap-3">
                          {runState.stepRuns.map((stepRun) => (
                            <div
                              key={stepRun.id}
                              className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-4"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                  <p className="text-sm text-white">{stepRun.title}</p>
                                  <p className="mt-1 text-xs uppercase tracking-[0.16em] text-white/42">
                                    {stepRun.agentSlug}
                                  </p>
                                </div>
                                <span
                                  className={`rounded-full border px-3 py-1 text-[0.65rem] uppercase tracking-[0.18em] ${getStatusPillClass(stepRun.status)}`}
                                >
                                  {stepRun.status}
                                </span>
                              </div>
                              {stepRun.outputText ? (
                                <pre className="mt-4 overflow-x-auto whitespace-pre-wrap text-xs leading-6 text-white/68">
                                  {stepRun.outputText}
                                </pre>
                              ) : stepRun.status === "running" ? (
                                <div className="mt-4 inline-flex items-center gap-2 text-xs text-cyan-200/80">
                                  <CircleDashed className="size-3.5 animate-spin" />
                                  Ejecutando paso...
                                </div>
                              ) : null}
                            </div>
                          ))}
                        </div>

                        {runState.error ? (
                          <div className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
                            {runState.error}
                          </div>
                        ) : null}
                      </div>

                      {runState.finalOutputText ? (
                        <div className="rounded-2xl border border-white/8 bg-[#0b110d] p-4">
                          <div className="flex items-center gap-2 text-sm text-white">
                            <CheckCircle2 className="size-4 text-emerald-300" />
                            Resultado final consolidado
                          </div>
                          <pre className="mt-4 overflow-x-auto whitespace-pre-wrap text-xs leading-6 text-white/74">
                            {runState.finalOutputText}
                          </pre>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </section>

              <section className="grid gap-5">
                <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-5">
                  <p className="text-[0.72rem] uppercase tracking-[0.18em] text-white/38">
                    Historial
                  </p>
                  <div className="mt-4 grid gap-3">
                    {selectedWorkflowExecutions.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-6 text-sm text-white/45">
                        Todavia no has ejecutado este workflow.
                      </div>
                    ) : (
                      selectedWorkflowExecutions.map((execution) => (
                        <div
                          key={execution.id}
                          className="rounded-2xl border border-white/8 bg-black/20 px-4 py-4"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <p className="text-sm text-white">{execution.workflowName}</p>
                              <p className="mt-1 text-xs text-white/42">
                                {formatDateTime(execution.startedAt)}
                              </p>
                            </div>
                            <span
                              className={`rounded-full border px-3 py-1 text-[0.65rem] uppercase tracking-[0.18em] ${getStatusPillClass(execution.status)}`}
                            >
                              {execution.status}
                            </span>
                          </div>

                          {execution.finalOutputText ? (
                            <pre className="mt-4 max-h-64 overflow-x-auto overflow-y-auto whitespace-pre-wrap text-xs leading-6 text-white/66">
                              {execution.finalOutputText}
                            </pre>
                          ) : null}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </section>
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
}
