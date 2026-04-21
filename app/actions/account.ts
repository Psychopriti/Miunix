"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAuthenticatedProfile, requireTrimmedString } from "@/lib/api";
import {
  unsubscribeFromMiunixPlus,
  unsubscribeFromPurchasedAgent,
} from "@/lib/account";

function buildDashboardRedirect(message: string, type: "success" | "error" = "success") {
  return `/mi-cuenta?type=${type}&message=${encodeURIComponent(message)}`;
}

async function requireProfileForAccountAction() {
  const { errorResponse, profile } = await requireAuthenticatedProfile();

  if (errorResponse || !profile) {
    redirect("/login");
  }

  return profile;
}

export async function unsubscribeMiunixPlusAction() {
  const profile = await requireProfileForAccountAction();

  try {
    await unsubscribeFromMiunixPlus(profile);
    revalidatePath("/dashboard");
    revalidatePath("/miunix-plus-center");
    redirect(
      buildDashboardRedirect(
        "MIUNIX+ fue desactivado y tus agentes privados quedaron archivados.",
      ),
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No se pudo desactivar MIUNIX+.";
    redirect(buildDashboardRedirect(message, "error"));
  }
}

export async function unsubscribePurchasedAgentAction(formData: FormData) {
  const profile = await requireProfileForAccountAction();

  try {
    const agentId =
      requireTrimmedString(formData.get("agentId"), "agentId") ?? "";

    await unsubscribeFromPurchasedAgent(profile.id, agentId);
    revalidatePath("/dashboard");
    redirect(buildDashboardRedirect("El agente comprado fue removido de tu cuenta."));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No se pudo remover ese agente.";
    redirect(buildDashboardRedirect(message, "error"));
  }
}
