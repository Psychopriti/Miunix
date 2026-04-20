"use server";

import { redirect } from "next/navigation";

import { AgentExecutionError } from "@/ai/agent-runner";
import { requireAuthenticatedProfile, requireTrimmedString } from "@/lib/api";
import {
  buildPremiumAgentPrompt,
  buildPremiumAgentDslPayload,
  buildPremiumAgentSlug,
  countPremiumAgents,
  createPremiumAgent,
  deletePremiumAgent,
  ensurePremiumUserProfile,
  ensureUserProfile,
  getPremiumAgentDefaultModel,
  getPremiumAgentById,
  getPremiumPlanDefinition,
  updatePremiumAgent,
  updateProfilePremiumPlan,
} from "@/lib/premium";
import { isPremiumPlan } from "@/lib/auth";

function buildRedirect(
  path: string,
  message: string,
  type: "success" | "error" = "success",
) {
  return `${path}?type=${type}&message=${encodeURIComponent(message)}`;
}

async function requireUserProfileContext() {
  const { errorResponse, profile } = await requireAuthenticatedProfile();

  if (errorResponse || !profile) {
    redirect(buildRedirect("/login", "Necesitas iniciar sesion.", "error"));
  }

  return ensureUserProfile(profile);
}

async function requirePremiumUserProfileContext() {
  const { errorResponse, profile } = await requireAuthenticatedProfile();

  if (errorResponse || !profile) {
    redirect(buildRedirect("/login", "Necesitas iniciar sesion.", "error"));
  }

  return ensurePremiumUserProfile(profile);
}

