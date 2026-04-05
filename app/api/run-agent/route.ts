import { executeAgent } from "@/ai/agent-runner";
import {
  handleRouteError,
  jsonError,
  jsonSuccess,
  parseJsonBody,
  requireAuthenticatedProfile,
} from "@/lib/api";

export async function POST(request: Request) {
  try {
    const auth = await requireAuthenticatedProfile();

    if (auth.errorResponse || !auth.profile) {
      return auth.errorResponse ?? jsonError({ error: "Unauthorized", status: 401 });
    }

    const parsedBody = await parseJsonBody<{
      agentId?: unknown;
      agentSlug?: unknown;
      conversationId?: unknown;
      input?: unknown;
    }>(request);

    if (parsedBody.errorResponse || !parsedBody.data) {
      return parsedBody.errorResponse ?? jsonError({ error: "Invalid JSON", status: 400 });
    }

    const body = parsedBody.data;
    const agentId = typeof body.agentId === "string" ? body.agentId.trim() : "";
    const agentSlug =
      typeof body.agentSlug === "string" ? body.agentSlug.trim() : "";
    const conversationId =
      typeof body.conversationId === "string"
        ? body.conversationId.trim()
        : "";
    const input = typeof body.input === "string" ? body.input : "";

    if (!agentId && !agentSlug) {
      return jsonError({
        error: "agentId or agentSlug is required.",
        status: 400,
      });
    }

    if (!input.trim()) {
      return jsonError({
        error: "input is required.",
        status: 400,
      });
    }

    const result = await executeAgent({
      profileId: auth.profile.id,
      agentId: agentId || undefined,
      agentSlug: agentSlug || undefined,
      conversationId: conversationId || undefined,
      input,
    });

    return jsonSuccess({
      executionId: result.execution.id,
      conversationId: result.conversationId,
      agent: result.agent,
      execution: result.execution,
      output: result.output,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
