import { getWorkflowBySlug } from "@/lib/workflows";
import {
  handleRouteError,
  jsonError,
  jsonSuccess,
  requireAuthenticatedProfile,
} from "@/lib/api";

export async function GET(
  _request: Request,
  context: RouteContext<"/api/workflows/[slug]">,
) {
  try {
    const { slug } = await context.params;
    const auth = await requireAuthenticatedProfile();
    const workflow = await getWorkflowBySlug(slug, auth.profile?.id ?? null);

    if (!workflow) {
      return jsonError({
        error: "Workflow not found.",
        status: 404,
      });
    }

    return jsonSuccess({
      workflow,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
