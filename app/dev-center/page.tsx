import type { Metadata } from "next";
import { redirect } from "next/navigation";

import {
  createDeveloperAgentAction,
  submitDeveloperAgentForReviewAction,
} from "@/app/actions/dev-center";
import { SiteHeader } from "@/components/layout/site-header";
import { getCurrentProfile } from "@/lib/auth";
import { ensureDeveloperProfile, listDeveloperAgents } from "@/lib/dev-center";
import { SUPPORTED_DEV_MODELS } from "@/lib/dev-tools";
import { DevCenterClient } from "./dev-center-client";

export const metadata: Metadata = {
  title: "Dev Center",
  description: "Panel privado para developers que suben agentes con tools.",
};

type DevCenterPageProps = {
  searchParams?: Promise<{
    message?: string;
    type?: "success" | "error";
  }>;
};

const toolJsonExample = `[
  {
    "tool_name": "crm_lookup",
    "description": "Consulta contactos en el CRM externo",
    "source_type": "rest",
    "base_url": "https://api.example.com",
    "method": "GET",
    "path_template": "/v1/contacts/{email}",
    "headers_template": {
      "Accept": "application/json"
    },
    "auth_type": "bearer",
    "auth_header_name": null,
    "auth_prefix": null,
    "input_schema": {
      "type": "object",
      "properties": {
        "email": {
          "type": "string"
        }
      },
      "required": ["email"]
    },
    "output_schema": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string"
        },
        "company": {
          "type": "string"
        }
      }
    },
    "rate_limit_per_minute": 30,
    "timeout_ms": 10000,
    "openapi_spec_url": null,
    "webhook_url": null
  }
]`;

const toolSecretsExample = `{
  "crm_lookup": "sk_live_xxx"
}`;

export default async function DevCenterPage({
  searchParams,
}: DevCenterPageProps) {
  const profile = await getCurrentProfile();

  if (!profile) redirect("/login");
  if (profile.role !== "developer") redirect("/dashboard");

  ensureDeveloperProfile(profile);

  const params = searchParams ? await searchParams : undefined;
  const agents = await listDeveloperAgents(profile.id);

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <section className="mx-auto flex min-h-screen w-full max-w-[1280px] flex-col px-5 py-5 sm:px-8 sm:py-7">
        <div className="flex min-h-[calc(100vh-2.5rem)] flex-1 flex-col rounded-[2rem] border border-white/8 bg-[#080808] px-5 py-5 shadow-[0_30px_120px_rgba(0,0,0,0.55)] sm:px-8 sm:py-7 lg:px-10 lg:py-8">
          <SiteHeader currentPath="/dev-center" />

          <DevCenterClient
            agents={agents}
            message={params?.message}
            messageType={params?.type}
            defaultModel={SUPPORTED_DEV_MODELS[0]}
            toolJsonExample={toolJsonExample}
            toolSecretsExample={toolSecretsExample}
            createDeveloperAgentAction={createDeveloperAgentAction}
            submitDeveloperAgentForReviewAction={submitDeveloperAgentForReviewAction}
          />
        </div>
      </section>
    </main>
  );
}
