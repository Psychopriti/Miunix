import { executeAgentWithProgress, AgentExecutionError } from "@/ai/agent-runner";
import {
  jsonError,
  parseJsonBody,
  requireAuthenticatedProfile,
} from "@/lib/api";

function encodeSseEvent(event: string, payload: unknown) {
  return `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
}

export async function POST(request: Request) {
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

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, payload: unknown) => {
        controller.enqueue(encoder.encode(encodeSseEvent(event, payload)));
      };

      try {
        send("started", {
          startedAt: new Date().toISOString(),
        });

        const result = await executeAgentWithProgress({
          profileId: auth.profile.id,
          agentId: agentId || undefined,
          agentSlug: agentSlug || undefined,
          conversationId: conversationId || undefined,
          input,
          onProgress: async (progressEvent) => {
            send("progress", progressEvent);
          },
        });

        send("complete", {
          output: result.output,
          execution: {
            id: result.execution.id,
            status: result.execution.status,
            created_at: result.execution.created_at,
          },
          conversationId: result.conversationId,
          metadata: result.metadata ?? null,
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Internal server error";
        const status =
          error instanceof AgentExecutionError ? error.statusCode : 500;

        send("error", {
          error: message,
          status,
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
