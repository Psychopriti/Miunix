type ClientEnv = {
  supabaseUrl: string;
  supabaseAnonKey: string;
};

function getRequiredPublicEnv(name: "NEXT_PUBLIC_SUPABASE_URL" | "NEXT_PUBLIC_SUPABASE_ANON_KEY") {
  const value = process.env[name];

  if (!value || !value.trim()) {
    throw new Error(
      `Missing required public environment variable: ${name}. Add it to your .env.local file.`,
    );
  }

  return value;
}

export function getClientEnv(): ClientEnv {
  return {
    supabaseUrl: getRequiredPublicEnv("NEXT_PUBLIC_SUPABASE_URL"),
    supabaseAnonKey: getRequiredPublicEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  };
}
