import { AgentExecutionError, runAgent } from "@/ai/agent-runner";
import {
  findProfileById,
  findWorkflowWithSteps,
  getWorkflowInputKeys,
  getWorkflowOutputKeys,
  listPurchasedWorkflowIds,
} from "@/lib/workflows";
import { supabaseAdmin } from "@/lib/supabase";

import type { AgentProgressReporter } from "@/ai/execution-events";
import type { Database, Json } from "@/types/database";

type AgentRow = Database["public"]["Tables"]["agents"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type WorkflowRow = Database["public"]["Tables"]["workflows"]["Row"];
type WorkflowStepRow = Database["public"]["Tables"]["workflow_steps"]["Row"];
type WorkflowExecutionRow =
  Database["public"]["Tables"]["workflow_executions"]["Row"];
type WorkflowStepRunRow =
  Database["public"]["Tables"]["workflow_step_runs"]["Row"];

type WorkflowContext = Record<string, Json>;

export type WorkflowRunInput = {
  profileId: string;
  workflowId?: string;
  workflowSlug?: string;
  inputData: WorkflowContext;
  onProgress?: AgentProgressReporter;
};

export type WorkflowStepRunResult = {
  id: string;
  workflowStepId: string;
  title: string;
  stepKey: string;
  agentSlug: string;
  status: WorkflowStepRunRow["status"];
  inputData: Json;
  outputData: Json | null;
  startedAt: string;
  completedAt: string | null;
};

export type WorkflowRunResult = {
  workflow: Pick<WorkflowRow, "id" | "slug" | "name" | "price" | "currency">;
  execution: WorkflowExecutionRow;
  stepRuns: WorkflowStepRunResult[];
  sharedContext: WorkflowContext;
  finalOutput: Json;
};

const requiredWorkflowInputKeys = ["business_goal", "offer"] as const;
const sharedContextPriorityKeys = [
  "business_goal",
  "offer",
  "geography",
  "target_segment",
  "research_findings",
  "selected_icps",
  "lead_list",
  "messaging_angles",
  "final_assets",
] as const;

function isRecord(value: Json | Record<string, unknown> | unknown): value is Record<
  string,
  unknown
> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function asWorkflowContext(value: unknown): WorkflowContext {
  if (!isRecord(value)) {
    throw new AgentExecutionError("inputData must be an object.", 400);
  }

  const normalizedEntries = Object.entries(value).flatMap(([key, rawValue]) => {
    if (typeof key !== "string" || !key.trim()) {
      return [];
    }

    if (
      rawValue === null ||
      typeof rawValue === "string" ||
      typeof rawValue === "number" ||
      typeof rawValue === "boolean" ||
      Array.isArray(rawValue) ||
      isRecord(rawValue)
    ) {
      return [[key.trim(), rawValue as Json]] as const;
    }

    return [[key.trim(), String(rawValue)]] as const;
  });

  const normalized = Object.fromEntries(normalizedEntries) as WorkflowContext;

  for (const key of requiredWorkflowInputKeys) {
    const value = normalized[key];
    if (typeof value !== "string" || !value.trim()) {
      throw new AgentExecutionError(`${key} is required.`, 400);
    }
  }

  return normalized;
}

function canExecuteWorkflow({
  workflow,
  profile,
  purchasedWorkflowIds,
}: {
  workflow: WorkflowRow;
  profile: ProfileRow;
  purchasedWorkflowIds: Set<string>;
}) {
  if (!workflow.is_active || workflow.status !== "published" || !workflow.is_published) {
    return false;
  }

  if (profile.role === "admin" || workflow.owner_profile_id === profile.id) {
    return true;
  }

  if (workflow.pricing_type === "free") {
    return true;
  }

  return purchasedWorkflowIds.has(workflow.id);
}

async function findRunnableAgentBySlug(agentSlug: string) {
  const result = await supabaseAdmin
    .from("agents")
    .select("*")
    .eq("slug", agentSlug)
    .eq("is_active", true)
    .eq("is_published", true)
    .eq("status", "published")
    .maybeSingle();

  if (result.error) {
    throw new AgentExecutionError(result.error.message, 500);
  }

  if (!result.data) {
    throw new AgentExecutionError(`Agent "${agentSlug}" was not found.`, 404);
  }

  return result.data satisfies AgentRow;
}

function pickContextForStep(sharedContext: WorkflowContext, step: WorkflowStepRow) {
  const inputKeys = getWorkflowInputKeys(step.input_mapping);

  if (inputKeys.length === 0) {
    return sharedContext;
  }

  return Object.fromEntries(
    inputKeys.flatMap((key) =>
      key in sharedContext ? [[key, sharedContext[key]]] : [],
    ),
  ) as WorkflowContext;
}

function detectPreferredLanguage(sharedContext: WorkflowContext) {
  const text = [
    sharedContext.business_goal,
    sharedContext.offer,
    sharedContext.geography,
    sharedContext.target_segment,
  ]
    .filter((value): value is string => typeof value === "string")
    .join(" ")
    .toLowerCase();

  const spanishSignals = [
    " para ",
    " con ",
    " quiero ",
    " clinica",
    " clinicas",
    " salud",
    " seguimiento",
    " automatizacion",
    " nicaragua",
    " managua",
    " oferta",
    " objetivo",
    " pacientes",
  ];
  const englishSignals = [
    " the ",
    " and ",
    " with ",
    " goal ",
    " market ",
    " leads ",
    " healthcare ",
  ];
  const spanishScore = spanishSignals.filter((signal) => text.includes(signal)).length;
  const englishScore = englishSignals.filter((signal) => text.includes(signal)).length;

  return spanishScore >= englishScore ? "es" : "en";
}

function summarizeContextValue(value: Json | undefined) {
  if (value == null) {
    return "";
  }

  if (typeof value === "string") {
    return value.trim();
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return JSON.stringify(value, null, 2);
}

function buildWorkflowContextBrief(sharedContext: WorkflowContext) {
  return sharedContextPriorityKeys
    .flatMap((key) => {
      const value = summarizeContextValue(sharedContext[key]);

      if (!value) {
        return [];
      }

      return [`- ${key}: ${value}`];
    })
    .join("\n");
}

function buildStepSpecificGuidance(step: WorkflowStepRow, language: "es" | "en") {
  if (language === "es") {
    if (step.agent_slug === "research") {
      return [
        "Haz investigacion orientada a decision, no un resumen generico.",
        "Si faltan datos observados, explicita limites sin rellenar con vaguedades.",
        "Entrega hallazgos claros que luego sirvan al equipo de leads y marketing.",
      ].join("\n");
    }

    if (step.agent_slug === "lead-generation") {
      return [
        "Prioriza segmentos y cuentas con criterio comercial real.",
        "Si no tienes empresas verificadas, devuelve una lista de cuentas objetivo o blueprint de cuentas claramente etiquetada como priorizacion, no finjas leads reales.",
        "Tu salida debe dejarle material concreto al paso de marketing para construir mensajes mas especificos.",
      ].join("\n");
    }

    if (step.agent_slug === "marketing-content") {
      return [
        "Construye el mensaje apoyandote de forma explicita en research_findings, selected_icps y lead_list cuando existan.",
        "Evita copy generico de SaaS o marketing vacio.",
        "Entrega assets listos para usar, con lenguaje natural y comercialmente creible.",
      ].join("\n");
    }

    return "Entrega una salida util para el siguiente paso del workflow.";
  }

  if (step.agent_slug === "research") {
    return [
      "Produce decision-ready research, not a generic overview.",
      "If evidence is limited, say so plainly instead of filling space with vague claims.",
      "Deliver findings that help the leads and marketing steps act with more precision.",
    ].join("\n");
  }

  if (step.agent_slug === "lead-generation") {
    return [
      "Prioritize segments and target accounts with real commercial logic.",
      "If you do not have verified companies, return a clearly labeled target-account blueprint instead of pretending you found real leads.",
      "Give marketing enough concrete material to produce sharper messaging.",
    ].join("\n");
  }

  if (step.agent_slug === "marketing-content") {
    return [
      "Build messaging directly from research_findings, selected_icps, and lead_list whenever they exist.",
      "Avoid generic SaaS copy or vague marketing filler.",
      "Return assets that sound usable, natural, and commercially credible.",
    ].join("\n");
  }

  return "Deliver output that advances the workflow clearly.";
}

function buildStepPrompt({
  workflow,
  step,
  stepContext,
}: {
  workflow: WorkflowRow;
  step: WorkflowStepRow;
  stepContext: WorkflowContext;
}) {
  const outputKeys = getWorkflowOutputKeys(step.output_mapping);
  const language = detectPreferredLanguage(stepContext);

  if (language === "es") {
    return [
      `Estas ejecutando el paso ${step.position} del workflow de Miunix "${workflow.name}".`,
      `Titulo del paso: ${step.title}.`,
      `Clave del paso: ${step.step_key}.`,
      `Agente responsable: ${step.agent_slug}.`,
      outputKeys.length > 0
        ? `Tu salida debe servir para poblar estas claves del contexto compartido: ${outputKeys.join(", ")}.`
        : "Tu salida debe avanzar el workflow y quedar lista para persistirse.",
      "Construye sobre el contexto ya existente. No reinicies el analisis desde cero ni ignores lo que ya resolvieron pasos anteriores.",
      "Responde en espanol.",
      "No abras con encabezados Markdown tipo # o ##.",
      "No repitas el nombre del paso como titulo en la primera linea.",
      "No devuelvas bloques innecesarios como 'Output', 'Final answer' o titulos duplicados.",
      "Prefiere una salida ejecutiva, directa y accionable.",
      `Guia especifica del paso:\n${buildStepSpecificGuidance(step, language)}`,
      `Resumen del contexto compartido:\n${buildWorkflowContextBrief(stepContext)}`,
      `Contexto compartido completo en JSON:\n${JSON.stringify(stepContext, null, 2)}`,
    ].join("\n\n");
  }

  return [
    `You are executing step ${step.position} of the Miunix workflow "${workflow.name}".`,
    `Step title: ${step.title}.`,
    `Step key: ${step.step_key}.`,
    `Agent in charge: ${step.agent_slug}.`,
    outputKeys.length > 0
      ? `Your output must help populate these shared-context keys: ${outputKeys.join(", ")}.`
      : "Your output must advance the workflow and be ready to persist.",
    "Build on the existing workflow context. Do not restart from zero or ignore prior steps.",
    "Respond in English.",
    "Do not open with Markdown headings like # or ##.",
    "Do not repeat the step title in the first line.",
    "Do not include noisy wrappers such as 'Output' or 'Final answer'.",
    "Keep the result executive, direct, and actionable.",
    `Step-specific guidance:\n${buildStepSpecificGuidance(step, language)}`,
    `Shared-context summary:\n${buildWorkflowContextBrief(stepContext)}`,
    `Full shared context JSON:\n${JSON.stringify(stepContext, null, 2)}`,
  ].join("\n\n");
}

function buildStoredStepOutput({
  step,
  output,
  stepContext,
}: {
  step: WorkflowStepRow;
  output: string;
  stepContext: WorkflowContext;
}) {
  return {
    step_key: step.step_key,
    title: step.title,
    agent_slug: step.agent_slug,
    text: output,
    generated_at: new Date().toISOString(),
    input_context: stepContext,
  } satisfies Record<string, Json>;
}

function mergeStepOutputIntoContext({
  sharedContext,
  step,
  storedOutput,
}: {
  sharedContext: WorkflowContext;
  step: WorkflowStepRow;
  storedOutput: Record<string, Json>;
}) {
  const nextContext: WorkflowContext = {
    ...sharedContext,
    workflow_last_step: step.step_key,
  };
  const outputKeys = getWorkflowOutputKeys(step.output_mapping);

  for (const key of outputKeys) {
    nextContext[key] = storedOutput;
  }

  const existingStepOutputs = isRecord(nextContext.workflow_step_outputs)
    ? nextContext.workflow_step_outputs
    : {};

  nextContext.workflow_step_outputs = {
    ...existingStepOutputs,
    [step.step_key]: storedOutput,
  };

  return nextContext;
}

function extractTextFromJson(value: Json | null | undefined) {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (isRecord(value) && typeof value.text === "string") {
    return value.text;
  }

  return JSON.stringify(value, null, 2);
}

function normalizeWorkflowSectionText({
  step,
  text,
}: {
  step: WorkflowStepRow;
  text: string;
}) {
  let normalized = text
    .replace(/\r\n/g, "\n")
    .replace(/^#{1,6}\s+/gm, "")
    .trim();

  if (!normalized) {
    return "No output captured.";
  }

  const lines = normalized.split("\n");
  const normalizedStepTitle = step.title.trim().toLowerCase();
  const stepKeyLabel = step.step_key.trim().toLowerCase();
  const dropLine = (line: string) => {
    const candidate = line
      .trim()
      .toLowerCase()
      .replace(/[:\-]+$/g, "")
      .replace(/\s+/g, " ");

    if (!candidate) {
      return true;
    }

    if (candidate === normalizedStepTitle || candidate === stepKeyLabel) {
      return true;
    }

    if (
      candidate.includes(normalizedStepTitle) ||
      candidate.includes(`${normalizedStepTitle} output`) ||
      candidate.includes(`${stepKeyLabel} output`) ||
      candidate.includes("final answer")
    ) {
      return true;
    }

    return false;
  };

  while (lines.length > 0 && dropLine(lines[0] ?? "")) {
    lines.shift();
  }

  normalized = lines.join("\n").trim();

  return normalized || "No output captured.";
}

function buildExecutiveHeader(sharedContext: WorkflowContext) {
  const businessGoal = summarizeContextValue(sharedContext.business_goal);
  const offer = summarizeContextValue(sharedContext.offer);
  const geography = summarizeContextValue(sharedContext.geography);
  const targetSegment = summarizeContextValue(sharedContext.target_segment);

  return [
    businessGoal ? `Objetivo de negocio: ${businessGoal}` : "",
    offer ? `Oferta: ${offer}` : "",
    geography ? `Geografia: ${geography}` : "",
    targetSegment ? `Segmento objetivo: ${targetSegment}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function buildFinalOutput({
  workflow,
  sharedContext,
  stepRuns,
}: {
  workflow: WorkflowRow;
  sharedContext: WorkflowContext;
  stepRuns: Array<{
    step: WorkflowStepRow;
    stepRun: WorkflowStepRunRow;
  }>;
}) {
  const header = buildExecutiveHeader(sharedContext);
  const sections = stepRuns.map(({ step, stepRun }) => {
    const text = normalizeWorkflowSectionText({
      step,
      text: extractTextFromJson(stepRun.output_data),
    });

    return `${step.title}\n${text}`;
  });

  return {
    workflow_slug: workflow.slug,
    workflow_name: workflow.name,
    shared_context: sharedContext,
    text: [header, sections.join("\n\n")].filter(Boolean).join("\n\n"),
  } satisfies Record<string, Json>;
}

async function createWorkflowExecution({
  workflow,
  profile,
  inputData,
}: {
  workflow: WorkflowRow;
  profile: ProfileRow;
  inputData: WorkflowContext;
}) {
  const result = await supabaseAdmin
    .from("workflow_executions")
    .insert({
      workflow_id: workflow.id,
      profile_id: profile.id,
      status: "running",
      input_data: inputData,
      shared_context: inputData,
    })
    .select("*")
    .single();

  if (result.error) {
    throw new AgentExecutionError(result.error.message, 500);
  }

  return result.data;
}

async function updateWorkflowExecution(
  executionId: string,
  payload: Partial<WorkflowExecutionRow>,
) {
  const result = await supabaseAdmin
    .from("workflow_executions")
    .update(payload)
    .eq("id", executionId)
    .select("*")
    .single();

  if (result.error) {
    throw new AgentExecutionError(result.error.message, 500);
  }

  return result.data;
}

async function createWorkflowStepRun({
  executionId,
  step,
  agentId,
  inputData,
}: {
  executionId: string;
  step: WorkflowStepRow;
  agentId: string;
  inputData: WorkflowContext;
}) {
  const result = await supabaseAdmin
    .from("workflow_step_runs")
    .insert({
      workflow_execution_id: executionId,
      workflow_step_id: step.id,
      agent_id: agentId,
      status: "running",
      input_data: inputData,
    })
    .select("*")
    .single();

  if (result.error) {
    throw new AgentExecutionError(result.error.message, 500);
  }

  return result.data;
}

async function updateWorkflowStepRun(
  stepRunId: string,
  payload: Partial<WorkflowStepRunRow>,
) {
  const result = await supabaseAdmin
    .from("workflow_step_runs")
    .update(payload)
    .eq("id", stepRunId)
    .select("*")
    .single();

  if (result.error) {
    throw new AgentExecutionError(result.error.message, 500);
  }

  return result.data;
}

export async function executeWorkflow({
  profileId,
  workflowId,
  workflowSlug,
  inputData,
  onProgress,
}: WorkflowRunInput): Promise<WorkflowRunResult> {
  const normalizedInput = asWorkflowContext(inputData);

  const [profile, workflowData] = await Promise.all([
    findProfileById(profileId),
    findWorkflowWithSteps({
      workflowId,
      workflowSlug,
    }),
  ]);

  if (!profile) {
    throw new AgentExecutionError("Profile not found.", 404);
  }

  if (!workflowData) {
    throw new AgentExecutionError("Workflow not found.", 404);
  }

  if (workflowData.steps.length === 0) {
    throw new AgentExecutionError("Workflow has no configured steps.", 400);
  }

  const purchasedWorkflowIds = await listPurchasedWorkflowIds(profile.id);

  if (
    !canExecuteWorkflow({
      workflow: workflowData.workflow,
      profile,
      purchasedWorkflowIds,
    })
  ) {
    throw new AgentExecutionError(
      "You do not have permission to execute this workflow.",
      403,
    );
  }

  const execution = await createWorkflowExecution({
    workflow: workflowData.workflow,
    profile,
    inputData: normalizedInput,
  });

  let sharedContext = { ...normalizedInput };
  const collectedStepRuns: Array<{
    step: WorkflowStepRow;
    stepRun: WorkflowStepRunRow;
  }> = [];

  await onProgress?.({
    id: "workflow-started",
    kind: "status",
    label: "Workflow iniciado",
    status: "completed",
  });

  try {
    for (const step of workflowData.steps) {
      const runnableAgent = await findRunnableAgentBySlug(step.agent_slug);
      const stepContext = pickContextForStep(sharedContext, step);

      await onProgress?.({
        id: `workflow-step-${step.step_key}`,
        kind: "status",
        label: `Ejecutando ${step.title}`,
        status: "running",
      });

      const stepRun = await createWorkflowStepRun({
        executionId: execution.id,
        step,
        agentId: runnableAgent.id,
        inputData: stepContext,
      });

      try {
        const runResult = await runAgent(
          runnableAgent,
          buildStepPrompt({
            workflow: workflowData.workflow,
            step,
            stepContext,
          }),
        );
        const storedOutput = buildStoredStepOutput({
          step,
          output: runResult.output,
          stepContext,
        });
        const completedStepRun = await updateWorkflowStepRun(stepRun.id, {
          status: "completed",
          output_data: storedOutput,
          completed_at: new Date().toISOString(),
        });

        sharedContext = mergeStepOutputIntoContext({
          sharedContext,
          step,
          storedOutput,
        });

        await updateWorkflowExecution(execution.id, {
          shared_context: sharedContext,
        });

        collectedStepRuns.push({
          step,
          stepRun: completedStepRun,
        });

        await onProgress?.({
          id: `workflow-step-${step.step_key}`,
          kind: "status",
          label: `${step.title} completado`,
          status: "completed",
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unexpected workflow step error.";

        const failedStepRun = await updateWorkflowStepRun(stepRun.id, {
          status: "failed",
          output_data: {
            error: message,
            step_key: step.step_key,
          },
          completed_at: new Date().toISOString(),
        });

        collectedStepRuns.push({
          step,
          stepRun: failedStepRun,
        });

        await updateWorkflowExecution(execution.id, {
          status: "failed",
          shared_context: sharedContext,
          final_output: {
            error: message,
            failed_step: step.step_key,
            shared_context: sharedContext,
          },
          completed_at: new Date().toISOString(),
        });

        await onProgress?.({
          id: `workflow-step-${step.step_key}`,
          kind: "status",
          label: `${step.title} fallo`,
          status: "failed",
        });

        if (error instanceof AgentExecutionError) {
          throw error;
        }

        throw new AgentExecutionError(message, 500);
      }
    }

    const finalOutput = buildFinalOutput({
      workflow: workflowData.workflow,
      sharedContext,
      stepRuns: collectedStepRuns,
    });
    const completedExecution = await updateWorkflowExecution(execution.id, {
      status: "completed",
      shared_context: sharedContext,
      final_output: finalOutput,
      completed_at: new Date().toISOString(),
    });

    return {
      workflow: {
        id: workflowData.workflow.id,
        slug: workflowData.workflow.slug,
        name: workflowData.workflow.name,
        price: workflowData.workflow.price,
        currency: workflowData.workflow.currency,
      },
      execution: completedExecution,
      stepRuns: collectedStepRuns.map(({ step, stepRun }) => ({
        id: stepRun.id,
        workflowStepId: step.id,
        title: step.title,
        stepKey: step.step_key,
        agentSlug: step.agent_slug,
        status: stepRun.status,
        inputData: stepRun.input_data,
        outputData: stepRun.output_data,
        startedAt: stepRun.started_at,
        completedAt: stepRun.completed_at,
      })),
      sharedContext,
      finalOutput,
    };
  } catch (error) {
    if (error instanceof AgentExecutionError) {
      throw error;
    }

    const message =
      error instanceof Error ? error.message : "Unexpected workflow error.";
    throw new AgentExecutionError(message, 500);
  }
}

export function normalizeWorkflowInputData(inputData: unknown) {
  return asWorkflowContext(inputData);
}
