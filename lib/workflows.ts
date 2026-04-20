import { getAgentBySlug } from "@/lib/agents";
import { supabaseAdmin } from "@/lib/supabase";

import type { Database, Json } from "@/types/database";

type WorkflowRow = Database["public"]["Tables"]["workflows"]["Row"];
type WorkflowStepRow = Database["public"]["Tables"]["workflow_steps"]["Row"];
type WorkflowPurchaseRow =
  Database["public"]["Tables"]["workflow_purchases"]["Row"];
type WorkflowExecutionRow =
  Database["public"]["Tables"]["workflow_executions"]["Row"];
type WorkflowStepRunRow =
  Database["public"]["Tables"]["workflow_step_runs"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export type WorkflowAccessState =
  | "available"
  | "purchase_required"
  | "auth_required";

export type WorkflowAgentSummary = {
  slug: string;
  name: string;
};

export type WorkflowPresentation = {
  deliverable: string;
  benefits: string[];
};

export type WorkflowCatalogStep = Pick<
  WorkflowStepRow,
  | "id"
  | "position"
  | "agent_slug"
  | "step_key"
  | "title"
  | "input_mapping"
  | "output_mapping"
  | "is_required"
>;

export type WorkflowCatalogItem = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  price: string;
  currency: string;
  pricingType: WorkflowRow["pricing_type"];
  accessState: WorkflowAccessState;
  includedAgents: WorkflowAgentSummary[];
  steps: WorkflowCatalogStep[];
  deliverable: string;
  benefits: string[];
};

export type OwnedWorkflowItem = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  price: string;
  currency: string;
  pricingType: WorkflowRow["pricing_type"];
  includedAgents: WorkflowAgentSummary[];
  steps: WorkflowCatalogStep[];
  deliverable: string;
  benefits: string[];
};

export type WorkflowExecutionHistoryItem = {
  id: string;
  workflowId: string;
  workflowSlug: string;
  workflowName: string;
  status: WorkflowExecutionRow["status"];
  startedAt: string;
  completedAt: string | null;
  inputData: Json;
  sharedContext: Json;
  finalOutput: Json | null;
  stepRuns: Array<{
    id: string;
    workflowStepId: string;
    stepKey: string;
    title: string;
    agentSlug: string;
    status: WorkflowStepRunRow["status"];
    outputData: Json | null;
    startedAt: string;
    completedAt: string | null;
  }>;
};

const workflowPresentationBySlug: Record<string, WorkflowPresentation> = {
  "research-leads": {
    deliverable:
      "Research brief accionable + ICPs priorizados + lead list lista para outreach.",
    benefits: [
      "Alinea investigacion y prospecting en una misma corrida secuencial.",
      "Reduce el salto manual entre hallazgos de mercado y seleccion de leads.",
      "Deja trazabilidad por etapa para depurar el workflow despues.",
    ],
  },
  "leads-marketing": {
    deliverable:
      "ICPs seleccionados + leads priorizados + mensajes y assets base para activar growth.",
    benefits: [
      "Conecta segmentacion comercial con mensajes listos para ejecucion.",
      "Evita rehacer el brief entre ventas y marketing.",
      "Entrega angulos de mensaje apoyados en los prospectos seleccionados.",
    ],
  },
  "research-leads-marketing": {
    deliverable:
      "Paquete consolidado con hallazgos, ICPs, leads, messaging angles y assets finales.",
    benefits: [
      "Cubre descubrimiento, priorizacion comercial y activacion en un solo producto.",
      "Comparte contexto estructurado entre los tres agentes nativos.",
      "Deja una base limpia para futuras compras, dashboard y observabilidad.",
    ],
  },
};

function asNonEmptyString(value: string | null | undefined, fallback: string) {
  const normalized = value?.trim();
  return normalized ? normalized : fallback;
}

function getWorkflowPresentation(slug: string): WorkflowPresentation {
  return (
    workflowPresentationBySlug[slug] ?? {
      deliverable: "Entregable consolidado del workflow.",
      benefits: [
        "Orquesta multiples agentes de forma secuencial.",
        "Comparte contexto entre etapas.",
        "Entrega un resultado final consolidado.",
      ],
    }
  );
}

function mapAgentSummary(agentSlug: string): WorkflowAgentSummary {
  const builtIn = getAgentBySlug(agentSlug);

  return {
    slug: agentSlug,
    name: builtIn?.title ?? agentSlug,
  };
}

function dedupeAgents(steps: WorkflowStepRow[]) {
  const seen = new Set<string>();

  return steps.flatMap((step) => {
    if (seen.has(step.agent_slug)) {
      return [];
    }

    seen.add(step.agent_slug);
    return [mapAgentSummary(step.agent_slug)];
  });
}