export async function selectMiunixPlanAction(formData: FormData) {
  const profile = await requireUserProfileContext();

  try {
    const requestedPlan = String(formData.get("plan") ?? "").trim();

    if (!isPremiumPlan(requestedPlan)) {
      throw new AgentExecutionError("Selecciona un plan MIUNIX+ valido.", 400);
    }

    const updatedProfile = await updateProfilePremiumPlan(profile.id, requestedPlan);
    const planDefinition = getPremiumPlanDefinition(requestedPlan);

    redirect(
      buildRedirect(
        "/miunix-plus-center",
        `MIUNIX+ ${planDefinition?.name.replace("MIUNIX+ ", "") ?? requestedPlan} activado para ${updatedProfile.email ?? "tu cuenta"}.`,
      ),
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No se pudo activar MIUNIX+.";
    redirect(buildRedirect("/miunix-plus", message, "error"));
  }
}

export async function createMiunixPremiumAgentAction(formData: FormData) {
  const profile = await requirePremiumUserProfileContext();

  try {
    const name =
      requireTrimmedString(formData.get("name"), "name", {
        maxLength: 80,
      }) ?? "";
    const shortDescription = requireTrimmedString(
      formData.get("shortDescription"),
      "shortDescription",
      {
        maxLength: 160,
      },
    ) ?? "";
    const mainGoal =
      requireTrimmedString(formData.get("mainGoal"), "mainGoal", {
        maxLength: 600,
      }) ?? "";
    const targetUser = requireTrimmedString(
      formData.get("targetUser"),
      "targetUser",
      {
        maxLength: 220,
      },
    ) ?? "";
    const tone =
      requireTrimmedString(formData.get("tone"), "tone", {
        maxLength: 160,
      }) ?? "";
    const workflowSteps = requireTrimmedString(
      formData.get("workflowSteps"),
      "workflowSteps",
      {
        maxLength: 2000,
      },
    ) ?? "";
    const guardrails = requireTrimmedString(
      formData.get("guardrails"),
      "guardrails",
      {
        maxLength: 1400,
      },
    ) ?? "";
    const successDefinition = requireTrimmedString(
      formData.get("successDefinition"),
      "successDefinition",
      {
        maxLength: 900,
      },
    ) ?? "";

    const existingAgents = await countPremiumAgents(profile.id);
    const agentLimit = profile.premium_agent_limit ?? 0;

    if (existingAgents >= agentLimit) {
      throw new AgentExecutionError(
        `Tu plan actual permite ${agentLimit} agente${agentLimit === 1 ? "" : "s"}.`,
        400,
      );
    }

    await createPremiumAgent({
      owner_profile_id: profile.id,
      owner_type: "user",
      name,
      slug: buildPremiumAgentSlug(name, profile.id),
      description: mainGoal,
      short_description: shortDescription,
      prompt_template: buildPremiumAgentPrompt({
        name,
        shortDescription,
        mainGoal,
        targetUser,
        tone,
        workflowSteps,
        guardrails,
        successDefinition,
      }),
      model: getPremiumAgentDefaultModel(),
      tool_definitions: [],
      validation_report: buildPremiumAgentDslPayload({
        name,
        shortDescription,
        mainGoal,
        targetUser,
        tone,
        workflowSteps,
        guardrails,
        successDefinition,
      }),
      review_status: "draft",
      last_test_run_status: "not_run",
      is_active: true,
      is_published: false,
      status: "draft",
      pricing_type: "free",
      price: "0.00",
      currency: "USD",
    });

    redirect(
      buildRedirect(
        "/miunix-plus-center",
        "Agente MIUNIX+ creado. Ya aparece tambien en tu dashboard.",
      ),
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No se pudo crear el agente.";
    redirect(buildRedirect("/miunix-plus-center", message, "error"));
  }
}

export async function updateMiunixPremiumAgentAction(formData: FormData) {
  const profile = await requirePremiumUserProfileContext();

  try {
    const agentId =
      requireTrimmedString(formData.get("agentId"), "agentId") ?? "";
    const name =
      requireTrimmedString(formData.get("name"), "name", {
        maxLength: 80,
      }) ?? "";
    const shortDescription = requireTrimmedString(
      formData.get("shortDescription"),
      "shortDescription",
      {
        maxLength: 160,
      },
    ) ?? "";
    const mainGoal =
      requireTrimmedString(formData.get("mainGoal"), "mainGoal", {
        maxLength: 600,
      }) ?? "";
    const targetUser = requireTrimmedString(
      formData.get("targetUser"),
      "targetUser",
      {
        maxLength: 220,
      },
    ) ?? "";
    const tone =
      requireTrimmedString(formData.get("tone"), "tone", {
        maxLength: 160,
      }) ?? "";
    const workflowSteps = requireTrimmedString(
      formData.get("workflowSteps"),
      "workflowSteps",
      {
        maxLength: 2000,
      },
    ) ?? "";
    const guardrails = requireTrimmedString(
      formData.get("guardrails"),
      "guardrails",
      {
        maxLength: 1400,
      },
    ) ?? "";
    const successDefinition = requireTrimmedString(
      formData.get("successDefinition"),
      "successDefinition",
      {
        maxLength: 900,
      },
    ) ?? "";

    const agent = await getPremiumAgentById(agentId, profile.id);

    if (!agent) {
      throw new AgentExecutionError("Agente MIUNIX+ no encontrado.", 404);
    }

    await updatePremiumAgent(agentId, profile.id, {
      name,
      description: mainGoal,
      short_description: shortDescription,
      prompt_template: buildPremiumAgentPrompt({
        name,
        shortDescription,
        mainGoal,
        targetUser,
        tone,
        workflowSteps,
        guardrails,
        successDefinition,
      }),
      validation_report: buildPremiumAgentDslPayload({
        name,
        shortDescription,
        mainGoal,
        targetUser,
        tone,
        workflowSteps,
        guardrails,
        successDefinition,
      }),
    });

    redirect(
      buildRedirect(
        "/miunix-plus-center",
        "Agente MIUNIX+ actualizado correctamente.",
      ),
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No se pudo actualizar el agente.";
    redirect(buildRedirect("/miunix-plus-center", message, "error"));
  }
}

export async function deleteMiunixPremiumAgentAction(formData: FormData) {
  const profile = await requirePremiumUserProfileContext();

  try {
    const agentId =
      requireTrimmedString(formData.get("agentId"), "agentId") ?? "";
    const agent = await getPremiumAgentById(agentId, profile.id);

    if (!agent) {
      throw new AgentExecutionError("Agente MIUNIX+ no encontrado.", 404);
    }

    await deletePremiumAgent(agentId, profile.id);

    redirect(
      buildRedirect(
        "/miunix-plus-center",
        "Agente MIUNIX+ eliminado de tu biblioteca privada.",
      ),
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No se pudo borrar el agente.";
    redirect(buildRedirect("/miunix-plus-center", message, "error"));
  }
}
