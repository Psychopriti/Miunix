"use client";

import { useState } from "react";
import Link from "next/link";
import { Bot, Gauge, PencilLine, Trash2, Wand2, X } from "lucide-react";

import {
  createMiunixPremiumAgentAction,
  deleteMiunixPremiumAgentAction,
  updateMiunixPremiumAgentAction,
} from "@/app/actions/miunix-plus";
import type { PremiumAgentListItem, PremiumPlanDefinition } from "@/lib/premium";

type AgentBlueprint = {
  name: string;
  shortDescription: string;
  mainGoal: string;
  targetUser: string;
  tone: string;
  workflowSteps: string;
  guardrails: string;
  successDefinition: string;
  rationale: string;
  nextSteps: string[];
};

type CreatorStudioProps = {
  agents: PremiumAgentListItem[];
  currentCount: number;
  agentLimit: number;
  plan: PremiumPlanDefinition | null;
};

const defaultFormValues = {
  name: "",
  shortDescription: "",
  mainGoal: "",
  targetUser: "",
  tone: "Empatico, claro y profesional",
  workflowSteps: "",
  guardrails: "",
  successDefinition: "",
};

function readValidationText(
  report: PremiumAgentListItem["validation_report"],
  key: string,
) {
  if (!report || typeof report !== "object" || Array.isArray(report)) {
    return "";
  }

  const candidate = report[key as keyof typeof report];
  return typeof candidate === "string" ? candidate : "";
}

function getEditorDefaults(agent: PremiumAgentListItem) {
  return {
    name: agent.name,
    shortDescription: agent.short_description ?? "",
    mainGoal: agent.description ?? "",
    targetUser: readValidationText(agent.validation_report, "target_user"),
    tone:
      readValidationText(agent.validation_report, "tone") ||
      "Empatico, claro y profesional",
    workflowSteps: readValidationText(agent.validation_report, "workflow_steps"),
    guardrails: readValidationText(agent.validation_report, "guardrails"),
    successDefinition: readValidationText(
      agent.validation_report,
      "success_definition",
    ),
  };
}

