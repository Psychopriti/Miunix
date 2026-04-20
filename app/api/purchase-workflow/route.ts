import { AgentExecutionError } from "@/ai/agent-runner";
import { purchaseWorkflowAccess } from "@/lib/workflows";
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
      workflowId?: unknown;
      workflowSlug?: unknown;
    }>(request);

    if (parsedBody.errorResponse || !parsedBody.data) {
      return parsedBody.errorResponse ?? jsonError({ error: "Invalid JSON", status: 400 });
    }

    const body = parsedBody.data;
    const workflowId =
      typeof body.workflowId === "string" ? body.workflowId.trim() : "";
    const workflowSlug =
      typeof body.workflowSlug === "string" ? body.workflowSlug.trim() : "";

    if (!workflowId && !workflowSlug) {
      return jsonError({
        error: "workflowId or workflowSlug is required.",
        status: 400,
      });
    }

    const result = await purchaseWorkflowAccess({
      profileId: auth.profile.id,
      workflowId: workflowId || undefined,
      workflowSlug: workflowSlug || undefined,
    });

    return jsonSuccess({
      alreadyOwned: result.alreadyOwned,
      workflow: {
        id: result.workflow.id,
        slug: result.workflow.slug,
        name: result.workflow.name,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Profile not found.") {
      return jsonError({ error: error.message, status: 404 });
    }

    if (error instanceof Error && error.message === "Workflow not found.") {
      return jsonError({ error: error.message, status: 404 });
    }

    if (
      error instanceof Error &&
      error.message === "Workflow is not available for purchase."
    ) {
      return jsonError({ error: error.message, status: 400 });
    }

    if (error instanceof AgentExecutionError) {
      return handleRouteError(error);
    }

    return handleRouteError(error);
  }
}
