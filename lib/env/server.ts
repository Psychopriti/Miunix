type ServerEnv = {
  openAiApiKey: string;
  openAiModelDefault: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseServiceRoleKey: string;
};

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
    openAiApiKey: getRequiredEnv("OPENAI_API_KEY"),
    openAiModelDefault: process.env.OPENAI_MODEL_DEFAULT?.trim() || "gpt-5-mini",
    supabaseUrl: getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    supabaseAnonKey: getRequiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    supabaseServiceRoleKey: getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
  };
}
