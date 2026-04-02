import { redirect } from "next/navigation";

type LegacyAuthPageProps = {
  searchParams?: Promise<{
    message?: string;
  }>;
};

export default async function LegacyAuthPage({
  searchParams,
}: LegacyAuthPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const target = params?.message
    ? `/login?message=${encodeURIComponent(params.message)}`
    : "/login";

  redirect(target);
}
