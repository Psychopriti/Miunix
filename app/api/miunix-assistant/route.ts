import { NextResponse } from "next/server";

import { isPremiumUser } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase";
import { OPENAI_DEFAULT_MODEL, openai } from "@/lib/openai";
import { ensureProfileForUser } from "@/lib/auth";
import { jsonError, parseJsonBody } from "@/lib/api";
import { enforceRateLimit } from "@/lib/security";

const FREE_PROMPT_LIMIT = 10;
const COOKIE_NAME = "miunix_assistant_runs";

type AssistantMessage = {
  role: "user" | "assistant";
  content: string;
};

type AssistantRequest = {
  messages?: unknown;
};

function readPromptCount(request: Request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const cookies = cookieHeader.split(";").map((cookie) => cookie.trim());
  const rawValue = cookies
    .find((cookie) => cookie.startsWith(`${COOKIE_NAME}=`))
    ?.split("=")[1];
  const parsed = Number.parseInt(rawValue ?? "0", 10);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function normalizeMessages(value: unknown) {
  if (!Array.isArray(value)) {
    return [] satisfies AssistantMessage[];
  }

  return value
    .slice(-8)
    .flatMap((message): AssistantMessage[] => {
      if (
        !message ||
        typeof message !== "object" ||
        !("content" in message) ||
        typeof message.content !== "string"
      ) {
        return [];
      }

      const role =
        "role" in message && message.role === "assistant"
          ? "assistant"
          : "user";
      const content = message.content.trim().slice(0, 900);

      return content ? [{ role, content }] : [];
    });
}

function buildFallbackMessage(latestUserMessage: string) {
  const normalized = latestUserMessage.toLowerCase();

  if (/(dev|developer|desarrollador|publicar|vender|subir|api|herramienta)/i.test(normalized)) {
    return "Si eres developer y quieres publicar un agente, el mejor camino es [Developers](/developers). Ahi puedes preparar tu agente para venderlo o integrarlo en Miunix. Siguiente paso: entra a Developers y revisa como presentar tu agente, sus herramientas y el caso de uso que resuelve.";
  }

  if (/(venta|ventas|lead|prospect|cliente|outreach|b2b|crm)/i.test(normalized)) {
    return "Para ventas y prospeccion te conviene [Lead Generation](/marketplace/lead-generation). Te ayuda a definir ICP, detectar dolores, priorizar prospectos y crear mensajes de outreach listos para usar.";
  }

  if (/(marketing|contenido|copy|campana|campaña|email|anuncio|post|redes)/i.test(normalized)) {
    return "Para campanas, anuncios, emails o posts te conviene [Marketing Content](/marketplace/marketing-content). Convierte un brief corto en concepto, titulares, copy, CTAs e ideas de contenido.";
  }

  if (/(research|investig|analisis|análisis|competidor|mercado|tendencia|brief)/i.test(normalized)) {
    return "Para investigar mercados, competidores o tendencias te conviene [Research](/marketplace/research). Te devuelve un analisis estructurado con insights, oportunidades, riesgos y recomendacion.";
  }

  if (/(workflow|flujo|equipo|secuencia|automatizar|automatizacion|automatización)/i.test(normalized)) {
    return "Si quieres automatizar un proceso con varios pasos, revisa [Workflows](/workflows). Los workflows corren equipos de agentes en secuencia para convertir una tarea grande en un flujo mas ordenado.";
  }

  if (/(miunix|que es|qué es|plataforma|hola|inicio)/i.test(normalized)) {
    return "Miunix es una plataforma para comprar, crear y ejecutar agentes de IA sin codigo. Puedes empezar con agentes listos en [Marketplace](/marketplace): Lead Generation para ventas, Marketing Content para campanas y Research para analisis. Si necesitas un agente privado, revisa [MIUNIX+](/miunix-plus).";
  }

  return "Miunix te ayuda a usar agentes de IA listos o crear soluciones privadas. Para explorar agentes entra a [Marketplace](/marketplace); si quieres publicar o vender un agente, ve a [Developers](/developers); y si necesitas algo personalizado, revisa [MIUNIX+](/miunix-plus).";
}

async function getPremiumAccess() {
  try {
    const supabase = await createServerSupabaseClient();
    const userResult = await supabase.auth.getUser();

    if (userResult.error || !userResult.data.user) {
      return false;
    }

    const profile = await ensureProfileForUser(userResult.data.user);

    return isPremiumUser(profile);
  } catch (error) {
    console.error("Miunix assistant premium check failed", error);
    return false;
  }
}

export async function POST(request: Request) {
  const rateLimitResponse = enforceRateLimit(request, {
    keyPrefix: "miunix-assistant",
    limit: 120,
    windowMs: 60 * 60 * 1000,
  });

  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const parsedBody = await parseJsonBody<AssistantRequest>(request);

  if (parsedBody.errorResponse || !parsedBody.data) {
    return parsedBody.errorResponse ?? jsonError({ error: "Invalid JSON", status: 400 });
  }

  const messages = normalizeMessages(parsedBody.data.messages);
  const latestMessage = messages[messages.length - 1];

  if (!latestMessage || latestMessage.role !== "user") {
    return jsonError({
      error: "Escribe una pregunta para el asistente de Miunix.",
      status: 400,
    });
  }

  const hasPremiumAccess = await getPremiumAccess();
  const usedPrompts = readPromptCount(request);

  if (!hasPremiumAccess && usedPrompts >= FREE_PROMPT_LIMIT) {
    return NextResponse.json(
      {
        success: false,
        requiresUpgrade: true,
        remainingPrompts: 0,
        error:
          "Ya usaste los 10 prompts gratis del asistente. MIUNIX+ incluye runs ilimitados.",
      },
      { status: 402 },
    );
  }

  let assistantMessage = buildFallbackMessage(latestMessage.content);

  try {
    const response = await openai.chat.completions.create({
      model: OPENAI_DEFAULT_MODEL,
      messages: [
      {
        role: "system",
        content: [
          "Eres el asistente oficial de Miunix en la pagina de inicio.",
          "Responde siempre en español claro, breve y útil.",
          "Tu trabajo es explicar que Miunix permite comprar, crear y ejecutar agentes de IA sin codigo.",
          "Cuando recomiendes una solucion, vendela de forma concreta: problema que resuelve, por que conviene y siguiente paso.",
          "Incluye siempre un enlace interno en formato markdown [Texto](/ruta) cuando mandes al usuario a una pagina.",
          "Usa solo estas rutas internas:",
          "- [Marketplace](/marketplace) para explorar todos los agentes.",
          "- [Lead Generation](/marketplace/lead-generation) para ventas, prospectos, ICP, leads y outreach. Precio: acceso inmediato gratis.",
          "- [Marketing Content](/marketplace/marketing-content) para campañas, emails, anuncios, copies y contenido. Precio: acceso inmediato gratis.",
          "- [Research](/marketplace/research) para investigacion, competidores, tendencias, briefs y analisis. Precio: acceso inmediato gratis.",
          "- [Workflows](/workflows) para equipos de agentes en secuencia. Los precios mensuales se ven en la pagina segun el workflow.",
          "- [MIUNIX+](/miunix-plus) para crear agentes privados cuando no exista una solucion lista. Planes mensuales: Starter $9/mo, Pro $19/mo, Scale $39/mo; todos incluyen runs ilimitados del asistente.",
          "- [Developers](/developers) si quiere publicar o vender agentes en Miunix.",
          "Recomienda el mejor camino segun la necesidad del usuario:",
          "- Marketplace para agentes ya listos.",
          "- Lead Generation para prospeccion y ventas B2B.",
          "- Marketing Content para campañas, emails, copies y contenido.",
          "- Research para investigacion, competidores, tendencias y briefs.",
          "- Workflows para correr equipos de agentes en secuencia.",
          "- MIUNIX+ si necesita un agente privado o no existe un agente para su necesidad.",
          "- Developers si quiere publicar agentes, traer herramientas/API o vender agentes en la plataforma.",
          "Si el usuario no sabe que necesita, haz 1 o 2 preguntas maximo y ofrece una ruta concreta.",
          "No prometas funcionalidades inexistentes. Si algo es avanzado o personalizado, guia hacia MIUNIX+ o Developers.",
          "Cierra con un siguiente paso accionable y una ruta sugerida cuando aplique.",
          "Ejemplo de estilo: Para ventas B2B, te conviene [Lead Generation](/marketplace/lead-generation): acceso inmediato gratis, ideal para detectar prospectos y crear mensajes de outreach.",
        ].join("\n"),
      },
      ...messages,
      ],
    });

    assistantMessage =
      response.choices[0]?.message?.content?.trim() ?? assistantMessage;
  } catch (error) {
    console.error("Miunix assistant OpenAI request failed", error);
  }

  const nextPromptCount = hasPremiumAccess ? usedPrompts : usedPrompts + 1;
  const remainingPrompts = hasPremiumAccess
    ? null
    : Math.max(FREE_PROMPT_LIMIT - nextPromptCount, 0);
  const payload = {
    success: true,
    message: assistantMessage,
    remainingPrompts,
    hasPremiumAccess,
  };
  const jsonResponse = NextResponse.json(payload);

  if (!hasPremiumAccess) {
    jsonResponse.cookies.set(COOKIE_NAME, String(nextPromptCount), {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });
  }

  return jsonResponse;
}
