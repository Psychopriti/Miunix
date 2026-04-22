import { NextResponse } from "next/server";

import { isPremiumUser } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase";
import { OPENAI_DEFAULT_MODEL, openai } from "@/lib/openai";
import { ensureProfileForUser } from "@/lib/auth";
import { jsonError, parseJsonBody } from "@/lib/api";

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

async function getPremiumAccess() {
  const supabase = await createServerSupabaseClient();
  const userResult = await supabase.auth.getUser();

  if (userResult.error || !userResult.data.user) {
    return false;
  }

  const profile = await ensureProfileForUser(userResult.data.user);

  return isPremiumUser(profile);
}

export async function POST(request: Request) {
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

  const response = await openai.chat.completions.create({
    model: OPENAI_DEFAULT_MODEL,
    max_tokens: 520,
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

  const nextPromptCount = hasPremiumAccess ? usedPrompts : usedPrompts + 1;
  const remainingPrompts = hasPremiumAccess
    ? null
    : Math.max(FREE_PROMPT_LIMIT - nextPromptCount, 0);
  const payload = {
    success: true,
    message:
      response.choices[0]?.message?.content?.trim() ??
      "Puedo ayudarte a elegir un agente, un workflow o MIUNIX+ segun tu necesidad.",
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