function mapAccessState({
  profile,
  workflow,
  purchasedWorkflowIds,
}: {
  profile: ProfileRow | null;
  workflow: WorkflowRow;
  purchasedWorkflowIds: Set<string>;
}): WorkflowAccessState {
  if (!profile) {
    return "auth_required";
  }

  if (workflow.pricing_type === "free") {
    return "available";
  }

  if (workflow.owner_profile_id === profile.id || profile.role === "admin") {
    return "available";
  }

  return purchasedWorkflowIds.has(workflow.id)
    ? "available"
    : "purchase_required";
}

function mapWorkflowCatalogItem({
  workflow,
  steps,
  profile,
  purchasedWorkflowIds,
}: {
  workflow: WorkflowRow;
  steps: WorkflowStepRow[];
  profile: ProfileRow | null;
  purchasedWorkflowIds: Set<string>;
}): WorkflowCatalogItem {
  const presentation = getWorkflowPresentation(workflow.slug);

  return {
    id: workflow.id,
    slug: workflow.slug,
    name: workflow.name,
    shortDescription: asNonEmptyString(
      workflow.short_description,
      "Workflow publicado en Miunix.",
    ),
    description: asNonEmptyString(
      workflow.description,
      "Workflow secuencial entre agentes especializados.",
    ),
    price: workflow.price,
    currency: workflow.currency,
    pricingType: workflow.pricing_type,
    accessState: mapAccessState({
      profile,
      workflow,
      purchasedWorkflowIds,
    }),
    includedAgents: dedupeAgents(steps),
    steps: steps
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((step) => ({
        id: step.id,
        position: step.position,
        agent_slug: step.agent_slug,
        step_key: step.step_key,
        title: step.title,
        input_mapping: step.input_mapping,
        output_mapping: step.output_mapping,
        is_required: step.is_required,
      })),
    deliverable: presentation.deliverable,
    benefits: presentation.benefits,
  };
}

export function formatWorkflowPriceLabel({
  price,
  currency,
  pricingType,
}: Pick<WorkflowCatalogItem, "price" | "currency" | "pricingType">) {
  const numericPrice = Number(price);
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number.isFinite(numericPrice) ? numericPrice : 0);

  if (pricingType === "free") {
    return "Gratis";
  }

  if (pricingType === "subscription") {
    return `${formatted}/mo`;
  }

  return formatted;
}

export async function findProfileById(profileId: string) {
  const result = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("id", profileId)
    .maybeSingle();

  if (result.error) {
    throw new Error(result.error.message);
  }

  return result.data;
}

export async function listPurchasedWorkflowIds(profileId: string) {
  const result = await supabaseAdmin
    .from("workflow_purchases")
    .select("workflow_id")
    .eq("buyer_profile_id", profileId)
    .eq("payment_status", "completed");

  if (result.error) {
    throw new Error(result.error.message);
  }

  return new Set(result.data.map((purchase) => purchase.workflow_id));
}

async function listPublishedWorkflowRows() {
  const workflowsResult = await supabaseAdmin
    .from("workflows")
    .select("*")
    .eq("is_active", true)
    .eq("is_published", true)
    .eq("status", "published")
    .order("price", { ascending: true });

  if (workflowsResult.error) {
    throw new Error(workflowsResult.error.message);
  }

  const workflowIds = workflowsResult.data.map((workflow) => workflow.id);
  const stepsResult =
    workflowIds.length === 0
      ? { data: [] as WorkflowStepRow[], error: null }
      : await supabaseAdmin
          .from("workflow_steps")
          .select("*")
          .in("workflow_id", workflowIds)
          .order("position", { ascending: true });

  if (stepsResult.error) {
    throw new Error(stepsResult.error.message);
  }

  return {
    workflows: workflowsResult.data,
    steps: stepsResult.data,
  };
}

export async function listPublishedWorkflows(profileId?: string | null) {
  const [profile, purchasedWorkflowIds, workflowData] = await Promise.all([
    profileId ? findProfileById(profileId) : Promise.resolve(null),
    profileId
      ? listPurchasedWorkflowIds(profileId)
      : Promise.resolve(new Set<string>()),
    listPublishedWorkflowRows(),
  ]);

  const stepsByWorkflowId = new Map<string, WorkflowStepRow[]>();

  for (const step of workflowData.steps) {
    const current = stepsByWorkflowId.get(step.workflow_id) ?? [];
    current.push(step);
    stepsByWorkflowId.set(step.workflow_id, current);
  }

  return workflowData.workflows.map((workflow) =>
    mapWorkflowCatalogItem({
      workflow,
      steps: stepsByWorkflowId.get(workflow.id) ?? [],
      profile,
      purchasedWorkflowIds,
    }),
  );
}

