import { listAgents } from "@/ai/agent-runner";
import { handleRouteError, jsonSuccess } from "@/lib/api";

export async function GET() {
  try {
    const agents = await listAgents();

    return jsonSuccess({
      agents,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
