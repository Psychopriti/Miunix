import type { OpenAIModelId } from "@/types/openai";

type ServerEnv = {
  openAiApiKey: string;
  openAiModelDefault: OpenAIModelId;
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseServiceRoleKey: string;
};

type OpenAiEnv = Pick<ServerEnv, "openAiApiKey" | "openAiModelDefault">;

type SupabaseEnv = Pick<
  ServerEnv,
  "supabaseUrl" | "supabaseAnonKey" | "supabaseServiceRoleKey"
>;

function getRequiredEnv(name: keyof NodeJS.ProcessEnv) {
  const value = process.env[name];

  if (!value || !value.trim()) {
    throw new Error(
      `Missing required environment variable: ${name}. Add it to your .env.local file.`,
    );
  }

  return value;
}

export function getServerEnv(): ServerEnv {
  return {
    ...getOpenAiEnv(),
    ...getSupabaseEnv(),
  };
}

export function getOpenAiEnv(): OpenAiEnv {
  return {
    openAiApiKey: getRequiredEnv("OPENAI_API_KEY"),
    openAiModelDefault:
      (process.env.OPENAI_MODEL_DEFAULT?.trim() as OpenAIModelId | undefined) ||
      "gpt-4o-mini",
  };
}

export function getSupabaseEnv(): SupabaseEnv {
  return {
    supabaseUrl: getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    supabaseAnonKey: getRequiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    supabaseServiceRoleKey: getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
  };
}
