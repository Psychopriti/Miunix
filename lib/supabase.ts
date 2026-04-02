import { createBrowserClient, createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

import { getClientEnv } from "@/lib/env/client";
import { getServerEnv } from "@/lib/env/server";

import type { Database } from "@/types/database";

const clientEnv = getClientEnv();
const serverEnv = getServerEnv();

export function createBrowserSupabaseClient() {
  return createBrowserClient<Database>(
    clientEnv.supabaseUrl,
    clientEnv.supabaseAnonKey,
  );
}

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    serverEnv.supabaseUrl,
    serverEnv.supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server Components can read cookies but may not be able to persist them.
          }
        },
      },
    },
  );
}

export const supabaseAdmin = createClient<Database>(
  serverEnv.supabaseUrl,
  serverEnv.supabaseServiceRoleKey,
);
