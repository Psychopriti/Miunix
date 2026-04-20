import { AgentExecutionError } from "@/ai/agent-runner";
import {
  jsonError,
  jsonSuccess,
  parseJsonBody,
  requireAuthenticatedProfile,
} from "@/lib/api";
import { OPENAI_QUALITY_MODEL, openai } from "@/lib/openai";
import { ensurePremiumUserProfile } from "@/lib/premium";

type AgentBlueprintResponse = {
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

function validateBlueprint(payload: Record<string, unknown>): AgentBlueprintResponse {
  const nextSteps = Array.isArray(payload.nextSteps)
    ? payload.nextSteps.filter((item): item is string => typeof item === "string")
    : [];

  const fields = [
    "name",
    "shortDescription",
    "mainGoal",
    "targetUser",
    "tone",
    "workflowSteps",
    "guardrails",
    "successDefinition",
    "rationale",
  ] as const;

  const normalized = Object.fromEntries(
    fields.map((field) => [field, String(payload[field] ?? "").trim()]),
  ) as Record<(typeof fields)[number], string>;

  for (const field of fields) {
    if (!normalized[field]) {
      throw new AgentExecutionError(
        `La respuesta del builder agent llego incompleta en ${field}.`,
        500,
      );
    }
  }

  return {
    ...normalized,
    nextSteps:
      nextSteps.length > 0
        ? nextSteps.slice(0, 4)
        : [
            "Revisa el tono y ajustalo a tu audiencia real.",
            "Valida que los guardrails eviten promesas irreales.",
            "Haz una primera prueba desde el dashboard cuando lo crees.",
          ],
  };
}

export async function POST(request: Request) {
  const auth = await requireAuthenticatedProfile();

  if (auth.errorResponse || !auth.profile) {
    return auth.errorResponse ?? jsonError({ error: "Unauthorized", status: 401 });
  }

  try {
    ensurePremiumUserProfile(auth.profile);
  } catch (error) {
    return jsonError({
      error:
        error instanceof Error
          ? error.message
          : "Necesitas MIUNIX+ para usar este builder agent.",
      status: 403,
    });
  }

  const parsedBody = await parseJsonBody<{ brief?: unknown }>(request);

  if (parsedBody.errorResponse || !parsedBody.data) {
    return parsedBody.errorResponse ?? jsonError({ error: "Invalid JSON", status: 400 });
  }

  const brief =
    typeof parsedBody.data.brief === "string" ? parsedBody.data.brief.trim() : "";

  if (!brief) {
    return jsonError({
      error: "Debes describir que agente quieres crear.",
      status: 400,
    });
  }

  if (brief.length > 2500) {
    return jsonError({
      error: "La descripcion es demasiado larga.",
      status: 400,
    });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: OPENAI_QUALITY_MODEL,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: [
            "You are the MIUNIX+ Builder Agent inside the premium center.",
            "Your job is to transform a rough idea into a private zero-code agent blueprint.",
            "Return only valid JSON.",
            "The user is usually creating support, onboarding, sales, operations, or customer success agents.",
            "Make the proposal concrete, realistic, and executable.",
            "Avoid generic filler and avoid making the agent sound magical.",
            "Prefer Spanish because the product UI is in Spanish.",
            "Return this JSON shape exactly:",
            "{",
            '  "name": string,',
            '  "shortDescription": string,',
            '  "mainGoal": string,',
            '  "targetUser": string,',
            '  "tone": string,',
            '  "workflowSteps": string,',
            '  "guardrails": string,',
            '  "successDefinition": string,',
            '  "rationale": string,',
            '  "nextSteps": string[]',
            "}",
          ].join("\n"),
        },
        {
          role: "user",
          content: [
            "Quiero crear este agente en MIUNIX+:",
            brief,
            "",
            "Genera un blueprint listo para llenar el formulario del centro premium.",
          ].join("\n"),
        },
      ],
    });

    const content = completion.choices[0]?.message?.content?.trim();

    if (!content) {
      throw new AgentExecutionError(
        "El builder agent no devolvio contenido.",
        500,
      );
    }

    const parsed = JSON.parse(content) as Record<string, unknown>;
    const blueprint = validateBlueprint(parsed);

    return jsonSuccess({
      blueprint,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No se pudo generar el blueprint.";

    return jsonError({
      error: message,
      status: error instanceof AgentExecutionError ? error.statusCode : 500,
    });
  }
}
