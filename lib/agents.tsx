import type { ReactNode } from "react";

export type AgentBenefit = {
  icon: string;
  title: string;
  description: string;
};

export type AgentEntry = {
  slug: string;
  title: string;
  shortDescription: string;
  heroDescription: string;
  priceLabel: string;
  conversationsLabel: string;
  icon: ReactNode;
  benefits: AgentBenefit[];
};

export const featuredAgents: AgentEntry[] = [
  {
    slug: "lead-generation",
    title: "Lead Generation",
    shortDescription:
      "Encuentra prospectos, pain points y angulos de outreach listos para activar desde el primer mensaje.",
    heroDescription:
      "Convierte una idea de negocio o un nicho en una lista clara de oportunidades comerciales con audiencias, dolores, ganchos y siguientes pasos.",
    priceLabel: "Acceso inmediato gratis",
    conversationsLabel: "Ideal para ventas y growth",
    icon: (
      <div className="relative h-10 w-10">
        <div className="absolute left-0 top-1 h-8 w-4 bg-[linear-gradient(180deg,#3bc7dd,#173580)]" />
        <div className="absolute left-4 top-3 h-5 w-5 border border-white/60 bg-transparent" />
        <div className="absolute left-1 top-5 h-2 w-8 bg-[linear-gradient(90deg,#072b30,#6ee0bf)]" />
      </div>
    ),
    benefits: [
      {
        icon: "◎",
        title: "Prospectos mas claros desde el inicio.",
        description:
          "Aterriza perfiles de cliente, segmentos y criterios de priorizacion para no salir a vender a ciegas.",
      },
      {
        icon: "↗",
        title: "Mensajes con mejor enfoque.",
        description:
          "Propone pain points, promesas y hooks de outreach alineados al tipo de negocio que quieres atacar.",
      },
      {
        icon: "□",
        title: "Siguientes pasos accionables.",
        description:
          "Entrega ideas concretas de investigacion, contacto o seguimiento para convertir el analisis en pipeline.",
      },
    ],
  },
  {
    slug: "marketing-content",
    title: "Marketing Content",
    shortDescription:
      "Genera copys, conceptos y piezas base para lanzar contenido y campanas mas rapido.",
    heroDescription:
      "Pasa de un brief corto a una propuesta de contenido con mensajes, angulos y variaciones listas para iterar con tu equipo.",
    priceLabel: "Acceso inmediato gratis",
    conversationsLabel: "Ideal para marketing y contenido",
    icon: (
      <div className="relative h-10 w-10">
        <div className="absolute inset-x-1 top-1 h-4 rotate-[1deg] bg-[linear-gradient(180deg,#f3dd8c,#689a84)] [clip-path:polygon(50%_0%,100%_52%,50%_100%,0%_52%)]" />
        <div className="absolute inset-x-1 top-4 h-4 bg-[linear-gradient(180deg,#24494b,#7dd5b2)] [clip-path:polygon(50%_0%,100%_52%,50%_100%,0%_52%)] opacity-90" />
        <div className="absolute inset-x-2 top-7 h-2 border border-white/50 [clip-path:polygon(50%_0%,100%_52%,50%_100%,0%_52%)]" />
      </div>
    ),
    benefits: [
      {
        icon: "✎",
        title: "Copy inicial en minutos.",
        description:
          "Te da una base para anuncios, emails o redes sin esperar una ronda completa de brainstorming.",
      },
      {
        icon: "◉",
        title: "Variaciones para probar rapido.",
        description:
          "Produce diferentes enfoques de mensaje para testear sin rehacer el brief desde cero.",
      },
      {
        icon: "▣",
        title: "Mayor consistencia de marca.",
        description:
          "Ayuda a mantener tono y enfoque cuando varias personas del equipo crean contenido.",
      },
    ],
  },
  {
    slug: "research",
    title: "Research",
    shortDescription:
      "Resume un tema, competidores o tendencias en una salida accionable para tomar decisiones mas rapido.",
    heroDescription:
      "Transforma preguntas abiertas en un resumen util con hallazgos, contexto y recomendaciones para negocio, producto o marketing.",
    priceLabel: "Acceso inmediato gratis",
    conversationsLabel: "Ideal para estrategia y analisis",
    icon: (
      <div className="relative h-10 w-10">
        <div className="absolute left-2 top-0 h-6 w-6 rotate-45 border border-white/80" />
        <div className="absolute bottom-1 left-0 h-4 w-5 bg-[#f04e37]" />
        <div className="absolute bottom-1 right-0 h-4 w-5 bg-[linear-gradient(90deg,#0f6d63,#1fd7bd)]" />
      </div>
    ),
    benefits: [
      {
        icon: "◇",
        title: "Panorama mas rapido.",
        description:
          "Organiza informacion dispersa para que puedas entender un tema o mercado con menos friccion.",
      },
      {
        icon: "↺",
        title: "Hallazgos listos para compartir.",
        description:
          "Devuelve una salida mas estructurada para usarla en reuniones, decisiones o documentos internos.",
      },
      {
        icon: "▢",
        title: "Menos tiempo en tareas repetitivas.",
        description:
          "Reduce el trabajo manual cuando necesitas investigar varios temas o competidores seguidos.",
      },
    ],
  },
];

export function getAgentBySlug(slug: string) {
  return featuredAgents.find((agent) => agent.slug === slug);
}
