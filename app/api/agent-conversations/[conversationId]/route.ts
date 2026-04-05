import {
  deleteConversation,
  updateConversationMetadata,
} from "@/ai/agent-conversations";
import {
  handleRouteError,
  jsonError,
  jsonSuccess,
  parseJsonBody,
  requireAuthenticatedProfile,
  requireTrimmedString,
} from "@/lib/api";

type ConversationRouteContext = {
  params: Promise<{
    conversationId: string;
  }>;
};

export async function PATCH(request: Request, context: ConversationRouteContext) {
  try {
    const auth = await requireAuthenticatedProfile();

    if (auth.errorResponse || !auth.profile) {
      return auth.errorResponse ?? jsonError({ error: "Unauthorized", status: 401 });
    }

    const { conversationId } = await context.params;
    const parsedBody = await parseJsonBody<{
      title?: unknown;
    }>(request);

    if (parsedBody.errorResponse || !parsedBody.data) {
      return parsedBody.errorResponse ?? jsonError({ error: "Invalid JSON", status: 400 });
    }

    const title = requireTrimmedString(parsedBody.data.title, "title", {
      maxLength: 72,
    });

    const conversation = await updateConversationMetadata({
      conversationId,
      profileId: auth.profile.id,
      title,
    });

    return jsonSuccess({
      conversation,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(
  _request: Request,
  context: ConversationRouteContext,
) {
  try {
    const auth = await requireAuthenticatedProfile();

    if (auth.errorResponse || !auth.profile) {
      return auth.errorResponse ?? jsonError({ error: "Unauthorized", status: 401 });
    }

    const { conversationId } = await context.params;

    await deleteConversation({
      conversationId,
      profileId: auth.profile.id,
    });

    return jsonSuccess({});
  } catch (error) {
    return handleRouteError(error);
  }
}
