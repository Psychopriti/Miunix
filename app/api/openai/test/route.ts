import { NextResponse } from "next/server";

import { OPENAI_DEFAULT_MODEL, openai } from "@/lib/openai";

export async function POST() {
  const startedAt = Date.now();

  try {
    const response = await openai.chat.completions.create({
      model: OPENAI_DEFAULT_MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are a connection test. Reply in Spanish with a very short confirmation.",
        },
        {
          role: "user",
          content:
            "Confirma que la conexion con OpenAI funciona. Incluye la palabra OK.",
        },
      ],
    });

    const content = response.choices[0]?.message?.content?.trim();

    return NextResponse.json({
      success: true,
      model: response.model,
      message: content || "Conexion exitosa con OpenAI. OK",
      latencyMs: Date.now() - startedAt,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "OpenAI connection test failed.";

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 },
    );
  }
}
