import { AgentExecutionError } from "@/ai/agent-runner";
import { OPENAI_DEFAULT_MODEL } from "@/lib/openai";
import { supabaseAdmin } from "@/lib/supabase";
import type { Database } from "@/types/database";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type AgentInsert = Database["public"]["Tables"]["agents"]["Insert"];
type AgentRow = Database["public"]["Tables"]["agents"]["Row"];
type PremiumPlan = Database["public"]["Enums"]["premium_plan"];

export type PremiumPlanDefinition = {
  slug: PremiumPlan;
  name: string;
  priceLabel: string;
  agentLimit: number;
  summary: string;
  features: string[];
  recommendedFor: string;
};

export type PremiumAgentListItem = Pick<
  AgentRow,
  | "id"
  | "name"
  | "slug"
  | "short_description"
  | "description"
  | "prompt_template"
  | "validation_report"
  | "model"
  | "total_runs"
  | "updated_at"
  | "status"
>;

export const PREMIUM_PLAN_DEFINITIONS: PremiumPlanDefinition[] = [
  {
    slug: "starter",
    name: "MIUNIX+ Starter",
    priceLabel: "$9/mo",
    agentLimit: 1,
    summary: "Primer agente no-code para automatizar una tarea concreta.",
    recommendedFor: "Usuarios que quieren validar su primer flujo personal.",
    features: [
      "1 agente privado zero-code",
      "Plantilla guiada estilo DSL",
      "Buenas practicas para customer service y soporte",
    ],
  },
  {
    slug: "pro",
    name: "MIUNIX+ Pro",
    priceLabel: "$19/mo",
    agentLimit: 3,
    summary: "Pequeno stack de agentes para ventas, soporte y operaciones.",
    recommendedFor: "Equipos chicos que necesitan varios flujos en paralelo.",
    features: [
      "Hasta 3 agentes privados",
      "Playbooks por tono, objetivos y restricciones",
      "Mejor cobertura para onboarding y customer success",
    ],
  },
  {
    slug: "scale",
    name: "MIUNIX+ Scale",
    priceLabel: "$39/mo",
    agentLimit: 5,
    summary: "Centro privado para orquestar varios agentes internos.",
    recommendedFor: "Equipos que quieren convertir procesos repetitivos en agentes.",
    features: [
      "Hasta 5 agentes privados",
      "Biblioteca base de casos de uso por area",
      "Espacio para operaciones, soporte y growth",
    ],
  },
];

export function getPremiumPlanDefinition(plan: PremiumPlan) {
  return PREMIUM_PLAN_DEFINITIONS.find((item) => item.slug === plan) ?? null;
}

export function ensureUserProfile(profile: ProfileRow) {
  if (profile.role !== "user") {
    throw new AgentExecutionError(
      "MIUNIX+ solo esta disponible para cuentas user.",
      403,
    );
  }

  return profile;
}

export function ensurePremiumUserProfile(profile: ProfileRow) {
  ensureUserProfile(profile);

  if (!profile.is_premium || !profile.premium_plan) {
    throw new AgentExecutionError(
      "Necesitas una suscripcion MIUNIX+ para acceder a este espacio.",
      403,
    );
  }

  return profile;
}

export async function updateProfilePremiumPlan(
  profileId: string,
  plan: PremiumPlan,
) {
  const definition = getPremiumPlanDefinition(plan);

  if (!definition) {
    throw new AgentExecutionError("Plan premium invalido.", 400);
  }

  const result = await supabaseAdmin
    .from("profiles")
    .update({
      is_premium: true,
      premium_plan: definition.slug,
      premium_agent_limit: definition.agentLimit,
      premium_since: new Date().toISOString(),
    })
    .eq("id", profileId)
    .eq("role", "user")
    .select("*")
    .single();

  if (result.error) {
    if (
      result.error.message.includes("schema cache") ||
      result.error.message.includes("Could not find the 'is_premium' column") ||
      result.error.message.includes("premium_plan") ||
      result.error.message.includes("premium_agent_limit")
    ) {
      throw new AgentExecutionError(
        "La base de datos todavia no tiene las columnas premium. Ejecuta el SQL de supabase/sql/day6_miunix_plus.sql en Supabase y vuelve a probar.",
        500,
      );
    }

    throw new AgentExecutionError(result.error.message, 500);
  }

  return result.data;
}

