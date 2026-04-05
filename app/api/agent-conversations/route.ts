import { createAgentConversation } from "@/ai/agent-conversations";
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
      title?: unknown;
    }>(request);

    if (parsedBody.errorResponse || !parsedBody.data) {
      return parsedBody.errorResponse ?? jsonError({ error: "Invalid JSON", status: 400 });
    }

    const body = parsedBody.data;

    const agentId =
      typeof body.agentId === "string" ? body.agentId.trim() : "";
    const title = typeof body.title === "string" ? body.title : undefined;

    if (!agentId) {
      return NextResponse.json(
        { success: false, error: "agentId is required." },
        { status: 400 },
      );
    }

    const conversation = await createAgentConversation({
      profileId: auth.profile.id,
      agentId,
      title,
    });

    return jsonSuccess({
      conversation,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
