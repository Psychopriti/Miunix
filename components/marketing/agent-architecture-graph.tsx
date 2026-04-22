import {
  ArrowRight,
  Bot,
  BrainCircuit,
  Database,
  FileText,
  Image,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Wrench,
} from "lucide-react";

import type { Json } from "@/types/database";

type ArchitectureTool = {
  name: string;
  description: string;
  kind: "research" | "content" | "image" | "document" | "data" | "api";
};

type AgentArchitectureGraphProps = {
  agentSlug: string;
  agentName: string;
  ownerType?: "platform" | "developer" | "user";
  toolDefinitions?: Json;
  compact?: boolean;
};

const nativeToolsBySlug: Record<string, ArchitectureTool[]> = {
  "lead-generation": [
    {
      name: "Company Search",
      description: "Busca prospectos reales y fuentes publicas.",
      kind: "research",
    },
    {
      name: "Lead Scorer",
      description: "Prioriza empresas por fit, urgencia y senales.",
      kind: "data",
    },
    {
      name: "Outreach Planner",
      description: "Convierte insights en mensajes por canal.",
      kind: "content",
    },
  ],
  "marketing-content": [
    {
      name: "Campaign Angles",
      description: "Define promesa, proof y objeciones.",
      kind: "content",
    },
    {
      name: "Image Creator",
      description: "Prepara prompts visuales para piezas de campana.",
      kind: "image",
    },
    {
      name: "Evidence Tools",
      description: "Inspecciona paginas, competidores y copy real.",
      kind: "research",
    },
  ],
  research: [
    {
      name: "Research Frames",
      description: "Elige criterio, alcance y preguntas clave.",
      kind: "research",
    },
    {
      name: "Decision Matrix",
      description: "Compara opciones y tradeoffs.",
      kind: "data",
    },
    {
      name: "Doc Builder",
      description: "Estructura entregables tipo memo o brief.",
      kind: "document",
    },
  ],
};

function parseCustomTools(toolDefinitions: Json | undefined): ArchitectureTool[] {
  if (!Array.isArray(toolDefinitions)) {
    return [];
  }

  return toolDefinitions.slice(0, 4).flatMap((toolDefinition) => {
    if (!toolDefinition || typeof toolDefinition !== "object") {
      return [];
    }

    const name =
      "tool_name" in toolDefinition && typeof toolDefinition.tool_name === "string"
        ? toolDefinition.tool_name
        : "Custom Tool";
    const description =
      "description" in toolDefinition &&
      typeof toolDefinition.description === "string"
        ? toolDefinition.description
        : "Tool conectada por el developer.";

    return [
      {
        name,
        description,
        kind: "api" as const,
      },
    ];
  });
}

function getArchitectureTools({
  agentSlug,
  toolDefinitions,
}: Pick<AgentArchitectureGraphProps, "agentSlug" | "toolDefinitions">) {
  const nativeTools = nativeToolsBySlug[agentSlug];

  if (nativeTools) {
    return nativeTools;
  }

  const customTools = parseCustomTools(toolDefinitions);

  if (customTools.length > 0) {
    return customTools;
  }

  return [
    {
      name: "Prompt Core",
      description: "Instrucciones, tono y reglas de decision.",
      kind: "content" as const,
    },
    {
      name: "Model Runtime",
      description: "Generacion con contexto del usuario.",
      kind: "data" as const,
    },
  ];
}

function ToolIcon({ kind }: { kind: ArchitectureTool["kind"] }) {
  if (kind === "image") return <Image className="size-4" />;
  if (kind === "document") return <FileText className="size-4" />;
  if (kind === "research") return <Database className="size-4" />;
  if (kind === "api") return <Wrench className="size-4" />;
  if (kind === "content") return <MessageSquare className="size-4" />;
  return <Sparkles className="size-4" />;
}

export function AgentArchitectureMini({
  agentSlug,
  toolDefinitions,
}: Pick<AgentArchitectureGraphProps, "agentSlug" | "toolDefinitions">) {
  const tools = getArchitectureTools({ agentSlug, toolDefinitions }).slice(0, 3);

  return (
    <div className="flex min-w-0 items-center gap-1.5">
      {tools.map((tool, index) => (
        <span
          key={`${tool.name}-${index}`}
          className="inline-flex max-w-[8.5rem] items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] text-white/55"
          title={`${tool.name}: ${tool.description}`}
        >
          <ToolIcon kind={tool.kind} />
          <span className="truncate">{tool.name}</span>
        </span>
      ))}
    </div>
  );
}

export function AgentArchitectureGraph({
  agentSlug,
  agentName,
  ownerType = "platform",
  toolDefinitions,
  compact = false,
}: AgentArchitectureGraphProps) {
  const tools = getArchitectureTools({ agentSlug, toolDefinitions });
  const runtimeLabel =
    ownerType === "platform"
      ? "LangChain runtime"
      : ownerType === "developer"
        ? "Developer runtime"
        : "Private runtime";

  return (
    <div className="rounded-[1.2rem] border border-white/10 bg-[#0d0f13] p-4 shadow-[0_18px_45px_rgba(0,0,0,0.22)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[0.68rem] uppercase tracking-[0.2em] text-[#d7f205]">
            Arquitectura del agente
          </p>
          <h3 className="mt-2 text-sm font-medium text-white">{agentName}</h3>
        </div>
        <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[0.65rem] uppercase tracking-[0.16em] text-white/48">
          {tools.length} tools
        </div>
      </div>

      <div className={`mt-4 grid gap-3 ${compact ? "" : "md:grid-cols-[0.9fr_1fr]"}`}>
        <div className="rounded-2xl border border-white/8 bg-white/[0.035] p-3">
          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-xl bg-[#d7f205] text-black">
              <Bot className="size-4" />
            </span>
            <div>
              <p className="text-xs font-medium text-white">Input del usuario</p>
              <p className="mt-1 text-[11px] text-white/42">Brief, contexto y objetivo.</p>
            </div>
          </div>

          <div className="my-3 flex items-center gap-2 text-white/25">
            <div className="h-px flex-1 bg-white/10" />
            <ArrowRight className="size-3.5" />
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-xl border border-[#8f90ff]/30 bg-[#8f90ff]/12 text-[#caccff]">
              <BrainCircuit className="size-4" />
            </span>
            <div>
              <p className="text-xs font-medium text-white">{runtimeLabel}</p>
              <p className="mt-1 text-[11px] text-white/42">Prompt, memoria y tool calling.</p>
            </div>
          </div>
        </div>

        <div className="grid gap-2">
          {tools.map((tool, index) => (
            <div
              key={`${tool.name}-${index}`}
              className="flex items-start gap-3 rounded-2xl border border-white/8 bg-white/[0.035] px-3 py-3"
            >
              <span className="flex size-9 flex-shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/20 text-[#d7f205]">
                <ToolIcon kind={tool.kind} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-white">{tool.name}</p>
                <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-white/45">
                  {tool.description}
                </p>
              </div>
              <ShieldCheck className="mt-1 size-3.5 flex-shrink-0 text-emerald-300/70" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
