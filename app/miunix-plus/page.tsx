import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Bot, Headphones, Layers3 } from "lucide-react";

import { SiteHeader } from "@/components/layout/site-header";
import { getCurrentProfile, getDefaultRouteForRole, isPremiumUser } from "@/lib/auth";
import { PREMIUM_PLAN_DEFINITIONS } from "@/lib/premium";
import { PlanPurchaseCards } from "./plan-purchase-cards";

export const metadata: Metadata = {
  title: "MIUNIX+",
  description: "Suscripcion premium para que usuarios creen agentes privados con zero code.",
};

type MiunixPlusPageProps = {
  searchParams?: Promise<{
    message?: string;
    type?: "success" | "error";
  }>;
};

const highlights = [
  {
    icon: Bot,
    title: "Zero-code DSL",
    description:
      "Creas agentes privados llenando una guia estructurada en vez de escribir codigo.",
  },
  {
    icon: Headphones,
    title: "Mejor customer service",
    description:
      "Plantillas para soporte, onboarding, seguimiento y respuestas mas claras para el cliente.",
  },
  {
    icon: Layers3,
    title: "Escala por plan",
    description:
      "Empiezas con 1 agente y creces a 3 o 5 segun el flujo que quieras cubrir.",
  },
];

export default async function MiunixPlusPage({
  searchParams,
}: MiunixPlusPageProps) {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  if (profile.role !== "user") {
    redirect(getDefaultRouteForRole(profile.role));
  }

  if (isPremiumUser(profile)) {
    redirect("/miunix-plus-center");
  }

  const params = searchParams ? await searchParams : undefined;

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <section className="mx-auto flex min-h-screen w-full max-w-[1280px] flex-col px-5 py-5 sm:px-8 sm:py-7">
        <div className="flex min-h-[calc(100vh-2.5rem)] flex-1 flex-col rounded-[2rem] border border-white/8 bg-[#080808] px-5 py-5 shadow-[0_30px_120px_rgba(0,0,0,0.55)] sm:px-8 sm:py-7 lg:px-10 lg:py-8">
          <SiteHeader currentPath="/miunix-plus" />

          <section className="flex flex-1 flex-col gap-8 pb-8 pt-10 sm:pt-14">
            <div className="grid gap-6 rounded-[1.8rem] border border-white/10 bg-[linear-gradient(120deg,#d9ff00_0%,#dff0ab_32%,#88c9ff_100%)] px-6 py-7 text-black shadow-[0_20px_55px_rgba(0,0,0,0.24)] lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-black/55">
                  MIUNIX+
                </p>
                <h1 className="mt-3 max-w-3xl text-balance text-[2.4rem] font-medium leading-[0.95] tracking-[-0.06em] sm:text-[3.6rem]">
                  Convierte tu cuenta user en un centro privado de agentes
                </h1>
                <p className="mt-4 max-w-2xl text-sm leading-6 text-black/72 sm:text-base">
                  MIUNIX+ te deja crear agentes propios sin codigo, con una
                  experiencia guiada estilo DSL para soporte, onboarding, ventas,
                  operaciones y customer service.
                </p>
                <div className="mt-5 flex flex-wrap gap-3 text-xs uppercase tracking-[0.18em] text-black/55">
                  <span className="rounded-full border border-black/10 bg-black/8 px-3 py-2">
                    1, 3 o 5 agentes privados
                  </span>
                  <span className="rounded-full border border-black/10 bg-black/8 px-3 py-2">
                    Zero-code setup
                  </span>
                  <span className="rounded-full border border-black/10 bg-black/8 px-3 py-2">
                    Solo cuentas user
                  </span>
                </div>
              </div>

              <div className="grid gap-3">
                {highlights.map(({ icon: Icon, title, description }) => (
                  <article
                    key={title}
                    className="rounded-[1.1rem] border border-black/10 bg-black/8 px-4 py-4 backdrop-blur"
                  >
                    <div className="inline-flex rounded-full bg-black/10 p-2">
                      <Icon className="size-4" />
                    </div>
                    <h2 className="mt-3 text-sm font-semibold">{title}</h2>
                    <p className="mt-2 text-sm leading-5 text-black/65">
                      {description}
                    </p>
                  </article>
                ))}
              </div>
            </div>

            {params?.message ? (
              <div
                className={`rounded-[1rem] border px-4 py-3 text-sm ${
                  params.type === "error"
                    ? "border-[#ff7a7a]/30 bg-[#3a1111] text-[#ffd0d0]"
                    : "border-[#d9ff00]/20 bg-[#11190a] text-[#e9ff9a]"
                }`}
              >
                {params.message}
              </div>
            ) : null}

            <PlanPurchaseCards plans={PREMIUM_PLAN_DEFINITIONS} />

            <section className="grid gap-6 rounded-[1.6rem] border border-white/10 bg-white/[0.03] px-6 py-6 lg:grid-cols-[1fr_1fr]">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-white/45">
                  Ideas para empezar
                </p>
                <h2 className="mt-3 text-2xl font-medium tracking-[-0.04em] text-white">
                  Casos que hacen sentido para MIUNIX+
                </h2>
                <div className="mt-5 space-y-3 text-sm leading-6 text-white/68">
                  <p>Soporte de preguntas frecuentes con tono consistente.</p>
                  <p>Agente de onboarding para nuevos clientes o estudiantes.</p>
                  <p>Asistente interno para seguimiento comercial y postventa.</p>
                  <p>Playbook de customer success con proximos pasos accionables.</p>
                </div>
              </div>

              <div className="rounded-[1.4rem] border border-white/10 bg-[#0d0d0d] px-5 py-5">
                <p className="text-xs uppercase tracking-[0.22em] text-white/45">
                  Flujo
                </p>
                <div className="mt-4 space-y-3">
                  <p className="rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3 text-sm text-white/75">
                    1. Eliges plan y activas MIUNIX+.
                  </p>
                  <p className="rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3 text-sm text-white/75">
                    2. Entras al MIUNIX+ Center y completas tu DSL guiado.
                  </p>
                  <p className="rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3 text-sm text-white/75">
                    3. Tu agente queda privado y listo para ejecutarse desde dashboard.
                  </p>
                </div>

                <Link
                  href="/dashboard"
                  className="mt-5 inline-flex rounded-full border border-white/12 bg-white/6 px-4 py-2 text-sm text-white/75 transition hover:bg-white/10"
                >
                  Volver al dashboard
                </Link>
              </div>
            </section>
          </section>
        </div>
      </section>
    </main>
  );
}
