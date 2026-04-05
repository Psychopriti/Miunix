import type { OpenAIModelId } from "@/types/openai";

type ServerEnv = {
  openAiApiKey: string;
  openAiModelDefault: OpenAIModelId;
  openAiModelQuality: OpenAIModelId;
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseServiceRoleKey: string;
  serperApiKey: string | null;
  tavilyApiKey: string | null;
};

type OpenAiEnv = Pick<
  ServerEnv,
  "openAiApiKey" | "openAiModelDefault" | "openAiModelQuality"
>;

type SupabaseEnv = Pick<
  ServerEnv,
  "supabaseUrl" | "supabaseAnonKey" | "supabaseServiceRoleKey"
>;

type SearchEnv = Pick<ServerEnv, "serperApiKey" | "tavilyApiKey">;

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
    ...getSearchEnv(),
  };
}

export function getOpenAiEnv(): OpenAiEnv {
  const openAiModelDefault =
    (process.env.OPENAI_MODEL_DEFAULT?.trim() as OpenAIModelId | undefined) ||
    "gpt-4o-mini";

  return {
    openAiApiKey: getRequiredEnv("OPENAI_API_KEY"),
    openAiModelDefault,
    openAiModelQuality:
      (process.env.OPENAI_MODEL_QUALITY?.trim() as OpenAIModelId | undefined) ||
      openAiModelDefault,
  };
}

export function getSupabaseEnv(): SupabaseEnv {
  return {
    supabaseUrl: getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    supabaseAnonKey: getRequiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    supabaseServiceRoleKey: getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
  };
}

export function getSearchEnv(): SearchEnv {
  return {
    serperApiKey: process.env.SERPER_API_KEY?.trim() || null,
    tavilyApiKey: process.env.TAVILY_API_KEY?.trim() || null,
  };
}
