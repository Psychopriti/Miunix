"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowUpRight,
  ChevronRight,
  Plus,
  Search,
  Send,
  Settings,
  Sparkles,
  User,
} from "lucide-react";

import type {
  DashboardAgent,
  DashboardChatHistory,
  DashboardMessage,
} from "@/lib/dashboard";

type DashboardClientProps = {
  agents: DashboardAgent[];
  initialChatHistory: DashboardChatHistory;
  userEmail?: string | null;
};

const popularTopicsBySlug: Record<string, string[]> = {
  "lead-generation": [
    "Genera leads para una agencia de software B2B en Nicaragua",
    "Analiza prospectos para una consultora de automatizacion",
    "Crea outreach para SaaS enfocado en RRHH",
  ],
  "marketing-content": [
    "Campana de lanzamiento para un nuevo CRM",
    "Secuencia de emails para onboarding",
    "3 copies de anuncios para Meta Ads",
  ],
  research: [
    "Investiga competidores de software logistico",
    "Resume tendencias de IA aplicada a ventas",
    "Analiza oportunidades en fintech regional",
  ],
};

function getAgentIcon(slug: string) {
  switch (slug) {
    case "lead-generation":
      return (
        <div className="relative h-10 w-10">
          <div className="absolute left-0 top-1 h-8 w-4 bg-[linear-gradient(180deg,#3bc7dd,#173580)]" />
          <div className="absolute left-4 top-3 h-5 w-5 border border-white/60 bg-transparent" />
          <div className="absolute left-1 top-5 h-2 w-8 bg-[linear-gradient(90deg,#072b30,#6ee0bf)]" />
        </div>
      );
    case "marketing-content":
      return (
        <div className="relative h-10 w-10">
          <div className="absolute inset-x-1 top-1 h-4 rotate-[1deg] bg-[linear-gradient(180deg,#f3dd8c,#689a84)] [clip-path:polygon(50%_0%,100%_52%,50%_100%,0%_52%)]" />
          <div className="absolute inset-x-1 top-4 h-4 bg-[linear-gradient(180deg,#24494b,#7dd5b2)] [clip-path:polygon(50%_0%,100%_52%,50%_100%,0%_52%)] opacity-90" />
          <div className="absolute inset-x-2 top-7 h-2 border border-white/50 [clip-path:polygon(50%_0%,100%_52%,50%_100%,0%_52%)]" />
        </div>
      );
    case "research":
      return (
        <div className="relative h-10 w-10">
          <div className="absolute left-2 top-0 h-6 w-6 rotate-45 border border-white/80" />
          <div className="absolute bottom-1 left-0 h-4 w-5 bg-[#f04e37]" />
          <div className="absolute bottom-1 right-0 h-4 w-5 bg-[linear-gradient(90deg,#0f6d63,#1fd7bd)]" />
        </div>
      );
    default:
      return (
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-xs font-semibold uppercase text-white/75">
          {slug.slice(0, 2)}
        </div>
      );
  }
}