export async function getWorkflowBySlug(
  slug: string,
  profileId?: string | null,
) {
  const [profile, purchasedWorkflowIds, workflowResult] = await Promise.all([
    profileId ? findProfileById(profileId) : Promise.resolve(null),
    profileId
      ? listPurchasedWorkflowIds(profileId)
      : Promise.resolve(new Set<string>()),
    supabaseAdmin.from("workflows").select("*").eq("slug", slug).maybeSingle(),
  ]);

  if (workflowResult.error) {
    throw new Error(workflowResult.error.message);
  }

  if (!workflowResult.data) {
    return null;
  }

  const stepsResult = await supabaseAdmin
    .from("workflow_steps")
    .select("*")
    .eq("workflow_id", workflowResult.data.id)
    .order("position", { ascending: true });

  if (stepsResult.error) {
    throw new Error(stepsResult.error.message);
  }

  return mapWorkflowCatalogItem({
    workflow: workflowResult.data,
    steps: stepsResult.data,
    profile,
    purchasedWorkflowIds,
  });
}

export async function findWorkflowWithSteps({
  workflowId,
  workflowSlug,
}: {
  workflowId?: string;
  workflowSlug?: string;
}) {
  if (!workflowId && !workflowSlug) {
    throw new Error("workflowId or workflowSlug is required.");
  }

  let query = supabaseAdmin.from("workflows").select("*");

  if (workflowId) {
    query = query.eq("id", workflowId);
  } else if (workflowSlug) {
    query = query.eq("slug", workflowSlug);
  }

  const workflowResult = await query.maybeSingle();

  if (workflowResult.error) {
    throw new Error(workflowResult.error.message);
  }

  if (!workflowResult.data) {
    return null;
  }

  const stepsResult = await supabaseAdmin
    .from("workflow_steps")
    .select("*")
    .eq("workflow_id", workflowResult.data.id)
    .order("position", { ascending: true });

  if (stepsResult.error) {
    throw new Error(stepsResult.error.message);
  }

  return {
    workflow: workflowResult.data,
    steps: stepsResult.data,
  };
}

export function getWorkflowOutputKeys(outputMapping: Json) {
  if (Array.isArray(outputMapping)) {
    return outputMapping.filter(
      (value): value is string => typeof value === "string" && value.trim().length > 0,
    );
  }

  if (outputMapping && typeof outputMapping === "object") {
    return Object.keys(outputMapping);
  }

  return [];
}

export function getWorkflowInputKeys(inputMapping: Json) {
  if (Array.isArray(inputMapping)) {
    return inputMapping.filter(
      (value): value is string => typeof value === "string" && value.trim().length > 0,
    );
  }

  if (inputMapping && typeof inputMapping === "object") {
    return Object.values(inputMapping).filter(
      (value): value is string => typeof value === "string" && value.trim().length > 0,
    );
  }

  return [];
}

export async function listWorkflowPurchases(profileId: string) {
  const result = await supabaseAdmin
    .from("workflow_purchases")
    .select("*")
    .eq("buyer_profile_id", profileId)
    .order("purchased_at", { ascending: false });

  if (result.error) {
    throw new Error(result.error.message);
  }

  return result.data satisfies WorkflowPurchaseRow[];
}

export async function listOwnedWorkflows(profileId: string) {
  const purchasedWorkflowIds = await listPurchasedWorkflowIds(profileId);

  if (purchasedWorkflowIds.size === 0) {
    return [] satisfies OwnedWorkflowItem[];
  }

  const workflowResult = await supabaseAdmin
    .from("workflows")
    .select("*")
    .in("id", Array.from(purchasedWorkflowIds))
    .eq("is_active", true)
    .eq("is_published", true)
    .eq("status", "published")
    .order("price", { ascending: true });

  if (workflowResult.error) {
    throw new Error(workflowResult.error.message);
  }

  const stepsResult = await supabaseAdmin
    .from("workflow_steps")
    .select("*")
    .in(
      "workflow_id",
      workflowResult.data.map((workflow) => workflow.id),
    )
    .order("position", { ascending: true });

  if (stepsResult.error) {
    throw new Error(stepsResult.error.message);
  }

  const stepsByWorkflowId = new Map<string, WorkflowStepRow[]>();

  for (const step of stepsResult.data) {
    const current = stepsByWorkflowId.get(step.workflow_id) ?? [];
    current.push(step);
    stepsByWorkflowId.set(step.workflow_id, current);
  }

  return workflowResult.data.map((workflow) => {
    const item = mapWorkflowCatalogItem({
      workflow,
      steps: stepsByWorkflowId.get(workflow.id) ?? [],
      profile: null,
      purchasedWorkflowIds,
    });

    return {
      id: item.id,
      slug: item.slug,
      name: item.name,
      shortDescription: item.shortDescription,
      description: item.description,
      price: item.price,
      currency: item.currency,
      pricingType: item.pricingType,
      includedAgents: item.includedAgents,
      steps: item.steps,
      deliverable: item.deliverable,
      benefits: item.benefits,
    } satisfies OwnedWorkflowItem;
  });
}

