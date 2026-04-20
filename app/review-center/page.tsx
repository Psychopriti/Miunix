import type { Metadata } from "next";
import { redirect } from "next/navigation";

import {
  deleteApprovedAgentAction,
  runReviewTestAction,
  updateReviewStatusAction,
} from "@/app/actions/review-center";
import { SiteHeader } from "@/components/layout/site-header";
import { getCurrentProfile } from "@/lib/auth";
import {
  ensureAdminProfile,
  listLatestReviewTestRuns,
  listReviewQueueAgents,
} from "@/lib/dev-center";
import { ReviewCenterClient } from "./review-center-client";

export const metadata: Metadata = {
  title: "Review Center",
  description: "Panel de revision para agentes enviados por developers.",
};

type ReviewCenterPageProps = {
  searchParams?: Promise<{
    message?: string;
    type?: "success" | "error";
  }>;
};

export default async function ReviewCenterPage({
  searchParams,
}: ReviewCenterPageProps) {
  const profile = await getCurrentProfile();

  if (!profile) redirect("/login");
  if (profile.role !== "admin") redirect("/dashboard");

  ensureAdminProfile(profile);

  const params = searchParams ? await searchParams : undefined;
  const queue = await listReviewQueueAgents();
  const latestRuns = await listLatestReviewTestRuns(queue.map((a) => a.id));

  // Serializar el Map a un array plano para pasarlo como prop al Client Component
  const latestRunsArray = Array.from(latestRuns.entries()).map(
    ([agentId, run]) => ({ agentId, run }),
  );

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <section className="mx-auto flex min-h-screen w-full max-w-[1280px] flex-col px-5 py-5 sm:px-8 sm:py-7">
        <div className="flex min-h-[calc(100vh-2.5rem)] flex-1 flex-col rounded-[2rem] border border-white/8 bg-[#080808] px-5 py-5 shadow-[0_30px_120px_rgba(0,0,0,0.55)] sm:px-8 sm:py-7 lg:px-10 lg:py-8">
          <SiteHeader currentPath="/review-center" />

          <ReviewCenterClient
            queue={queue}
            latestRunsArray={latestRunsArray}
            message={params?.message}
            messageType={params?.type}
            runReviewTestAction={runReviewTestAction}
            updateReviewStatusAction={updateReviewStatusAction}
            deleteApprovedAgentAction={deleteApprovedAgentAction}
          />
        </div>
      </section>
    </main>
  );
}
