import Link from "next/link";
import { redirect } from "next/navigation";

import { SiteHeader } from "@/components/layout/site-header";
import { ensureProfileForUser } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase";

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const [{ data: userResult }, { data: executions }] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from("agent_executions")
      .select("id, status, created_at, output_data, agent_id")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const user = userResult.user;

  if (!user) {
    redirect("/login");
  }

  const profile = await ensureProfileForUser(user);

  const agentIds = executions?.map((execution) => execution.agent_id) ?? [];
  const agentLookup = new Map<string, string>();

  if (agentIds.length > 0) {
    const { data: agents } = await supabase
      .from("agents")
      .select("id, name")
      .in("id", agentIds);

    agents?.forEach((agent) => {
      agentLookup.set(agent.id, agent.name);
    });
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <section className="mx-auto flex min-h-screen w-full max-w-[1280px] flex-col px-5 py-5 sm:px-8 sm:py-7">
        <div className="flex min-h-[calc(100vh-2.5rem)] flex-1 flex-col rounded-[2rem] border border-white/8 bg-[#080808] px-5 py-5 shadow-[0_30px_120px_rgba(0,0,0,0.55)] sm:px-8 sm:py-7 lg:px-10 lg:py-8">
          <SiteHeader currentPath="/dashboard" />

          <section className="flex flex-1 flex-col gap-8 pb-6 pt-10">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.32em] text-[#D7F205]">
                  Dashboard
                </p>
                <h1 className="mt-3 text-balance font-heading text-[2.5rem] uppercase leading-[0.94] tracking-[-0.06em] sm:text-[3.7rem]">
                  Sesion autenticada y perfil listo
                </h1>
              </div>

              <Link
                href="/marketplace"
                className="inline-flex w-fit items-center rounded-full border border-white/10 bg-white/4 px-4 py-2 text-sm text-white/76 transition hover:bg-white/8 hover:text-white"
              >
                Ir al marketplace
              </Link>
            </div>

            <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-[1.8rem] border border-white/10 bg-[linear-gradient(180deg,rgba(143,144,255,0.12),rgba(255,255,255,0.02))] p-6">
                <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                  Cuenta
                </p>
                <div className="mt-5 space-y-4 text-sm text-white/76">
                  <div>
                    <p className="text-white/38">Email</p>
                    <p className="mt-1 text-white">{user.email}</p>
                  </div>
                  <div>
                    <p className="text-white/38">Auth User ID</p>
                    <p className="mt-1 break-all text-white">{user.id}</p>
                  </div>
                  <div>
                    <p className="text-white/38">Profile ID</p>
                    <p className="mt-1 break-all text-white">
                      {profile?.id ?? "No disponible"}
                    </p>
                  </div>
                  <div>
                    <p className="text-white/38">Rol</p>
                    <p className="mt-1 text-white">{profile?.role ?? "user"}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-[1.8rem] border border-white/10 bg-[#0d0d0d] p-6">
                <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                  Estado
                </p>

                <div className="mt-5 space-y-4">
                  <div className="rounded-[1.2rem] border border-[#d9ff00]/20 bg-[#d9ff00]/8 p-4">
                    <p className="text-sm font-medium text-[#eff7c9]">
                      Auth activo
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[#d9e5aa]">
                      La sesion se esta leyendo en server components y los
                      endpoints ya pueden usar el perfil autenticado.
                    </p>
                  </div>

                  <div className="rounded-[1.2rem] border border-white/10 bg-white/4 p-4 text-sm leading-6 text-white/72">
                    Siguiente paso sugerido: conectar la UI de ejecucion de
                    agentes para que tome el `profileId` desde esta sesion sin
                    pedirlo manualmente.
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[1.8rem] border border-white/10 bg-[#0d0d0d] p-6">
              <div className="flex items-center justify-between gap-4">
                <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                  Ultimas ejecuciones
                </p>
                <span className="text-xs uppercase tracking-[0.22em] text-white/32">
                  RLS + sesion
                </span>
              </div>

              <div className="mt-5 space-y-3">
                {executions && executions.length > 0 ? (
                  executions.map((execution) => (
                    <div
                      key={execution.id}
                      className="rounded-[1.15rem] border border-white/10 bg-white/4 px-4 py-4"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm text-white">
                            {agentLookup.get(execution.agent_id) ?? "Agente"}
                          </p>
                          <p className="mt-1 text-xs uppercase tracking-[0.18em] text-white/34">
                            {execution.status} ·{" "}
                            {new Date(execution.created_at).toLocaleString()}
                          </p>
                        </div>
                        <p className="max-w-xl text-sm leading-6 text-white/68">
                          {typeof execution.output_data === "object" &&
                          execution.output_data !== null &&
                          "text" in execution.output_data &&
                          typeof execution.output_data.text === "string"
                            ? execution.output_data.text.slice(0, 140)
                            : "Sin salida registrada todavia."}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[1.15rem] border border-dashed border-white/14 bg-white/3 px-4 py-5 text-sm text-white/56">
                    Todavia no hay ejecuciones para esta cuenta.
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
