"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BadgeX,
  BarChart3,
  Bot,
  ChevronRight,
  CreditCard,
  Crown,
  KeyRound,
  LockKeyhole,
  Settings2,
  Sparkles,
  User,
  type LucideIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import {
  unsubscribeMiunixPlusAction,
  unsubscribePurchasedAgentAction,
} from "@/app/actions/account";
import type { DashboardAccount } from "@/lib/dashboard";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "perfil" | "agentes" | "facturacion" | "seguridad" | "preferencias";

type AccountPanelProps = {
  account: DashboardAccount;
  purchasedAgents: Array<{ id: string; name: string; slug: string }>;
  flashMessage?: string;
  flashType?: "success" | "error";
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(ts: string | null) {
  if (!ts) return "Sin fecha";
  const d = new Date(ts);
  if (isNaN(d.getTime())) return "Sin fecha";
  return d.toLocaleDateString("es-NI", { day: "numeric", month: "short", year: "numeric" });
}

// ─── Motion presets ───────────────────────────────────────────────────────────

const fadeUp = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
};

const stagger = (i: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.38, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
});

// ─── Nav item ─────────────────────────────────────────────────────────────────

function NavItem({
  id,
  label,
  icon: Icon,
  active,
  onClick,
}: {
  id: Tab;
  label: string;
  icon: LucideIcon;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.97 }}
      className={`group flex w-full items-center gap-3 rounded-[1rem] px-3 py-2.5 text-sm transition-all ${
        active
          ? "border border-[#d7f209]/20 bg-[#d7f209]/10 text-[#d7f209] shadow-[0_12px_30px_rgba(215,242,9,0.08)]"
          : "border border-transparent text-white/50 hover:border-white/8 hover:bg-white/5 hover:text-white/80"
      }`}
    >
      <span
        className={`flex h-7 w-7 items-center justify-center rounded-lg transition-all ${
          active
            ? "bg-[#d7f209]/15 text-[#d7f209]"
            : "bg-white/5 text-white/40 group-hover:bg-white/8 group-hover:text-white/60"
        }`}
      >
        <Icon className="h-3.5 w-3.5" />
      </span>
      <span className="font-medium">{label}</span>
      {active && (
        <motion.div
          layoutId="nav-pip"
          className="ml-auto h-1.5 w-1.5 rounded-full bg-[#d7f209]"
        />
      )}
    </motion.button>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  i,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  sub: string;
  i: number;
}) {
  return (
    <motion.div {...stagger(i)} className="group relative overflow-hidden rounded-[1.1rem] border border-white/[0.08] bg-white/[0.035] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.18)] transition hover:-translate-y-0.5 hover:border-white/14 hover:bg-white/[0.05]">
      <div className="flex items-start justify-between">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/50">
          <Icon className="h-4 w-4" />
        </span>
        <span className="text-2xl font-semibold tracking-tight text-white">{value}</span>
      </div>
      <p className="mt-4 text-[11px] font-medium uppercase tracking-widest text-white/30">{label}</p>
      <p className="mt-1 text-xs leading-5 text-white/45">{sub}</p>
    </motion.div>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[1.4rem] border border-white/[0.08] bg-white/[0.03] p-5 shadow-[0_18px_55px_rgba(0,0,0,0.18)] sm:p-6">
      <div className="border-b border-white/[0.06] pb-4">
        <h2 className="font-heading text-lg font-semibold tracking-tight text-white">{title}</h2>
        {description && <p className="mt-1 text-sm text-white/45">{description}</p>}
      </div>
      <div className="mt-5">{children}</div>
    </div>
  );
}

// ─── Field row ────────────────────────────────────────────────────────────────

function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-[1rem] border border-white/[0.06] bg-black/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-xs font-medium uppercase tracking-widest text-white/30">{label}</span>
      <span className="text-sm text-white/75">{value}</span>
    </div>
  );
}

// ─── Placeholder section ──────────────────────────────────────────────────────

function ComingSoon({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/10 py-16 text-center">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-white/20">
        <Settings2 className="h-5 w-5" />
      </span>
      <p className="text-sm text-white/35">{label}</p>
    </div>
  );
}

