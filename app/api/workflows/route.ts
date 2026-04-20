import { listPublishedWorkflows } from "@/lib/workflows";
import {
  handleRouteError,
  jsonSuccess,
  requireAuthenticatedProfile,
} from "@/lib/api";

export async function GET() {
  try {
    const auth = await requireAuthenticatedProfile();
    const profileId = auth.profile?.id ?? null;
    const workflows = await listPublishedWorkflows(profileId);

    return jsonSuccess({
      workflows,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
