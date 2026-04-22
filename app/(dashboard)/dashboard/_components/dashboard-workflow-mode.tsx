"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  CircleDashed,
  FileText,
  MessageSquare,
  Play,
  Share2,
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

function cleanFormattedLine(line: string) {
  return line
    .replace(/^#{1,6}\s+/, "")
    .replace(/^\*\s+/, "- ")
    .replace(/^[-*]{3,}$/, "")
    .trim();
}

function renderInlineContent(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return (
        <strong key={`${part}-${index}`} className="font-semibold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }

    return <span key={`${part}-${index}`}>{part.replace(/\*/g, "")}</span>;
  });
}

function renderFormattedOutput(content: string) {
  const blocks: ReactNode[] = [];
  let paragraphLines: string[] = [];
  let bulletLines: string[] = [];

  const flushParagraph = () => {
    const paragraph = paragraphLines.join(" ").trim();
    paragraphLines = [];

    if (!paragraph) {
      return;
    }

    blocks.push(
      <p key={`paragraph-${blocks.length}`} className="text-sm leading-7 text-white/72">
        {renderInlineContent(paragraph)}
      </p>,
    );
  };

  const flushBullets = () => {
    const bullets = bulletLines.map((line) => line.trim()).filter(Boolean);
    bulletLines = [];

    if (bullets.length === 0) {
      return;
    }

    blocks.push(
      <ul key={`bullets-${blocks.length}`} className="space-y-2 pl-4">
        {bullets.map((line, index) => (
          <li
            key={`${line}-${index}`}
            className="list-disc text-sm leading-6 text-white/68 marker:text-[#d7f205]/70"
          >
            {renderInlineContent(line)}
          </li>
        ))}
      </ul>,
    );
  };

  for (const rawLine of content.replace(/\r\n/g, "\n").split("\n")) {
    const line = cleanFormattedLine(rawLine);

    if (!line) {
      flushParagraph();
      flushBullets();
      continue;
    }

    if (/^[-]\s+/.test(line)) {
      flushParagraph();
      bulletLines.push(line.replace(/^[-]\s+/, ""));
      continue;
    }

    if (/^\d+\.\s+\S/.test(line) && line.length < 90) {
      flushParagraph();
      flushBullets();
      blocks.push(
        <h4
          key={`heading-${blocks.length}`}
          className="pt-2 text-sm font-semibold uppercase tracking-[0.08em] text-[#f3ffc1]"
        >
          {renderInlineContent(line)}
        </h4>,
      );
      continue;
    }

    if (/^[A-ZÁÉÍÓÚÑa-záéíóúñ][^.!?]{2,72}:$/.test(line)) {
      flushParagraph();
      flushBullets();
      blocks.push(
        <h4
          key={`heading-${blocks.length}`}
          className="pt-2 text-sm font-semibold text-white"
        >
          {renderInlineContent(line.replace(/:$/, ""))}
        </h4>,
      );
      continue;
    }

    flushBullets();
    paragraphLines.push(line);
  }

  flushParagraph();
  flushBullets();

  return <div className="space-y-3">{blocks}</div>;
}

function getAgentTone(agentSlug: string) {
  if (agentSlug === "lead-generation") {
    return {
      label: "Lead agent",
      color: "border-cyan-400/25 bg-cyan-400/10 text-cyan-100",
      dot: "bg-cyan-300",
    };
  }

  if (agentSlug === "marketing-content") {
    return {
      label: "Marketing agent",
      color: "border-amber-300/25 bg-amber-300/10 text-amber-100",
      dot: "bg-amber-200",
    };
  }

  if (agentSlug === "research") {
    return {
      label: "Research agent",
      color: "border-[#8f90ff]/30 bg-[#8f90ff]/12 text-[#dfe0ff]",
      dot: "bg-[#8f90ff]",
    };
  }

  return {
    label: "Agent",
    color: "border-white/12 bg-white/[0.05] text-white/75",
    dot: "bg-white/45",
  };
}

