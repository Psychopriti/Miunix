import { executeWorkflow, normalizeWorkflowInputData } from "@/ai/workflow-runner";
import {
  handleRouteError,
  jsonError,
  jsonSuccess,
  parseJsonBody,
  requireAuthenticatedProfile,
} from "@/lib/api";

export async function POST(
  request: Request,
  context: RouteContext<"/api/workflows/[slug]/run">,
) {
  try {
    const { slug } = await context.params;
    const auth = await requireAuthenticatedProfile();

    if (auth.errorResponse || !auth.profile) {
      return auth.errorResponse ?? jsonError({ error: "Unauthorized", status: 401 });
    }

    const parsedBody = await parseJsonBody<{
      inputData?: unknown;
    }>(request);

    if (parsedBody.errorResponse || !parsedBody.data) {
      return parsedBody.errorResponse ?? jsonError({ error: "Invalid JSON", status: 400 });
    }

    const result = await executeWorkflow({
      profileId: auth.profile.id,
      workflowSlug: slug,
      inputData: normalizeWorkflowInputData(parsedBody.data.inputData),
    });

    return jsonSuccess({
      workflow: result.workflow,
      execution: result.execution,
      stepRuns: result.stepRuns,
      sharedContext: result.sharedContext,
      finalOutput: result.finalOutput,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
