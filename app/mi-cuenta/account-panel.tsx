"use client";

import Link from "next/link";
import {
  BadgeX,
  BarChart3,
  Crown,
  LockKeyhole,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

import {
  unsubscribeMiunixPlusAction,
  unsubscribePurchasedAgentAction,
} from "@/app/actions/account";
import type { DashboardAccount } from "@/lib/dashboard";

type AccountPanelProps = {
  account: DashboardAccount;
  purchasedAgents: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  flashMessage?: string;
  flashType?: "success" | "error";
};

function formatDateLabel(timestamp: string | null) {
  if (!timestamp) {
    return "Sin fecha";
  }

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return "Sin fecha";
  }

  return date.toLocaleDateString("es-NI", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function AccountStatCard({
  icon: Icon,
  label,
  value,
  helper,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  helper: string;
}) {
  return (
    <article className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-4">
      <div className="flex items-center justify-between gap-3">
        <div className="rounded-xl border border-white/10 bg-white/6 p-2 text-white/60">
          <Icon className="h-4 w-4" />
        </div>
        <span className="text-2xl font-semibold tracking-[-0.04em] text-white">
          {value}
        </span>
      </div>
      <p className="mt-4 text-xs uppercase tracking-[0.16em] text-white/38">
        {label}
      </p>
      <p className="mt-2 text-xs leading-5 text-white/55">{helper}</p>
    </article>
  );
}

export function AccountPanel({
  account,
  purchasedAgents,
  flashMessage,
  flashType,
}: AccountPanelProps) {
  return (
    <div className="flex w-full flex-col gap-5 py-10">
      <section className="rounded-[1.6rem] border border-white/8 bg-[linear-gradient(135deg,rgba(35,51,45,0.95),rgba(12,12,12,0.96)_55%,rgba(217,255,0,0.13))] px-5 py-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[#d9ff00]/70">
              Mi cuenta
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.06em] text-white">
              {account.profileName}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/58">
              Ajustes, actividad y suscripciones asociadas a tu perfil de Miunix.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-4 text-sm text-white/68">
            <p className="text-xs uppercase tracking-[0.18em] text-white/35">
              Perfil
            </p>
            <p className="mt-2 max-w-[260px] truncate text-white">
              {account.email ?? "Sin correo"}
            </p>
            <p className="mt-1 capitalize text-white/42">{account.role}</p>
          </div>
        </div>
      </section>

      {flashMessage ? (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm ${
            flashType === "error"
              ? "border-red-400/20 bg-red-500/10 text-red-100"
              : "border-[#d9ff00]/20 bg-[#d9ff00]/8 text-[#efffa8]"
          }`}
        >
          {flashMessage}
        </div>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AccountStatCard
          icon={BarChart3}
          label="Prompts corridos"
          value={account.totalPromptRuns}
          helper="Ejecuciones registradas en tus conversaciones."
        />
        <AccountStatCard
          icon={Sparkles}
          label="Agentes activos"
          value={account.activeAgentCount}
          helper="Agentes disponibles ahora en tu dashboard."
        />
        <AccountStatCard
          icon={LockKeyhole}
          label="Agentes privados"
          value={`${account.privateAgentCount}/${account.premiumAgentLimit}`}
          helper="Capacidad usada de tu plan MIUNIX+."
        />
        <AccountStatCard
          icon={Crown}
          label="Compras"
          value={account.purchasedAgentCount + account.purchasedWorkflowCount}
          helper="Agentes y workflows activos en la cuenta."
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <article className="rounded-[1.4rem] border border-white/8 bg-white/[0.03] px-5 py-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-white/35">
                MIUNIX+
              </p>
              <h2 className="mt-2 text-xl font-semibold tracking-[-0.04em] text-white">
                {account.isPremium
                  ? account.premiumPlanName ?? "Plan activo"
                  : "Sin plan activo"}
              </h2>
            </div>
            <div className="rounded-full border border-[#d9ff00]/20 bg-[#d9ff00]/10 px-3 py-1 text-xs text-[#efffa8]">
              {account.isPremium ? "Activo" : "Inactivo"}
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-white/55">
            {account.isPremium
              ? `Activo desde ${formatDateLabel(account.premiumSince)}. Tus agentes privados aparecen en Mis Agentes mientras el plan este activo.`
              : "Activa MIUNIX+ para crear y ejecutar agentes privados desde el dashboard."}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href={account.isPremium ? "/miunix-plus-center" : "/miunix-plus"}
              className="rounded-xl bg-[#d9ff00] px-4 py-2 text-xs font-semibold text-black transition hover:bg-[#e8ff33]"
            >
              {account.isPremium ? "Administrar agentes privados" : "Ver planes"}
            </Link>
            {account.isPremium ? (
              <form action={unsubscribeMiunixPlusAction}>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-2 text-xs text-red-100 transition hover:bg-red-500/16"
                >
                  <BadgeX className="h-3.5 w-3.5" />
                  Desuscribirme de MIUNIX+
                </button>
              </form>
            ) : null}
          </div>
        </article>

        <article className="rounded-[1.4rem] border border-white/8 bg-white/[0.03] px-5 py-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-white/35">
                Agentes comprados
              </p>
              <h2 className="mt-2 text-xl font-semibold tracking-[-0.04em] text-white">
                {purchasedAgents.length} activos
              </h2>
            </div>
            <Link
              href="/marketplace"
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/65 transition hover:bg-white/8 hover:text-white"
            >
              Marketplace
            </Link>
          </div>

          <div className="mt-5 flex flex-col gap-2">
            {purchasedAgents.length > 0 ? (
              purchasedAgents.map((agent) => (
                <div
                  key={agent.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-white/8 bg-black/18 px-3 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white/85">
                      {agent.name}
                    </p>
                    <p className="mt-1 truncate text-xs text-white/35">
                      {agent.slug}
                    </p>
                  </div>
                  <form action={unsubscribePurchasedAgentAction}>
                    <input type="hidden" name="agentId" value={agent.id} />
                    <button
                      type="submit"
                      className="rounded-xl border border-red-400/18 bg-red-500/8 px-3 py-2 text-xs text-red-100 transition hover:bg-red-500/14"
                    >
                      Desuscribirme
                    </button>
                  </form>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 bg-black/12 px-4 py-5 text-sm text-white/45">
                No tienes agentes comprados activos.
              </div>
            )}
          </div>
        </article>
      </section>
    </div>
  );
}