export async function countPremiumAgents(profileId: string) {
  const result = await supabaseAdmin
    .from("agents")
    .select("id", { count: "exact", head: true })
    .eq("owner_profile_id", profileId)
    .eq("owner_type", "user")
    .neq("status", "archived");

  if (result.error) {
    throw new AgentExecutionError(result.error.message, 500);
  }

  return result.count ?? 0;
}

export async function listPremiumAgents(profileId: string) {
  const result = await supabaseAdmin
    .from("agents")
    .select("*")
    .eq("owner_profile_id", profileId)
    .eq("owner_type", "user")
    .order("updated_at", { ascending: false });

  if (result.error) {
    throw new AgentExecutionError(result.error.message, 500);
  }

  return result.data.map((agent) => ({
    id: agent.id,
    name: agent.name,
    slug: agent.slug,
    short_description: agent.short_description,
    description: agent.description,
    prompt_template: agent.prompt_template,
    validation_report: agent.validation_report,
    model: agent.model,
    total_runs: agent.total_runs,
    updated_at: agent.updated_at,
    status: agent.status,
  })) satisfies PremiumAgentListItem[];
}

export async function createPremiumAgent(payload: AgentInsert) {
  const result = await supabaseAdmin
    .from("agents")
    .insert(payload)
    .select("*")
    .single();

  if (result.error) {
    throw new AgentExecutionError(result.error.message, 500);
  }

  return result.data;
}

export async function getPremiumAgentById(agentId: string, profileId: string) {
  const result = await supabaseAdmin
    .from("agents")
    .select("*")
    .eq("id", agentId)
    .eq("owner_profile_id", profileId)
    .eq("owner_type", "user")
    .maybeSingle();

  if (result.error) {
    throw new AgentExecutionError(result.error.message, 500);
  }

  return result.data;
}

export async function updatePremiumAgent(
  agentId: string,
  profileId: string,
  payload: Database["public"]["Tables"]["agents"]["Update"],
) {
  const result = await supabaseAdmin
    .from("agents")
    .update(payload)
    .eq("id", agentId)
    .eq("owner_profile_id", profileId)
    .eq("owner_type", "user")
    .select("*")
    .single();

  if (result.error) {
    throw new AgentExecutionError(result.error.message, 500);
  }

  return result.data;
}

export async function deletePremiumAgent(agentId: string, profileId: string) {
  const result = await supabaseAdmin
    .from("agents")
    .delete()
    .eq("id", agentId)
    .eq("owner_profile_id", profileId)
    .eq("owner_type", "user");

  if (result.error) {
    throw new AgentExecutionError(result.error.message, 500);
  }
}

type PremiumAgentDslInput = {
  name: string;
  shortDescription: string;
  mainGoal: string;
  targetUser: string;
  tone: string;
  workflowSteps: string;
  guardrails: string;
  successDefinition: string;
};

export function buildPremiumAgentPrompt(input: PremiumAgentDslInput) {
  return [
    `You are ${input.name}, a private MIUNIX+ assistant built with a guided zero-code DSL.`,
    "",
    "Mission:",
    input.mainGoal,
    "",
    "Primary user:",
    input.targetUser,
    "",
    "Tone and behavior:",
    input.tone,
    "",
    "Workflow you should follow:",
    input.workflowSteps,
    "",
    "Guardrails:",
    input.guardrails,
    "",
    "Definition of success:",
    input.successDefinition,
    "",
    "Operating rules:",
    "- Respond in the same language used by the user unless they ask otherwise.",
    "- Be concrete, practical, and action-oriented.",
    "- If information is missing, ask only the minimum clarification needed.",
    "- Prefer structured outputs when they make the result easier to execute.",
    "- When the request is about customer service, prioritize empathy, clarity, next steps, and realistic promises.",
  ].join("\n");
}

export function buildPremiumAgentSlug(name: string, profileId: string) {
  const slugBase = name
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (!slugBase) {
    throw new AgentExecutionError(
      "No se pudo generar un slug para el agente.",
      400,
    );
  }

  return `${slugBase}-${profileId.slice(0, 8)}-${Date.now()
    .toString()
    .slice(-6)}`;
}

export function getPremiumAgentDefaultModel() {
  return OPENAI_DEFAULT_MODEL;
}

export function buildPremiumAgentDslPayload(input: PremiumAgentDslInput) {
  return {
    source: "miunix_plus_dsl",
    target_user: input.targetUser,
    tone: input.tone,
    workflow_steps: input.workflowSteps,
    guardrails: input.guardrails,
    success_definition: input.successDefinition,
  };
}