function WorkflowDataFlow({ workflow }: { workflow: DashboardWorkflow }) {
  return (
    <div className="rounded-[1.2rem] border border-white/10 bg-[#0b0d10] p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[0.68rem] uppercase tracking-[0.2em] text-[#d7f205]">
            Flujo de contexto
          </p>
          <p className="mt-2 text-sm text-white/72">
            Cada agente recibe el resultado anterior y agrega su parte al contexto compartido.
          </p>
        </div>
        <Share2 className="size-4 text-white/35" />
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-[repeat(auto-fit,minmax(160px,1fr))]">
        {workflow.steps.map((step, index) => {
          const tone = getAgentTone(step.agentSlug);

          return (
            <div key={step.id} className="relative">
              <div className={`min-h-[8.5rem] rounded-2xl border p-4 ${tone.color}`}>
                <div className="flex items-center justify-between gap-3">
                  <span className="flex size-9 items-center justify-center rounded-xl border border-white/10 bg-black/20">
                    <Bot className="size-4" />
                  </span>
                  <span className="text-[0.62rem] uppercase tracking-[0.16em] opacity-70">
                    Paso {step.position}
                  </span>
                </div>
                <h3 className="mt-4 text-sm font-medium text-white">{step.title}</h3>
                <p className="mt-2 text-[11px] uppercase tracking-[0.16em] text-white/42">
                  {tone.label}
                </p>
              </div>

              {index < workflow.steps.length - 1 ? (
                <div className="absolute -right-4 top-1/2 z-10 hidden -translate-y-1/2 items-center lg:flex">
                  <span className="h-px w-5 bg-[#d7f205]/30" />
                  <ArrowRight className="size-4 text-[#d7f205]/75" />
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
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
                <WorkflowDataFlow workflow={selectedWorkflow} />

                <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[0.72rem] uppercase tracking-[0.18em] text-white/38">
                        Sala de ejecucion
                      </p>
                      <p className="mt-2 text-sm leading-7 text-white/58">
                        Escribe el brief como mensaje inicial y ajusta los datos clave del contexto.
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

                  <div className="mt-5 rounded-[1.2rem] border border-white/8 bg-[#0b0b0b] p-4">
                    <div className="flex items-start gap-3">
                      <span className="flex size-9 flex-shrink-0 items-center justify-center rounded-xl bg-[#d7f205] text-black">
                        <MessageSquare className="size-4" />
                      </span>
                      <label className="grid flex-1 gap-2 text-sm text-white/70">
                        Mensaje para el equipo
                      <textarea
                        value={formState.business_goal}
                        onChange={(event) =>
                          setFormState((current) => ({
                            ...current,
                            business_goal: event.target.value,
                          }))
                        }
                        className="min-h-28 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition focus:border-[#d7f205]/35"
                        placeholder="Ej. Quiero lanzar una oferta de automatizacion para clinicas privadas en Managua..."
                      />
                      </label>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                      <label className="grid gap-2 text-xs uppercase tracking-[0.16em] text-white/38">
                        Oferta
                      <input
                        value={formState.offer}
                        onChange={(event) =>
                          setFormState((current) => ({
                            ...current,
                            offer: event.target.value,
                          }))
                        }
                        className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm normal-case tracking-normal text-white outline-none transition focus:border-[#d7f205]/35"
                        placeholder="Producto o servicio"
                      />
                      </label>
                      <label className="grid gap-2 text-xs uppercase tracking-[0.16em] text-white/38">
                        Geografia
                        <input
                          value={formState.geography}
                          onChange={(event) =>
                            setFormState((current) => ({
                              ...current,
                              geography: event.target.value,
                            }))
                          }
                          className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm normal-case tracking-normal text-white outline-none transition focus:border-[#d7f205]/35"
                          placeholder="Pais, ciudad o region"
                        />
                      </label>
                      <label className="grid gap-2 text-xs uppercase tracking-[0.16em] text-white/38">
                        Segmento objetivo
                        <input
                          value={formState.target_segment}
                          onChange={(event) =>
                            setFormState((current) => ({
                              ...current,
                              target_segment: event.target.value,
                            }))
                          }
                          className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm normal-case tracking-normal text-white outline-none transition focus:border-[#d7f205]/35"
                          placeholder="Buyer o nicho"
                        />
                      </label>
                    </div>

                    <div className="mt-4 flex items-start gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                      <FileText className="mt-0.5 size-4 flex-shrink-0 text-[#d7f205]" />
                      <p className="text-sm leading-6 text-white/62">
                        Entregable: {selectedWorkflow.deliverable}
                      </p>
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
                          {runState.stepRuns.map((stepRun, index) => {
                            const tone = getAgentTone(stepRun.agentSlug);

                            return (
                            <div
                              key={stepRun.id}
                              className="relative rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-4"
                            >
                              {index > 0 ? (
                                <div className="absolute -top-3 left-8 flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-white/28">
                                  <span className="h-3 w-px bg-[#d7f205]/30" />
                                  contexto recibido
                                </div>
                              ) : null}
                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                  <span className={`flex size-9 items-center justify-center rounded-xl border ${tone.color}`}>
                                    <Bot className="size-4" />
                                  </span>
                                  <div>
                                  <p className="text-sm text-white">{stepRun.title}</p>
                                  <p className="mt-1 text-xs uppercase tracking-[0.16em] text-white/42">
                                    {stepRun.agentSlug}
                                  </p>
                                  </div>
                                </div>
                                <span
                                  className={`rounded-full border px-3 py-1 text-[0.65rem] uppercase tracking-[0.18em] ${getStatusPillClass(stepRun.status)}`}
                                >
                                  {stepRun.status}
                                </span>
                              </div>
                              {stepRun.outputText ? (
                                <div className="mt-4 rounded-2xl border border-white/8 bg-black/20 px-4 py-4">
                                  {renderFormattedOutput(stepRun.outputText)}
                                </div>
                              ) : stepRun.status === "running" ? (
                                <div className="mt-4 inline-flex items-center gap-2 text-xs text-cyan-200/80">
                                  <CircleDashed className="size-3.5 animate-spin" />
                                  Ejecutando paso...
                                </div>
                              ) : null}
                            </div>
                            );
                          })}
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
                          <div className="mt-4 rounded-2xl border border-white/8 bg-black/20 px-4 py-4">
                            {renderFormattedOutput(runState.finalOutputText)}
                          </div>
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
                            <div className="mt-4 max-h-64 overflow-y-auto rounded-2xl border border-white/8 bg-black/20 px-4 py-4">
                              {renderFormattedOutput(execution.finalOutputText)}
                            </div>
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