function AgentIconWrapper({
  slug,
  size = "md",
}: {
  slug: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClasses = {
    sm: "h-9 w-9",
    md: "h-12 w-12",
    lg: "h-16 w-16",
  };

  return (
    <div
      className={`${sizeClasses[size]} flex flex-shrink-0 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br from-[#1a1a3e] to-[#0d1a2e]`}
    >
      <div className="scale-90">{getAgentIcon(slug)}</div>
    </div>
  );
}

function AgentCard({
  agent,
  isSelected,
  onSelect,
}: {
  agent: DashboardAgent;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={isSelected}
      className={[
        "w-full rounded-2xl border p-3 text-left transition-all duration-200",
        "hover:border-purple-500/40 hover:bg-white/3",
        isSelected
          ? "border-purple-500/60 bg-gradient-to-br from-purple-900/20 to-blue-900/15 shadow-[0_0_20px_rgba(139,92,246,0.15)]"
          : "border-white/8 bg-white/2",
      ].join(" ")}
    >
      <div className="flex items-center gap-3">
        <AgentIconWrapper slug={agent.slug} size="sm" />

        <div className="min-w-0 flex-1">
          <p
            className={[
              "truncate text-xs font-medium leading-tight",
              isSelected ? "text-white" : "text-white/80",
            ].join(" ")}
          >
            {agent.name}
          </p>
          <p className="mt-0.5 truncate text-[10px] text-white/40">
            {agent.totalRuns} ejecuciones
          </p>
        </div>

        {isSelected ? (
          <div className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-purple-400" />
        ) : null}
      </div>
    </button>
  );
}

function formatTimestamp(timestamp: string) {
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleTimeString("es-NI", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function MessageBubble({
  message,
  agentSlug,
}: {
  message: DashboardMessage;
  agentSlug: string;
}) {
  const isUser = message.role === "user";
  const isFailed = message.executionStatus === "failed";

  return (
    <div
      className={["flex gap-3", isUser ? "flex-row-reverse" : "flex-row"].join(
        " ",
      )}
    >
      <div className="mt-1 flex-shrink-0">
        {isUser ? (
          <div className="flex h-7 w-7 items-center justify-center rounded-full border border-white/12 bg-white/8">
            <User className="h-3.5 w-3.5 text-white/60" />
          </div>
        ) : (
          <div className="flex h-7 w-7 items-center justify-center rounded-full border border-purple-500/30 bg-gradient-to-br from-purple-900/40 to-blue-900/30">
            <div className="scale-50">{getAgentIcon(agentSlug)}</div>
          </div>
        )}
      </div>

      <div
        className={[
          "max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
          isUser
            ? "rounded-tr-sm border border-purple-500/20 bg-gradient-to-br from-purple-600/25 to-blue-600/20 text-white/90"
            : isFailed
              ? "rounded-tl-sm border border-red-500/20 bg-red-500/10 text-red-50"
              : "rounded-tl-sm border border-white/8 bg-white/5 text-white/80",
        ].join(" ")}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
        <div
          className={[
            "mt-2 flex items-center gap-2 text-[10px]",
            isUser ? "justify-end text-purple-300/50" : "text-white/25",
          ].join(" ")}
        >
          {!isUser && isFailed ? (
            <span className="rounded-full border border-red-500/30 px-1.5 py-0.5 text-[9px] uppercase tracking-[0.16em] text-red-200">
              Fallo
            </span>
          ) : null}
          <span>{formatTimestamp(message.timestamp)}</span>
        </div>
      </div>
    </div>
  );
}

function EmptyState({
  agent,
  onTopicClick,
}: {
  agent: DashboardAgent;
  onTopicClick: (topic: string) => void;
}) {
  const topics = popularTopicsBySlug[agent.slug] ?? [];

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-10 text-center">
      <div className="relative">
        <div className="absolute inset-0 scale-150 rounded-full bg-[#d9ff00]/8 blur-2xl" />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-[#1a1a3e] to-[#0d1a2e]">
          <div className="scale-[1.6]">{getAgentIcon(agent.slug)}</div>
        </div>
      </div>

      <div>
        <Sparkles className="mx-auto mb-3 h-4 w-4 text-[#d9ff00] opacity-70" />
        <h2 className="text-lg font-medium text-[#d9ff00]">{agent.name}</h2>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-white/50">
          {agent.shortDescription}
        </p>
      </div>

      {topics.length > 0 ? (
        <div className="flex flex-col items-center gap-3">
          <p className="text-xs text-white/35">Pruebas sugeridas:</p>
          <div className="flex flex-wrap justify-center gap-2">
            {topics.map((topic) => (
              <button
                key={topic}
                type="button"
                onClick={() => onTopicClick(topic)}
                className="rounded-full border border-white/12 bg-white/4 px-3 py-1.5 text-xs text-white/60 transition hover:border-purple-500/30 hover:bg-white/8 hover:text-white/80"
              >
                {topic}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function DashboardClient({
  agents,
  initialChatHistory,
  userEmail,
}: DashboardClientProps) {
  const [selectedAgentSlug, setSelectedAgentSlug] = useState(agents[0]?.slug ?? "");
  const [chatHistory, setChatHistory] =
    useState<DashboardChatHistory>(initialChatHistory);
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const selectedAgent = agents.find((agent) => agent.slug === selectedAgentSlug);
  const currentMessages = selectedAgent ? chatHistory[selectedAgent.slug] ?? [] : [];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentMessages.length, selectedAgentSlug, isSending]);

  function handleTopicClick(topic: string) {
    setInputValue(topic);
  }

  function handleNewConversation() {
    if (!selectedAgent) {
      return;
    }

    setChatHistory((current) => ({
      ...current,
      [selectedAgent.slug]: [],
    }));
    setErrorMessage(null);
  }

  function handleSelectAgent(slug: string) {
    setSelectedAgentSlug(slug);
    setInputValue("");
    setErrorMessage(null);
  }

  async function handleSend() {
    if (!selectedAgent) {
      return;
    }

    const text = inputValue.trim();

    if (!text || isSending) {
      return;
    }

    const userMessage: DashboardMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };

    setChatHistory((current) => ({
      ...current,
      [selectedAgent.slug]: [...(current[selectedAgent.slug] ?? []), userMessage],
    }));
    setInputValue("");
    setErrorMessage(null);
    setIsSending(true);

    try {
      const response = await fetch("/api/run-agent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          agentId: selectedAgent.id,
          input: text,
        }),
      });

      const payload = (await response.json()) as {
        success: boolean;
        error?: string;
        output?: string;
        execution?: {
          status: "pending" | "completed" | "failed";
          created_at: string;
        };
      };

      if (!response.ok || !payload.success || !payload.output || !payload.execution) {
        throw new Error(payload.error ?? "No se pudo ejecutar el agente.");
      }

      const assistantMessage: DashboardMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: payload.output,
        timestamp: payload.execution.created_at,
        executionStatus: payload.execution.status,
      };

      setChatHistory((current) => ({
        ...current,
        [selectedAgent.slug]: [
          ...(current[selectedAgent.slug] ?? []),
          assistantMessage,
        ],
      }));
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Hubo un problema ejecutando el agente.";

      setErrorMessage(message);

      const failedMessage: DashboardMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `No pude completar la ejecucion.\n\n${message}`,
        timestamp: new Date().toISOString(),
        executionStatus: "failed",
      };

      setChatHistory((current) => ({
        ...current,
        [selectedAgent.slug]: [
          ...(current[selectedAgent.slug] ?? []),
          failedMessage,
        ],
      }));
    } finally {
      setIsSending(false);
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSend();
    }
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#0A0A0A]">
      <DashboardHeader userEmail={userEmail} />

      <div className="flex flex-1 overflow-hidden">
        <aside className="hidden w-[240px] flex-shrink-0 flex-col border-r border-white/6 bg-[#0d0d0d] md:flex">
          {selectedAgent ? (
            <div className="border-b border-white/6 p-4">
              <div className="flex items-center gap-3">
                <AgentIconWrapper slug={selectedAgent.slug} size="md" />
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold leading-tight text-white">
                    {selectedAgent.name}
                  </h2>
                </div>
              </div>
              <p className="mt-3 text-[11px] leading-relaxed text-white/45">
                {selectedAgent.shortDescription}
              </p>
            </div>
          ) : null}

          <div className="flex flex-col gap-2 border-b border-white/6 p-3">
            <button
              type="button"
              onClick={handleNewConversation}
              className="flex items-center gap-2.5 rounded-xl border border-white/8 bg-white/4 px-3 py-2.5 text-xs text-white/70 transition hover:bg-white/8 hover:text-white"
            >
              <Plus className="h-3.5 w-3.5" />
              Nueva Conversacion
            </button>

            <button
              type="button"
              className="flex items-center gap-2.5 rounded-xl border border-white/8 bg-white/4 px-3 py-2.5 text-xs text-white/50"
            >
              <Search className="h-3.5 w-3.5" />
              Historial cargado
            </button>
          </div>

          <div className="flex flex-1 flex-col overflow-y-auto p-3">
            <p className="mb-2 px-1 text-[10px] uppercase tracking-[0.18em] text-white/30">
              Mis Agentes
            </p>
            <div className="flex flex-col gap-1.5">
              {agents.map((agent) => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  isSelected={selectedAgentSlug === agent.slug}
                  onSelect={() => handleSelectAgent(agent.slug)}
                />
              ))}
            </div>
          </div>

          <div className="border-t border-white/6 p-3">
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/8 bg-white/4 text-white/40 transition hover:bg-white/8 hover:text-white/70"
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </aside>

        <main className="flex flex-1 flex-col overflow-hidden">
          {selectedAgent ? (
            <div className="flex items-center justify-between gap-3 border-b border-white/6 px-5 py-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 rounded-full border border-white/12 bg-white/4 px-3 py-1.5">
                  <div className="scale-75">{getAgentIcon(selectedAgent.slug)}</div>
                  <span className="text-xs text-white/70">Agente activo</span>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-white/20" />
                <span className="text-sm font-medium text-white/80">
                  {selectedAgent.name}
                </span>
              </div>
              <span className="text-xs text-white/35">
                {currentMessages.length} mensajes
              </span>
            </div>
          ) : null}

          {errorMessage ? (
            <div className="border-b border-red-500/15 bg-red-500/8 px-5 py-3 text-sm text-red-100">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                <span>{errorMessage}</span>
              </div>
            </div>
          ) : null}

          <div className="relative flex-1 overflow-y-auto">
            <div
              className="pointer-events-none absolute bottom-0 right-[10%] h-[45%] w-[35%] rounded-full opacity-30"
              style={{
                background:
                  "radial-gradient(circle, rgba(163,230,53,0.18) 0%, transparent 70%)",
              }}
            />

            {selectedAgent && currentMessages.length === 0 ? (
              <EmptyState agent={selectedAgent} onTopicClick={handleTopicClick} />
            ) : (
              <div className="flex flex-col gap-4 px-5 py-6">
                {selectedAgent
                  ? currentMessages.map((message) => (
                      <MessageBubble
                        key={message.id}
                        message={message}
                        agentSlug={selectedAgent.slug}
                      />
                    ))
                  : null}

                {isSending && selectedAgent ? (
                  <div className="flex gap-3">
                    <div className="mt-1 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-purple-500/30 bg-gradient-to-br from-purple-900/40 to-blue-900/30">
                      <div className="scale-50">{getAgentIcon(selectedAgent.slug)}</div>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm border border-white/8 bg-white/5 px-4 py-3">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/40 [animation-delay:0ms]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/40 [animation-delay:150ms]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/40 [animation-delay:300ms]" />
                    </div>
                  </div>
                ) : null}

                <div ref={chatEndRef} />
              </div>
            )}
          </div>

          <div className="border-t border-white/6 p-4">
            <div className="relative flex items-end gap-3 rounded-2xl border border-white/12 bg-[#141414] px-4 py-3 transition focus-within:border-white/20 focus-within:bg-[#161616]">
              <textarea
                id="agent-input"
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  selectedAgent
                    ? `Describe la tarea para ${selectedAgent.name}...`
                    : "No hay agentes disponibles"
                }
                disabled={!selectedAgent || isSending}
                rows={1}
                className="flex-1 resize-none bg-transparent text-sm text-white/80 placeholder:text-white/25 focus:outline-none disabled:cursor-not-allowed disabled:opacity-40"
                style={{ maxHeight: "120px" }}
                onInput={(event) => {
                  const target = event.target as HTMLTextAreaElement;
                  target.style.height = "auto";
                  target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
                }}
              />

              <button
                type="button"
                onClick={() => void handleSend()}
                disabled={!inputValue.trim() || isSending || !selectedAgent}
                className={[
                  "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl transition-all duration-150",
                  inputValue.trim() && !isSending && selectedAgent
                    ? "bg-[#d9ff00] text-[#0A0A0A] shadow-[0_0_12px_rgba(217,255,0,0.3)] hover:bg-[#e8ff33]"
                    : "cursor-not-allowed bg-white/6 text-white/25",
                ].join(" ")}
                aria-label="Enviar mensaje"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>

            <p className="mt-2 text-center text-[10px] text-white/20">
              Enter para enviar · Shift + Enter para nueva linea
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}

const navLinks = [
  { label: "Inicio", href: "/" },
  { label: "Marketplace", href: "/marketplace" },
  { label: "Planes", href: "#" },
  { label: "Developers", href: "#" },
];

function DashboardHeader({ userEmail }: { userEmail?: string | null }) {
  return (
    <header className="flex items-center justify-between border-b border-white/6 bg-[#0A0A0A] px-5 py-3">
      <Link
        href="/"
        className="font-heading text-xl uppercase tracking-tight text-[#D7F205]"
      >
        Agent Flow
      </Link>

      <nav className="hidden items-center gap-1 rounded-full border border-white/10 bg-white/4 px-2 py-1.5 backdrop-blur md:flex">
        {navLinks.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="rounded-full px-3 py-1 text-xs text-white/65 transition hover:bg-white/8 hover:text-white"
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/4 py-1.5 pl-2 pr-3 text-xs text-white/65">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-blue-600">
            <User className="h-3 w-3 text-white" />
          </div>
          <span className="hidden max-w-[120px] truncate sm:block">
            {userEmail ? userEmail.split("@")[0] : "Mi Perfil"}
          </span>
          <ArrowUpRight className="h-3 w-3 opacity-50" />
        </div>
      </div>
    </header>
  );
}
