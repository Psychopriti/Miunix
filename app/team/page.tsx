import type { Metadata } from "next";
import {
  BadgeDollarSign,
  Bot,
  BriefcaseBusiness,
  Code2,
  Megaphone,
  Network,
  Palette,
  ServerCog,
} from "lucide-react";

import { MarketingPageShell } from "@/components/marketing/marketing-page-shell";

export const metadata: Metadata = {
  title: "Team | Miunix",
  description: "El equipo tecnico y de negocio detras de Miunix.",
};

const technicalTeam = [
  {
    name: "ALEJANDRO MELENDEZ",
    role: "Product Designer & Frontend Designer",
    icon: Palette,
    color: "#d7f209",
    initials: "AX",
    description:
      "Responsable del diseno y desarrollo de la interfaz completa: marketplace, dashboard, paginas de agentes, autenticacion visual y landing page con Next.js, Tailwind CSS y shadcn/ui.",
    focus: ["UX responsive", "Marketplace", "Dashboard", "Landing"],
  },
  {
    name: "JORGE LUNA",
    role: "Frontend UX Lead",
    icon: ServerCog,
    color: "#8f90ff",
    initials: "JL",
    description:
      "Encargado de arquitectura backend, APIs, persistencia, endpoints de usuarios, ejecucion de agentes, historial de tareas e infraestructura de hosting estable y escalable.",
    focus: ["APIs", "PostgreSQL", "Infraestructura", "Escalabilidad"],
  },
  {
    name: "JUAN MARENCO",
    role: "Backend & AI Systems Lead",
    icon: Bot,
    color: "#3be1c5",
    initials: "JM",
    description:
      "Lider del nucleo de inteligencia artificial: agentes nativos, prompts avanzados, LangChain, OpenAI, herramientas, ejecucion y refinamiento de resultados utiles en escenarios reales.",
    focus: ["AI Agents", "LangChain", "Prompts", "Tools"],
  },
];

const businessTeam = [
  {
    name: "KAMILA CARRANZA",
    role: "Product Manager & Business Strategy Lead",
    icon: BriefcaseBusiness,
    color: "#ffcf6b",
    initials: "KC",
    description:
      "Responsable de vision estrategica, propuesta de valor, buyer personas, user stories, modelo de negocio, roadmap y alineacion entre necesidades del mercado y requisitos accionables.",
    focus: ["Producto", "Roadmap", "Go-to-market", "Buyer personas"],
  },
  {
    name: "CECILIA CANO",
    role: "Marketing & Brand Lead",
    icon: Megaphone,
    color: "#ff7ab6",
    initials: "CC",
    description:
      "Responsable de posicionamiento, identidad de marca, copywriting, pitch deck, video demo, canales de adquisicion y narrativa persuasiva para presentaciones e inversores.",
    focus: ["Branding", "Copywriting", "Pitch deck", "Demo"],
  },
  {
    name: "JOSUE CALERO",
    role: "Finance & Monetization Lead",
    icon: BadgeDollarSign,
    color: "#7ff18a",
    initials: "JC",
    description:
      "Encargado del modelo financiero, proyecciones, costos de API y hosting, margenes, precios, comision marketplace, TAM/SAM/SOM, punto de equilibrio y viabilidad economica.",
    focus: ["Finanzas", "Pricing", "Unit economics", "TAM/SAM/SOM"],
  },
  {
    name: "MAXHA CABRALES",
    role: "Business Development & Market Validation Lead",
    icon: Network,
    color: "#6bc8ff",
    initials: "MX",
    description:
      "Responsable de validacion de mercado, entrevistas, casos de uso por agente, concepto de Developer Portal, analisis competitivo, diferenciadores, demos y alianzas iniciales.",
    focus: ["Validacion", "Alianzas", "Developer Portal", "Ventas"],
  },
];

function TeamAvatar({
  initials,
  color,
  name,
}: {
  initials: string;
  color: string;
  name: string;
}) {
  return (
    <div className="relative flex size-16 flex-shrink-0 items-center justify-center">
      <div
        className="absolute inset-0 animate-pulse rounded-2xl opacity-25 blur-xl"
        style={{ backgroundColor: color }}
      />
      <div
        className="absolute inset-0 rounded-2xl border border-white/10 bg-white/[0.04]"
        style={{
          boxShadow: `0 0 24px ${color}33`,
        }}
      />
      <div className="relative flex size-12 animate-[teamFloat_4s_ease-in-out_infinite] items-center justify-center rounded-2xl border border-white/14 bg-[#101116]">
        <span className="font-heading text-sm font-semibold text-white">{initials}</span>
        <span
          className="absolute -right-1 -top-1 size-3 rounded-full"
          style={{ backgroundColor: color }}
          aria-hidden="true"
        />
      </div>
      <span className="sr-only">{name}</span>
    </div>
  );
}