export async function purchaseWorkflowAccess({
  profileId,
  workflowId,
  workflowSlug,
}: {
  profileId: string;
  workflowId?: string;
  workflowSlug?: string;
}) {
  const [profile, workflowData, purchasedWorkflowIds] = await Promise.all([
    findProfileById(profileId),
    findWorkflowWithSteps({
      workflowId,
      workflowSlug,
    }),
    listPurchasedWorkflowIds(profileId),
  ]);

  if (!profile) {
    throw new Error("Profile not found.");
  }

  if (!workflowData) {
    throw new Error("Workflow not found.");
  }

  const workflow = workflowData.workflow;

  if (!workflow.is_active || !workflow.is_published || workflow.status !== "published") {
    throw new Error("Workflow is not available for purchase.");
  }

  if (purchasedWorkflowIds.has(workflow.id)) {
    return {
      alreadyOwned: true,
      workflow,
    };
  }

  const purchaseResult = await supabaseAdmin.from("workflow_purchases").insert({
    buyer_profile_id: profile.id,
    workflow_id: workflow.id,
    purchase_price: workflow.price,
    currency: workflow.currency,
    payment_status: "completed",
  });

  if (purchaseResult.error) {
    throw new Error(purchaseResult.error.message);
  }

  return {
    alreadyOwned: false,
    workflow,
  };
}

export async function listWorkflowExecutionHistory(profileId: string) {
  const executionsResult = await supabaseAdmin
    .from("workflow_executions")
    .select("*")
    .eq("profile_id", profileId)
    .order("started_at", { ascending: false });

  if (executionsResult.error) {
    throw new Error(executionsResult.error.message);
  }

  if (executionsResult.data.length === 0) {
    return [] satisfies WorkflowExecutionHistoryItem[];
  }

  const workflowIds = Array.from(
    new Set(executionsResult.data.map((execution) => execution.workflow_id)),
  );
  const executionIds = executionsResult.data.map((execution) => execution.id);

  const [workflowsResult, stepsResult, stepRunsResult] = await Promise.all([
    supabaseAdmin.from("workflows").select("*").in("id", workflowIds),
    supabaseAdmin.from("workflow_steps").select("*").in("workflow_id", workflowIds),
    supabaseAdmin
      .from("workflow_step_runs")
      .select("*")
      .in("workflow_execution_id", executionIds)
      .order("started_at", { ascending: true }),
  ]);

  if (workflowsResult.error) {
    throw new Error(workflowsResult.error.message);
  }

  if (stepsResult.error) {
    throw new Error(stepsResult.error.message);
  }

  if (stepRunsResult.error) {
    throw new Error(stepRunsResult.error.message);
  }

  const workflowsById = new Map(
    workflowsResult.data.map((workflow) => [workflow.id, workflow] as const),
  );
  const stepsById = new Map(
    stepsResult.data.map((step) => [step.id, step] as const),
  );
  const stepRunsByExecutionId = new Map<string, WorkflowStepRunRow[]>();

  for (const stepRun of stepRunsResult.data) {
    const current = stepRunsByExecutionId.get(stepRun.workflow_execution_id) ?? [];
    current.push(stepRun);
    stepRunsByExecutionId.set(stepRun.workflow_execution_id, current);
  }

  return executionsResult.data.flatMap((execution) => {
    const workflow = workflowsById.get(execution.workflow_id);

    if (!workflow) {
      return [];
    }

    return [
      {
        id: execution.id,
        workflowId: workflow.id,
        workflowSlug: workflow.slug,
        workflowName: workflow.name,
        status: execution.status,
        startedAt: execution.started_at,
        completedAt: execution.completed_at,
        inputData: execution.input_data,
        sharedContext: execution.shared_context,
        finalOutput: execution.final_output,
        stepRuns: (stepRunsByExecutionId.get(execution.id) ?? []).flatMap((stepRun) => {
          const step = stepsById.get(stepRun.workflow_step_id);

          if (!step) {
            return [];
          }

          return [
            {
              id: stepRun.id,
              workflowStepId: step.id,
              stepKey: step.step_key,
              title: step.title,
              agentSlug: step.agent_slug,
              status: stepRun.status,
              outputData: stepRun.output_data,
              startedAt: stepRun.started_at,
              completedAt: stepRun.completed_at,
            },
          ];
        }),
      },
    ] satisfies WorkflowExecutionHistoryItem[];
  });
}