export function CreatorStudio({
  agents,
  currentCount,
  agentLimit,
  plan,
}: CreatorStudioProps) {
  const [brief, setBrief] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [coachError, setCoachError] = useState<string | null>(null);
  const [blueprint, setBlueprint] = useState<AgentBlueprint | null>(null);
  const [formValues, setFormValues] = useState(defaultFormValues);
  const [editingAgent, setEditingAgent] = useState<PremiumAgentListItem | null>(
    null,
  );

  async function handleGenerateBlueprint() {
    if (!brief.trim()) {
      setCoachError("Describe primero que agente quieres crear.");
      return;
    }

    setIsGenerating(true);
    setCoachError(null);

    try {
      const response = await fetch("/api/miunix-plus/agent-coach", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          brief,
        }),
      });

      const payload = (await response.json()) as {
        success?: boolean;
        error?: string;
        blueprint?: AgentBlueprint;
      };

      if (!response.ok || !payload.success || !payload.blueprint) {
        throw new Error(payload.error ?? "No se pudo generar la propuesta.");
      }

      setBlueprint(payload.blueprint);
      setFormValues({
        name: payload.blueprint.name,
        shortDescription: payload.blueprint.shortDescription,
        mainGoal: payload.blueprint.mainGoal,
        targetUser: payload.blueprint.targetUser,
        tone: payload.blueprint.tone,
        workflowSteps: payload.blueprint.workflowSteps,
        guardrails: payload.blueprint.guardrails,
        successDefinition: payload.blueprint.successDefinition,
      });
    } catch (error) {
      setCoachError(
        error instanceof Error
          ? error.message
          : "Hubo un problema usando el builder agent.",
      );
    } finally {
      setIsGenerating(false);
    }
  }

  function handleFieldChange(
    field: keyof typeof defaultFormValues,
    value: string,
  ) {
    setFormValues((current) => ({
      ...current,
      [field]: value,
    }));
  }

  const editingDefaults = editingAgent ? getEditorDefaults(editingAgent) : null;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
      <section className="rounded-[1.6rem] border border-white/10 bg-white/[0.03] px-5 py-5">
        <div className="max-w-xl">
          <p className="text-xs uppercase tracking-[0.22em] text-white/45">
            Builder Agent incluido
          </p>
          <h2 className="mt-3 text-2xl font-medium tracking-[-0.04em] text-white">
            Diseña tu agente con ayuda del MIUNIX+ Builder
          </h2>
          <p className="mt-3 text-sm leading-6 text-white/65">
            Cada plan incluye un agente interno que toma tu idea, propone el
            blueprint y llena el formulario base para que tu agente nazca mejor
            diseñado.
          </p>
        </div>

        <div className="mt-6 rounded-[1.4rem] border border-[#d9ff00]/16 bg-[linear-gradient(180deg,rgba(217,255,0,0.06),rgba(255,255,255,0.02))] p-5">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <Bot className="size-5 text-[#d9ff00]" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-white/40">
                MIUNIX+ Builder Agent
              </p>
              <h3 className="mt-2 text-lg font-medium text-white">
                Cuéntame qué quieres automatizar
              </h3>
              <p className="mt-2 text-sm leading-6 text-white/62">
                Ejemplo: &quot;Quiero un agente que responda dudas de
                inscripción, detecte preguntas sensibles y cierre con un
                siguiente paso claro&quot;.
              </p>
            </div>
          </div>

          <textarea
            value={brief}
            onChange={(event) => setBrief(event.target.value)}
            rows={6}
            className="mt-5 w-full rounded-[1rem] border border-white/10 bg-[#0e0e0e] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-[#d9ff00]"
            placeholder="Describe el tipo de agente, a quien atiende, el resultado esperado y cualquier restriccion importante."
          />

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => void handleGenerateBlueprint()}
              disabled={isGenerating}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-[#d9ff00]/30 bg-[#d9ff00] px-5 py-3 text-sm font-medium text-black transition hover:bg-[#e5ff45] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Wand2 className="size-4" />
              {isGenerating ? "Generando propuesta..." : "Generar blueprint"}
            </button>
            <button
              type="button"
              onClick={() => {
                setBrief("");
                setBlueprint(null);
                setCoachError(null);
                setFormValues(defaultFormValues);
              }}
              className="rounded-full border border-white/12 bg-white/6 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10"
            >
              Limpiar
            </button>
          </div>

          {coachError ? (
            <div className="mt-4 rounded-2xl border border-[#ff7a7a]/30 bg-[#3a1111] px-4 py-3 text-sm text-[#ffd0d0]">
              {coachError}
            </div>
          ) : null}

          {blueprint ? (
            <div className="mt-5 space-y-4">
              <div className="rounded-[1.2rem] border border-white/10 bg-black/20 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.18em] text-white/38">
                  Por que esta propuesta funciona
                </p>
                <p className="mt-2 text-sm leading-6 text-white/72">
                  {blueprint.rationale}
                </p>
              </div>

              <div className="rounded-[1.2rem] border border-white/10 bg-black/20 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.18em] text-white/38">
                  Siguientes pasos sugeridos
                </p>
                <div className="mt-3 space-y-2">
                  {blueprint.nextSteps.map((step) => (
                    <div
                      key={step}
                      className="rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3 text-sm text-white/72"
                    >
                      {step}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <form action={createMiunixPremiumAgentAction} className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-2 block text-xs uppercase tracking-[0.22em] text-white/45">
              Nombre del agente
            </span>
            <input
              required
              name="name"
              maxLength={80}
              value={formValues.name}
              onChange={(event) => handleFieldChange("name", event.target.value)}
              className="w-full rounded-[1rem] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/28 focus:border-[#d9ff00]"
              placeholder="Ej. Customer Care Assistant"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-xs uppercase tracking-[0.22em] text-white/45">
              Descripcion corta
            </span>
            <input
              required
              name="shortDescription"
              maxLength={160}
              value={formValues.shortDescription}
              onChange={(event) =>
                handleFieldChange("shortDescription", event.target.value)
              }
              className="w-full rounded-[1rem] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/28 focus:border-[#d9ff00]"
              placeholder="Que hace este agente en una linea"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-xs uppercase tracking-[0.22em] text-white/45">
              Objetivo principal
            </span>
            <textarea
              required
              name="mainGoal"
              rows={4}
              maxLength={600}
              value={formValues.mainGoal}
              onChange={(event) => handleFieldChange("mainGoal", event.target.value)}
              className="w-full rounded-[1rem] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/28 focus:border-[#d9ff00]"
              placeholder="Describe el resultado que debe conseguir para ti."
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-xs uppercase tracking-[0.22em] text-white/45">
              Usuario o cliente al que atiende
            </span>
            <input
              required
              name="targetUser"
              maxLength={220}
              value={formValues.targetUser}
              onChange={(event) =>
                handleFieldChange("targetUser", event.target.value)
              }
              className="w-full rounded-[1rem] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/28 focus:border-[#d9ff00]"
              placeholder="Ej. Clientes nuevos de la universidad"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-xs uppercase tracking-[0.22em] text-white/45">
              Tono del agente
            </span>
            <select
              name="tone"
              value={formValues.tone}
              onChange={(event) => handleFieldChange("tone", event.target.value)}
              className="w-full rounded-[1rem] border border-white/10 bg-[#111111] px-4 py-3 text-sm text-white outline-none transition focus:border-[#d9ff00]"
            >
              <option>Empatico, claro y profesional</option>
              <option>Comercial, directo y convincente</option>
              <option>Tecnico, preciso y estructurado</option>
              <option>Cercano, humano y orientado a soporte</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-xs uppercase tracking-[0.22em] text-white/45">
              Flujo o pasos que debe seguir
            </span>
            <textarea
              required
              name="workflowSteps"
              rows={5}
              maxLength={2000}
              value={formValues.workflowSteps}
              onChange={(event) =>
                handleFieldChange("workflowSteps", event.target.value)
              }
              className="w-full rounded-[1rem] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/28 focus:border-[#d9ff00]"
              placeholder="1. Entender el problema. 2. Pedir contexto minimo. 3. Proponer solucion. 4. Cerrar con siguiente paso."
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-xs uppercase tracking-[0.22em] text-white/45">
              Restricciones y guardrails
            </span>
            <textarea
              required
              name="guardrails"
              rows={4}
              maxLength={1400}
              value={formValues.guardrails}
              onChange={(event) =>
                handleFieldChange("guardrails", event.target.value)
              }
              className="w-full rounded-[1rem] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/28 focus:border-[#d9ff00]"
              placeholder="No prometer descuentos, no inventar fechas, escalar cuando falte informacion critica."
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-xs uppercase tracking-[0.22em] text-white/45">
              Como se ve una buena respuesta
            </span>
            <textarea
              required
              name="successDefinition"
              rows={4}
              maxLength={900}
              value={formValues.successDefinition}
              onChange={(event) =>
                handleFieldChange("successDefinition", event.target.value)
              }
              className="w-full rounded-[1rem] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/28 focus:border-[#d9ff00]"
              placeholder="Debe cerrar dudas, dar pasos claros y dejar al usuario con confianza."
            />
          </label>

          <button
            type="submit"
            disabled={currentCount >= agentLimit}
            className="w-full rounded-full border border-[#d9ff00]/30 bg-[#d9ff00] px-5 py-3 text-sm font-medium text-black transition hover:bg-[#e5ff45] disabled:cursor-not-allowed disabled:border-white/12 disabled:bg-white/8 disabled:text-white/35"
          >
            {currentCount >= agentLimit
              ? "Limite del plan alcanzado"
              : "Crear agente MIUNIX+"}
          </button>
        </form>
      </section>

      <section className="rounded-[1.6rem] border border-white/10 bg-white/[0.03] px-5 py-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-white/45">
              Tus agentes
            </p>
            <h2 className="mt-3 text-2xl font-medium tracking-[-0.04em] text-white">
              Biblioteca privada
            </h2>
          </div>
          <p className="text-sm text-white/55">
            {agents.length} agente{agents.length === 1 ? "" : "s"}
          </p>
        </div>

        <div className="mt-6 rounded-[1.3rem] border border-white/10 bg-black/20 px-5 py-5">
          <p className="text-xs uppercase tracking-[0.2em] text-white/40">
            Beneficio incluido en tu plan
          </p>
          <div className="mt-4 flex items-start gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <Gauge className="size-5 text-[#d9ff00]" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-white">
                {plan?.name ?? "MIUNIX+"} incluye un Builder Agent dedicado
              </h3>
              <p className="mt-2 text-sm leading-6 text-white/68">
                Ya no arrancas desde cero. El builder te ayuda a convertir una
                necesidad difusa en un agente con objetivo, flujo y guardrails claros.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {agents.length === 0 ? (
            <div className="rounded-[1.2rem] border border-dashed border-white/12 bg-white/[0.02] px-5 py-6 text-sm leading-6 text-white/58">
              Aun no tienes agentes MIUNIX+. Usa el Builder Agent para definir
              el primero y despues ejecútalo desde el dashboard.
            </div>
          ) : (
            agents.map((agent) => (
              <article
                key={agent.id}
                className="rounded-[1.2rem] border border-white/10 bg-[#0d0d0d] px-5 py-5 shadow-[0_16px_36px_rgba(0,0,0,0.18)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                      <Bot className="size-5 text-[#d9ff00]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-white">
                        {agent.name}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-white/65">
                        {agent.short_description ?? "Agente privado MIUNIX+."}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-3 text-xs uppercase tracking-[0.16em] text-white/35">
                        <span>{agent.model}</span>
                        <span>{agent.total_runs} ejecuciones</span>
                        <span>{agent.status}</span>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingAgent(agent)}
                          className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/6 px-4 py-2 text-xs font-medium text-white transition hover:bg-white/10"
                        >
                          <PencilLine className="size-3.5" />
                          Editar
                        </button>
                        <form action={deleteMiunixPremiumAgentAction}>
                          <input type="hidden" name="agentId" value={agent.id} />
                          <button
                            type="submit"
                            className="inline-flex items-center gap-2 rounded-full border border-[#ff7a7a]/20 bg-[#ff7a7a]/10 px-4 py-2 text-xs font-medium text-[#ffd0d0] transition hover:bg-[#ff7a7a]/16"
                          >
                            <Trash2 className="size-3.5" />
                            Borrar
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>

        <div className="mt-6 rounded-[1.2rem] border border-white/10 bg-black/20 px-5 py-5">
          <p className="text-xs uppercase tracking-[0.22em] text-white/45">
            Sugerencias
          </p>
          <div className="mt-4 space-y-3 text-sm leading-6 text-white/68">
            <p>Empieza por un agente de soporte o customer success.</p>
            <p>Haz que cada agente tenga un objetivo muy concreto.</p>
            <p>Usa el Builder Agent para definir mejores guardrails desde el inicio.</p>
          </div>

          <Link
            href="/dashboard"
            className="mt-5 inline-flex rounded-full border border-white/12 bg-white/6 px-4 py-2 text-sm text-white/75 transition hover:bg-white/10"
          >
            Ir al dashboard
          </Link>
        </div>
      </section>

      {editingAgent && editingDefaults ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[1.8rem] border border-white/10 bg-[#0c0c0c] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.5)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-white/45">
                  Editar agente privado
                </p>
                <h3 className="mt-3 text-2xl font-medium tracking-[-0.04em] text-white">
                  {editingAgent.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingAgent(null)}
                className="rounded-full border border-white/10 bg-white/5 p-2 text-white/65 transition hover:bg-white/10 hover:text-white"
                aria-label="Cerrar editor"
              >
                <X className="size-4" />
              </button>
            </div>

            <form action={updateMiunixPremiumAgentAction} className="mt-6 space-y-4">
              <input type="hidden" name="agentId" value={editingAgent.id} />

              <label className="block">
                <span className="mb-2 block text-xs uppercase tracking-[0.22em] text-white/45">
                  Nombre del agente
                </span>
                <input
                  required
                  name="name"
                  maxLength={80}
                  defaultValue={editingDefaults.name}
                  className="w-full rounded-[1rem] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-[#d9ff00]"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs uppercase tracking-[0.22em] text-white/45">
                  Descripcion corta
                </span>
                <input
                  required
                  name="shortDescription"
                  maxLength={160}
                  defaultValue={editingDefaults.shortDescription}
                  className="w-full rounded-[1rem] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-[#d9ff00]"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs uppercase tracking-[0.22em] text-white/45">
                  Objetivo principal
                </span>
                <textarea
                  required
                  name="mainGoal"
                  rows={4}
                  maxLength={600}
                  defaultValue={editingDefaults.mainGoal}
                  className="w-full rounded-[1rem] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-[#d9ff00]"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs uppercase tracking-[0.22em] text-white/45">
                  Usuario o cliente al que atiende
                </span>
                <input
                  required
                  name="targetUser"
                  maxLength={220}
                  defaultValue={editingDefaults.targetUser}
                  className="w-full rounded-[1rem] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-[#d9ff00]"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs uppercase tracking-[0.22em] text-white/45">
                  Tono del agente
                </span>
                <select
                  name="tone"
                  defaultValue={editingDefaults.tone}
                  className="w-full rounded-[1rem] border border-white/10 bg-[#111111] px-4 py-3 text-sm text-white outline-none transition focus:border-[#d9ff00]"
                >
                  <option>Empatico, claro y profesional</option>
                  <option>Comercial, directo y convincente</option>
                  <option>Tecnico, preciso y estructurado</option>
                  <option>Cercano, humano y orientado a soporte</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-xs uppercase tracking-[0.22em] text-white/45">
                  Flujo o pasos que debe seguir
                </span>
                <textarea
                  required
                  name="workflowSteps"
                  rows={5}
                  maxLength={2000}
                  defaultValue={editingDefaults.workflowSteps}
                  className="w-full rounded-[1rem] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-[#d9ff00]"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs uppercase tracking-[0.22em] text-white/45">
                  Restricciones y guardrails
                </span>
                <textarea
                  required
                  name="guardrails"
                  rows={4}
                  maxLength={1400}
                  defaultValue={editingDefaults.guardrails}
                  className="w-full rounded-[1rem] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-[#d9ff00]"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs uppercase tracking-[0.22em] text-white/45">
                  Como se ve una buena respuesta
                </span>
                <textarea
                  required
                  name="successDefinition"
                  rows={4}
                  maxLength={900}
                  defaultValue={editingDefaults.successDefinition}
                  className="w-full rounded-[1rem] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-[#d9ff00]"
                />
              </label>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setEditingAgent(null)}
                  className="flex-1 rounded-full border border-white/12 bg-white/6 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-full border border-[#d9ff00]/30 bg-[#d9ff00] px-5 py-3 text-sm font-medium text-black transition hover:bg-[#e5ff45]"
                >
                  Guardar cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