function TeamCard({
  member,
}: {
  member: (typeof technicalTeam)[number] | (typeof businessTeam)[number];
}) {
  const Icon = member.icon;

  return (
    <article className="group flex h-full flex-col rounded-[0.8rem] border border-white/10 bg-white/[0.035] p-5 shadow-[0_18px_55px_rgba(0,0,0,0.24)] transition duration-300 hover:-translate-y-1 hover:border-white/18 hover:bg-white/[0.055]">
      <div className="flex items-start gap-4">
        <TeamAvatar initials={member.initials} color={member.color} name={member.name} />
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.2em] text-white/36">
            {member.role}
          </p>
          <h3 className="mt-2 font-heading text-2xl font-semibold tracking-[-0.04em] text-white">
            {member.name}
          </h3>
        </div>
      </div>

      <p className="mt-5 flex-1 text-sm leading-7 text-white/62">
        {member.description}
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        {member.focus.map((item) => (
          <span
            key={item}
            className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[0.68rem] text-white/55"
          >
            {item}
          </span>
        ))}
      </div>

      <div className="mt-5 flex items-center gap-2 text-xs text-white/42">
        <span
          className="flex size-8 items-center justify-center rounded-xl border border-white/10 bg-black/20"
          style={{ color: member.color }}
        >
          <Icon className="size-4" />
        </span>
        <span>Construyendo Miunix desde su especialidad.</span>
      </div>
    </article>
  );
}

function TeamSection({
  label,
  title,
  description,
  members,
}: {
  label: string;
  title: string;
  description: string;
  members: typeof technicalTeam | typeof businessTeam;
}) {
  return (
    <section className="py-10">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-[#d7f209]">
            {label}
          </p>
          <h2 className="mt-3 max-w-2xl font-heading text-3xl font-semibold tracking-[-0.05em] text-white sm:text-4xl">
            {title}
          </h2>
        </div>
        <p className="max-w-xl text-sm leading-7 text-white/55">{description}</p>
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-3">
        {members.map((member) => (
          <TeamCard key={member.name} member={member} />
        ))}
      </div>
    </section>
  );
}

export default function TeamPage() {
  return (
    <MarketingPageShell currentPath="/team">
      <style>
        {`
          @keyframes teamFloat {
            0%, 100% { transform: translateY(0) rotate(-2deg); }
            50% { transform: translateY(-5px) rotate(2deg); }
          }
        `}
      </style>

      <section className="pb-8 pt-14 sm:pt-20">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-[#d7f209]">
              Team Miunix
            </p>
            <h1 className="mt-5 max-w-4xl font-heading text-[3.5rem] font-semibold leading-[0.9] tracking-[-0.075em] text-white sm:text-[5.6rem]">
              El equipo detras de los agentes.
            </h1>
          </div>

          <div className="rounded-[1rem] border border-white/10 bg-white/[0.04] p-5">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-[#d7f209] text-black">
                <Code2 className="size-5" />
              </span>
              <p className="font-heading text-xl font-semibold tracking-[-0.04em] text-white">
                Producto, IA y negocio trabajando como un solo sistema.
              </p>
            </div>
            <p className="mt-4 text-sm leading-7 text-white/60">
              Miunix combina ejecucion tecnica, inteligencia artificial aplicada,
              estrategia comercial, marca, finanzas y validacion de mercado para
              construir una plataforma de agentes accesible para LATAM.
            </p>
          </div>
        </div>
      </section>

      <TeamSection
        label="Equipo tecnico"
        title="Quienes construyen la experiencia y la inteligencia."
        description="El grupo que convierte la vision en producto: interfaz, infraestructura y agentes capaces de ejecutar tareas reales."
        members={technicalTeam}
      />

      <TeamSection
        label="Equipo de negocio"
        title="Quienes convierten el producto en una empresa viable."
        description="El grupo que define mercado, narrativa, monetizacion, validacion y expansion para que Miunix tenga direccion comercial."
        members={businessTeam}
      />
    </MarketingPageShell>
  );
}
