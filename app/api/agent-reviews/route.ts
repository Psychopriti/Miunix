import { upsertAgentReview } from "@/ai/agent-reviews";
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
      rating?: unknown;
      reviewText?: unknown;
    }>(request);

    if (parsedBody.errorResponse || !parsedBody.data) {
      return parsedBody.errorResponse ?? jsonError({ error: "Invalid JSON", status: 400 });
    }

    const body = parsedBody.data;

    const agentId =
      typeof body.agentId === "string" ? body.agentId.trim() : "";
    const rating =
      typeof body.rating === "number"
        ? body.rating
        : Number.parseInt(String(body.rating ?? ""), 10);
    const reviewText =
      typeof body.reviewText === "string" ? body.reviewText : undefined;

    if (!agentId) {
      return NextResponse.json(
        {
          success: false,
          error: "agentId is required.",
        },
        { status: 400 },
      );
    }

    const review = await upsertAgentReview({
      profileId: auth.profile.id,
      agentId,
      rating,
      reviewText,
    });

    return jsonSuccess({
      review,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
