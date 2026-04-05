import { NextResponse } from "next/server";

import { AgentExecutionError } from "@/ai/agent-runner";
import { ensureProfileForUser } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase";

export type ApiErrorCode =
  | "UNAUTHORIZED"
  | "INVALID_JSON"
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "INTERNAL_ERROR";

export function jsonSuccess<T extends Record<string, unknown>>(
  payload: T,
  init?: ResponseInit,
) {
  return NextResponse.json(
    {
      success: true,
      ...payload,
    },
    init,
  );
}

export function jsonError({
  error,
  status,
  code,
  details,
}: {
  error: string;
  status?: number;
  code?: ApiErrorCode;
  details?: Record<string, unknown>;
}) {
  return NextResponse.json(
    {
      success: false,
      error,
      code: code ?? inferErrorCode(status ?? 500),
      ...(details ? { details } : {}),
    },
    { status: status ?? 500 },
  );
}

function inferErrorCode(status: number): ApiErrorCode {
  if (status === 400) {
    return "VALIDATION_ERROR";
  }

  if (status === 401 || status === 403) {
    return "UNAUTHORIZED";
  }

  if (status === 404) {
    return "NOT_FOUND";
  }

  return "INTERNAL_ERROR";
}

export function handleRouteError(error: unknown) {
  const message =
    error instanceof Error ? error.message : "Internal server error";
  const status = error instanceof AgentExecutionError ? error.statusCode : 500;

  return jsonError({
    error: message,
    status,
  });
}

export async function requireAuthenticatedProfile() {
  const supabase = await createServerSupabaseClient();
  const userResult = await supabase.auth.getUser();

  if (userResult.error || !userResult.data.user) {
    return {
      errorResponse: jsonError({
        error: "Unauthorized",
        status: 401,
      }),
      profile: null,
    };
  }

  const profile = await ensureProfileForUser(userResult.data.user);

  return {
    errorResponse: null,
    profile,
  };
}

export async function parseJsonBody<T>(request: Request) {
  try {
    return {
      data: (await request.json()) as T,
      errorResponse: null,
    };
  } catch {
    return {
      data: null,
      errorResponse: jsonError({
        error: "Request body must be valid JSON.",
        status: 400,
        code: "INVALID_JSON",
      }),
    };
  }
}

export function requireTrimmedString(
  value: unknown,
  fieldName: string,
  {
    optional = false,
    maxLength,
  }: {
    optional?: boolean;
    maxLength?: number;
  } = {},
) {
  const normalized = typeof value === "string" ? value.trim() : "";

  if (!normalized) {
    if (optional) {
      return null;
    }

    throw new AgentExecutionError(`${fieldName} is required.`, 400);
  }

  if (maxLength && normalized.length > maxLength) {
    throw new AgentExecutionError(
      `${fieldName} must be ${maxLength} characters or fewer.`,
      400,
    );
  }

  return normalized;
}
