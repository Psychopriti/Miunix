/**
 * DashboardPage — Página principal del dashboard de Agent Flow.
 *
 * Responsabilidades del Server Component:
 *  1. Verificar sesión activa; redirige a /login si no hay usuario.
 *  2. Obtener la lista de agentes instalados (estáticos en esta versión).
 *  3. Pasar datos al DashboardClient (Client Component) para la UI interactiva.
 *
 * Ruta: /dashboard  → app/(dashboard)/dashboard/page.tsx
 */

import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { createServerSupabaseClient } from "@/lib/supabase";
import { featuredAgents } from "@/lib/agents";
import { DashboardClient } from "./_components/dashboard-client";

/* ── Metadata de la página ──────────────────────────────────────────────── */

export const metadata: Metadata = {
  title: "Dashboard",
  description:
    "Gestiona y conversa con tus agentes de IA instalados en Agent Flow.",
};

/* ── Página ─────────────────────────────────────────────────────────────── */

export default async function DashboardPage() {
  /* 1. Verificar sesión */
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  /*
   * 2. Agentes disponibles.
   *    En esta versión se usan los agentes estáticos de lib/agents.tsx.
   *    En el futuro se podrá consultar la tabla `user_agents` de Supabase
   *    para filtrar únicamente los que el usuario tiene suscritos.
   */
  const agents = featuredAgents;

  /* 3. Renderizar UI interactiva con datos del servidor */
  return <DashboardClient agents={agents} userEmail={user.email} />;
}