// ─── Tab views ────────────────────────────────────────────────────────────────

function TabPerfil({ account }: { account: DashboardAccount }) {
  return (
    <motion.div {...fadeUp} className="space-y-8">
      {/* Stats row */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={BarChart3} label="Prompts corridos" value={account.totalPromptRuns} sub="Ejecuciones totales registradas." i={0} />
        <StatCard icon={Sparkles} label="Agentes activos" value={account.activeAgentCount} sub="Disponibles en tu dashboard." i={1} />
        <StatCard icon={LockKeyhole} label="Privados" value={`${account.privateAgentCount}/${account.premiumAgentLimit}`} sub="Uso de capacidad MIUNIX+." i={2} />
        <StatCard icon={Crown} label="Compras" value={account.purchasedAgentCount + account.purchasedWorkflowCount} sub="Agentes y workflows activos." i={3} />
      </div>

      <Section title="Información de perfil" description="Datos de identificación de tu cuenta.">
        <div className="space-y-2">
          <FieldRow label="Nombre" value={account.profileName} />
          <FieldRow label="Correo" value={account.email ?? "Sin correo"} />
          <FieldRow label="Rol" value={account.role.charAt(0).toUpperCase() + account.role.slice(1)} />
        </div>
      </Section>
    </motion.div>
  );
}

function TabAgentes({
  purchasedAgents,
  account,
}: {
  purchasedAgents: AccountPanelProps["purchasedAgents"];
  account: DashboardAccount;
}) {
  return (
    <motion.div {...fadeUp} className="space-y-8">
      {/* MIUNIX+ card */}
      <div className="relative overflow-hidden rounded-2xl border border-[#d7f209]/15 bg-[linear-gradient(135deg,rgba(215,242,9,0.06),rgba(9,9,11,0)_60%)] p-6">
        <div className="pointer-events-none absolute right-0 top-0 h-32 w-32 rounded-full bg-[#d7f209]/8 blur-3xl" />
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#d7f209]/20 bg-[#d7f209]/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-widest text-[#d7f209]">
              <Crown className="h-3 w-3" /> MIUNIX+
            </span>
            <h3 className="mt-3 font-heading text-xl font-semibold tracking-tight text-white">
              {account.isPremium ? account.premiumPlanName ?? "Plan activo" : "Sin plan activo"}
            </h3>
            <p className="mt-1.5 max-w-md text-sm leading-6 text-white/50">
              {account.isPremium
                ? `Activo desde ${formatDate(account.premiumSince)}. Tus agentes privados aparecen en el dashboard mientras el plan esté activo.`
                : "Activa MIUNIX+ para crear y ejecutar agentes privados desde tu dashboard."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={account.isPremium ? "/miunix-plus-center" : "/miunix-plus"}
              className="inline-flex items-center gap-2 rounded-xl bg-[#d7f209] px-4 py-2 text-xs font-semibold text-black transition hover:bg-[#e4ff33]"
            >
              {account.isPremium ? "Administrar agentes" : "Ver planes"}
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
            {account.isPremium && (
              <form action={unsubscribeMiunixPlusAction}>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-2 text-xs text-red-200 transition hover:bg-red-500/18"
                >
                  <BadgeX className="h-3.5 w-3.5" />
                  Cancelar plan
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Purchased agents */}
      <Section title="Agentes comprados" description="Agentes del marketplace activos en tu cuenta.">
        {purchasedAgents.length > 0 ? (
          <div className="space-y-2">
            {purchasedAgents.map((agent, i) => (
              <motion.div
                key={agent.id}
                {...stagger(i)}
                className="flex items-center justify-between gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 transition hover:bg-white/[0.04]"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#858BE3]/20 bg-[#858BE3]/10 text-[#858BE3]">
                    <Bot className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white/85">{agent.name}</p>
                    <p className="truncate text-xs text-white/35">{agent.slug}</p>
                  </div>
                </div>
                <form action={unsubscribePurchasedAgentAction}>
                  <input type="hidden" name="agentId" value={agent.id} />
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-400/18 bg-red-500/8 px-3 py-1.5 text-xs text-red-200 transition hover:bg-red-500/14"
                  >
                    <BadgeX className="h-3 w-3" />
                    Desuscribir
                  </button>
                </form>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/10 py-12 text-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-white/20">
              <Bot className="h-5 w-5" />
            </span>
            <p className="text-sm text-white/35">No tienes agentes comprados activos.</p>
            <Link
              href="/marketplace"
              className="mt-1 inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/55 transition hover:bg-white/8 hover:text-white/80"
            >
              Explorar marketplace <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}
      </Section>
    </motion.div>
  );
}

function TabFacturacion({ account }: { account: DashboardAccount }) {
  return (
    <motion.div {...fadeUp} className="space-y-8">
      <Section title="Facturación" description="Resumen de tu plan y estado de suscripción.">
        <div className="space-y-2">
          <FieldRow label="Plan actual" value={account.isPremium ? account.premiumPlanName ?? "MIUNIX+" : "Gratuito"} />
          <FieldRow label="Estado" value={account.isPremium ? "Activo" : "Inactivo"} />
          <FieldRow label="Miembro desde" value={formatDate(account.premiumSince)} />
        </div>
        <div className="pt-2">
          <Link
            href="/miunix-plus"
            className="inline-flex items-center gap-2 rounded-xl border border-[#d7f209]/20 bg-[#d7f209]/8 px-5 py-2.5 text-sm font-semibold text-[#d7f209] transition hover:bg-[#d7f209]/14"
          >
            <CreditCard className="h-4 w-4" />
            {account.isPremium ? "Gestionar suscripción" : "Activar MIUNIX+"}
          </Link>
        </div>
      </Section>
    </motion.div>
  );
}

function TabSeguridad() {
  return (
    <motion.div {...fadeUp} className="space-y-8">
      <Section title="Seguridad" description="Controla el acceso y la autenticación de tu cuenta.">
        <ComingSoon label="Opciones de seguridad disponibles próximamente." />
      </Section>
    </motion.div>
  );
}

function TabPreferencias() {
  return (
    <motion.div {...fadeUp} className="space-y-8">
      <Section title="Preferencias" description="Personaliza tu experiencia en Miunix.">
        <ComingSoon label="Preferencias disponibles próximamente." />
      </Section>
    </motion.div>
  );
}

// ─── NAV CONFIG ───────────────────────────────────────────────────────────────

const NAV: { id: Tab; label: string; icon: LucideIcon }[] = [
  { id: "perfil",       label: "Perfil",        icon: User },
  { id: "agentes",      label: "Mis Agentes",   icon: Bot },
  { id: "facturacion",  label: "Facturación",   icon: CreditCard },
  { id: "seguridad",    label: "Seguridad",     icon: KeyRound },
  { id: "preferencias", label: "Preferencias",  icon: Settings2 },
];

// ─── Main panel ───────────────────────────────────────────────────────────────

export function AccountPanel({ account, purchasedAgents, flashMessage, flashType }: AccountPanelProps) {
  const [tab, setTab] = useState<Tab>("perfil");

  const initials = account.profileName
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <div className="flex w-full flex-col gap-6 py-8 sm:py-10">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="overflow-hidden rounded-[1.8rem] border border-white/10 bg-[linear-gradient(120deg,#d9ff00_0%,#dff0ab_34%,#8f90ff_100%)] p-5 text-black shadow-[0_22px_70px_rgba(0,0,0,0.28)] sm:p-7"
      >
        <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-black/55">
          Mi Cuenta
            </p>
            <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end">
              <div className="flex size-16 shrink-0 items-center justify-center rounded-[1.2rem] border border-black/10 bg-black/12 text-xl font-bold text-black shadow-[0_18px_40px_rgba(0,0,0,0.14)]">
                {initials}
              </div>
              <div className="min-w-0">
        <h1 className="font-heading text-4xl font-semibold leading-none tracking-normal text-black sm:text-5xl">
          {account.profileName}
        </h1>
        <p className="mt-3 flex flex-wrap items-center gap-2 text-sm text-black/62">
          {account.email ?? "Sin correo"} · <span className="capitalize">{account.role}</span>
        </p>
              </div>
            </div>
          </div>

          <div className="rounded-[1.2rem] border border-black/10 bg-black/8 p-4 backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/50">
              Estado
            </p>
            <p className="mt-2 font-heading text-2xl font-semibold tracking-normal text-black">
              {account.isPremium ? account.premiumPlanName ?? "MIUNIX+" : "Plan gratuito"}
            </p>
            <p className="mt-2 text-sm leading-6 text-black/64">
              {account.isPremium
                ? `${account.privateAgentCount}/${account.premiumAgentLimit} agentes privados activos.`
                : "Activa MIUNIX+ para desbloquear agentes privados y mayor capacidad."}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Flash message */}
      <AnimatePresence>
        {flashMessage && (
          <motion.div
            key="flash"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`rounded-[1rem] border px-4 py-3 text-sm ${
              flashType === "error"
                ? "border-red-400/20 bg-red-500/10 text-red-200"
                : "border-[#d7f209]/20 bg-[#d7f209]/8 text-[#efffa8]"
            }`}
          >
            {flashMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Body: sidebar + content */}
      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[16rem_1fr] lg:gap-8">
        {/* ── Sidebar ── */}
        <motion.aside
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          className="hidden lg:block"
        >
          {/* Avatar card */}
          <div className="mb-4 flex items-center gap-3 rounded-[1.2rem] border border-white/[0.08] bg-white/[0.035] px-3.5 py-3 shadow-[0_18px_48px_rgba(0,0,0,0.16)]">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#d7f209] text-sm font-bold text-black shadow-lg shadow-[#d7f209]/16">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold text-white/85">{account.profileName}</p>
              {account.isPremium && (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#d7f209]/70">
                  <Crown className="h-2.5 w-2.5" /> MIUNIX+
                </span>
              )}
            </div>
          </div>

          {/* Nav */}
          <nav className="space-y-1 rounded-[1.3rem] border border-white/[0.08] bg-white/[0.03] p-2">
            {NAV.map((item) => (
              <NavItem
                key={item.id}
                {...item}
                active={tab === item.id}
                onClick={() => setTab(item.id)}
              />
            ))}
          </nav>

          {/* Bottom link */}
          <div className="mt-4 rounded-[1.2rem] border border-white/[0.08] bg-white/[0.025] p-2">
            <Link
              href="/marketplace"
              className="flex items-center gap-2.5 rounded-[1rem] px-3 py-2.5 text-sm text-white/45 transition hover:bg-white/5 hover:text-white/75"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Marketplace
            </Link>
          </div>
        </motion.aside>

        {/* ── Mobile tab bar ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="flex gap-1 overflow-x-auto rounded-[1.2rem] border border-white/[0.08] bg-white/[0.035] p-1 lg:hidden"
        >
          {NAV.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`flex shrink-0 items-center gap-2 rounded-[0.95rem] px-3 py-2 text-xs font-medium transition ${
                tab === item.id
                  ? "bg-[#d7f209]/10 text-[#d7f209]"
                  : "text-white/40 hover:text-white/70"
              }`}
            >
              <item.icon className="h-3.5 w-3.5" />
              {item.label}
            </button>
          ))}
        </motion.div>

        {/* ── Main content ── */}
        <motion.main
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
          className="min-w-0"
        >
          <AnimatePresence mode="wait" initial={false}>
            {tab === "perfil" && <TabPerfil key="perfil" account={account} />}
            {tab === "agentes" && <TabAgentes key="agentes" purchasedAgents={purchasedAgents} account={account} />}
            {tab === "facturacion" && <TabFacturacion key="facturacion" account={account} />}
            {tab === "seguridad" && <TabSeguridad key="seguridad" />}
            {tab === "preferencias" && <TabPreferencias key="preferencias" />}
          </AnimatePresence>
        </motion.main>
      </div>
    </div>
  );
}
