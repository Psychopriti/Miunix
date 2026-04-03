"use client";

/**
 * DashboardClient — componente interactivo del dashboard principal.
 *
 * Maneja:
 *  - Selección del agente activo desde la sidebar
 *  - Historial de mensajes (chat) por agente
 *  - Input de instrucciones con envío al agente
 *  - Estado de carga mientras el agente responde
 */

import { useState, useRef, useEffect, useTransition } from "react";
import Link from "next/link";
import {
  Search,
  Plus,
  Settings,
  Send,
  Sparkles,
  ChevronRight,
  User,
  ArrowUpRight,
} from "lucide-react";
import type { AgentEntry } from "@/lib/agents";

/* ─────────────────────────────────────────────────────────────────────────────
   Tipos
───────────────────────────────────────────────────────────────────────────── */

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};

type ChatHistory = Record<string, Message[]>;

type DashboardClientProps = {
  agents: AgentEntry[];
  userEmail?: string | null;
};

/* ─────────────────────────────────────────────────────────────────────────────
   Temas populares de ejemplo por agente
───────────────────────────────────────────────────────────────────────────── */

const popularTopicsBySlug: Record<string, string[]> = {
  "investigador-industria": [
    "hubspot.com",
    "openai.com",
    "amazon.com",
    "anthropic.com",
    "notion.so",
  ],
  "content-creation": [
    "Instagram Reels",
    "Email marketing",
    "LinkedIn B2B",
    "TikTok ads",
    "Google Ads",
  ],
  "investigador-tendencias": [
    "IA generativa",
    "SaaS 2025",
    "E-commerce",
    "Fintech",
    "Web3",
  ],
};

/* ─────────────────────────────────────────────────────────────────────────────
   Componente auxiliar: Icono del agente con fondo degradado
───────────────────────────────────────────────────────────────────────────── */

function AgentIconWrapper({
  icon,
  size = "md",
}: {
  icon: React.ReactNode;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClasses = {
    sm: "w-9 h-9",
    md: "w-12 h-12",
    lg: "w-16 h-16",
  };

  return (
    <div
      className={`${sizeClasses[size]} flex items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br from-[#1a1a3e] to-[#0d1a2e] flex-shrink-0`}
    >
      <div className="scale-90">{icon}</div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Componente auxiliar: Tarjeta de agente en la sidebar
───────────────────────────────────────────────────────────────────────────── */

function AgentCard({
  agent,
  isSelected,
  onSelect,
}: {
  agent: AgentEntry;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      aria-pressed={isSelected}
      className={[
        "group w-full rounded-2xl border p-3 text-left transition-all duration-200",
        "hover:border-purple-500/40 hover:bg-white/3",
        isSelected
          ? "border-purple-500/60 bg-gradient-to-br from-purple-900/20 to-blue-900/15 shadow-[0_0_20px_rgba(139,92,246,0.15)]"
          : "border-white/8 bg-white/2",
      ].join(" ")}
    >
      <div className="flex items-center gap-3">
        <AgentIconWrapper icon={agent.icon} size="sm" />

        <div className="min-w-0 flex-1">
          <p
            className={[
              "truncate text-xs font-medium leading-tight",
              isSelected ? "text-white" : "text-white/80",
            ].join(" ")}
          >
            {agent.title}
          </p>
          <p className="mt-0.5 truncate text-[10px] text-white/40">
            {agent.conversationsLabel}
          </p>
        </div>

        {/* Indicador de selección */}
        {isSelected && (
          <div className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-purple-400" />
        )}
      </div>
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Componente auxiliar: Burbuja de mensaje en el chat
───────────────────────────────────────────────────────────────────────────── */

function MessageBubble({
  message,
  agentIcon,
}: {
  message: Message;
  agentIcon: React.ReactNode;
}) {
  const isUser = message.role === "user";

  return (
    <div
      className={["flex gap-3", isUser ? "flex-row-reverse" : "flex-row"].join(
        " "
      )}
    >
      {/* Avatar */}
      <div className="flex-shrink-0 mt-1">
        {isUser ? (
          <div className="flex h-7 w-7 items-center justify-center rounded-full border border-white/12 bg-white/8">
            <User className="h-3.5 w-3.5 text-white/60" />
          </div>
        ) : (
          <div className="flex h-7 w-7 items-center justify-center rounded-full border border-purple-500/30 bg-gradient-to-br from-purple-900/40 to-blue-900/30">
            <div className="scale-50">{agentIcon}</div>
          </div>
        )}
      </div>

      {/* Contenido del mensaje */}
      <div
        className={[
          "max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
          isUser
            ? "rounded-tr-sm bg-gradient-to-br from-purple-600/25 to-blue-600/20 border border-purple-500/20 text-white/90"
            : "rounded-tl-sm bg-white/5 border border-white/8 text-white/80",
        ].join(" ")}
      >
        <p>{message.content}</p>
        <p
          className={[
            "mt-1.5 text-[10px]",
            isUser ? "text-purple-300/50 text-right" : "text-white/25",
          ].join(" ")}
        >
          {message.timestamp.toLocaleTimeString("es-MX", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Componente auxiliar: Estado vacío (pantalla de bienvenida del agente)
───────────────────────────────────────────────────────────────────────────── */

function EmptyState({
  agent,
  onTopicClick,
}: {
  agent: AgentEntry;
  onTopicClick: (topic: string) => void;
}) {
  const topics = popularTopicsBySlug[agent.slug] ?? [];

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-10 text-center">
      {/* Icono grande con halo */}
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-[#d9ff00]/8 blur-2xl scale-150" />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-[#1a1a3e] to-[#0d1a2e]">
          <div className="scale-[1.6]">{agent.icon}</div>
        </div>
      </div>

      {/* Nombre del agente */}
      <div>
        <Sparkles className="mx-auto mb-3 h-4 w-4 text-[#d9ff00] opacity-70" />
        <h2 className="text-lg font-medium text-[#d9ff00]">{agent.title}</h2>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-white/50">
          {agent.shortDescription}
        </p>
      </div>

      {/* Temas populares */}
      {topics.length > 0 && (
        <div className="flex flex-col items-center gap-3">
          <p className="text-xs text-white/35">Temáticas populares:</p>
          <div className="flex flex-wrap justify-center gap-2">
            {topics.map((topic) => (
              <button
                key={topic}
                onClick={() => onTopicClick(topic)}
                className="rounded-full border border-white/12 bg-white/4 px-3 py-1.5 text-xs text-white/60 transition hover:border-purple-500/30 hover:bg-white/8 hover:text-white/80"
              >
                {topic}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Componente principal: DashboardClient
───────────────────────────────────────────────────────────────────────────── */

export function DashboardClient({ agents, userEmail }: DashboardClientProps) {
  // Agente seleccionado (por defecto el primero)
  const [selectedAgentSlug, setSelectedAgentSlug] = useState<string>(
    agents[0]?.slug ?? ""
  );

  // Historial de chat por agente
  const [chatHistory, setChatHistory] = useState<ChatHistory>({});

  // Texto del input actual
  const [inputValue, setInputValue] = useState("");

  // Estado de carga mientras el agente "procesa"
  const [isPending, startTransition] = useTransition();

  // Ref para auto-scroll al final del chat
  const chatEndRef = useRef<HTMLDivElement>(null);

  const selectedAgent = agents.find((a) => a.slug === selectedAgentSlug);
  const currentMessages = chatHistory[selectedAgentSlug] ?? [];

  /* Auto-scroll cuando llegan nuevos mensajes */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentMessages.length, selectedAgentSlug]);

  /* ── Enviar mensaje ─────────────────────────────────────────────────────── */
  function handleSend() {
    const text = inputValue.trim();
    if (!text || isPending || !selectedAgent) return;

    // Agregar mensaje del usuario al historial
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setChatHistory((prev) => ({
      ...prev,
      [selectedAgentSlug]: [...(prev[selectedAgentSlug] ?? []), userMessage],
    }));

    setInputValue("");

    // Simular respuesta del agente (placeholder hasta integrar la API real)
    startTransition(() => {
      setTimeout(() => {
        const assistantMessage: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: `Estoy analizando tu solicitud sobre "${text}".  Aquí recibirás un informe completo generado por el agente "${selectedAgent.title}". Esta funcionalidad se conectará con la API de ejecución de agentes.`,
          timestamp: new Date(),
        };

        setChatHistory((prev) => ({
          ...prev,
          [selectedAgentSlug]: [
            ...(prev[selectedAgentSlug] ?? []),
            assistantMessage,
          ],
        }));
      }, 1200);
    });
  }

  /* ── Enter para enviar ──────────────────────────────────────────────────── */
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  /* ── Click en tema popular ──────────────────────────────────────────────── */
  function handleTopicClick(topic: string) {
    setInputValue(topic);
  }

  /* ── Iniciar nueva conversación ─────────────────────────────────────────── */
  function handleNewConversation() {
    setChatHistory((prev) => ({
      ...prev,
      [selectedAgentSlug]: [],
    }));
  }

  /* ── Cambiar de agente ──────────────────────────────────────────────────── */
  function handleSelectAgent(slug: string) {
    setSelectedAgentSlug(slug);
    setInputValue("");
  }

  /* ─────────────────────────────────────────────────────────────────────────
     Render
  ───────────────────────────────────────────────────────────────────────── */
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#0A0A0A]">
      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <DashboardHeader userEmail={userEmail} />

      {/* ── BODY: Sidebar + Chat ─────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── SIDEBAR ─────────────────────────────────────────────────────────── */}
        <aside className="hidden w-[240px] flex-shrink-0 flex-col border-r border-white/6 bg-[#0d0d0d] md:flex">
          {/* Info del agente seleccionado */}
          {selectedAgent && (
            <div className="border-b border-white/6 p-4">
              <div className="flex items-center gap-3">
                <AgentIconWrapper icon={selectedAgent.icon} size="md" />
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold leading-tight text-white">
                    {selectedAgent.title}
                  </h2>
                </div>
              </div>
              <p className="mt-3 text-[11px] leading-relaxed text-white/45">
                {selectedAgent.shortDescription}
              </p>
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex flex-col gap-2 border-b border-white/6 p-3">
            <button
              onClick={handleNewConversation}
              className="flex items-center gap-2.5 rounded-xl border border-white/8 bg-white/4 px-3 py-2.5 text-xs text-white/70 transition hover:bg-white/8 hover:text-white"
            >
              <Plus className="h-3.5 w-3.5" />
              Nueva Conversación
            </button>

            <button className="flex items-center gap-2.5 rounded-xl border border-white/8 bg-white/4 px-3 py-2.5 text-xs text-white/70 transition hover:bg-white/8 hover:text-white">
              <Search className="h-3.5 w-3.5" />
              Buscar
            </button>
          </div>

          {/* Lista de agentes instalados */}
          <div className="flex flex-1 flex-col overflow-y-auto p-3">
            <p className="mb-2 px-1 text-[10px] uppercase tracking-[0.18em] text-white/30">
              Mis Agentes
            </p>
            <div className="flex flex-col gap-1.5">
              {agents.map((agent) => (
                <AgentCard
                  key={agent.slug}
                  agent={agent}
                  isSelected={selectedAgentSlug === agent.slug}
                  onSelect={() => handleSelectAgent(agent.slug)}
                />
              ))}
            </div>
          </div>

          {/* Footer de la sidebar */}
          <div className="border-t border-white/6 p-3">
            <button className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/8 bg-white/4 text-white/40 transition hover:bg-white/8 hover:text-white/70">
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </aside>

        {/* ── ÁREA DE CHAT ──────────────────────────────────────────────────────── */}
        <main className="flex flex-1 flex-col overflow-hidden">
          {/* Indicador del agente activo + breadcrumb */}
          {selectedAgent && (
            <div className="flex items-center gap-3 border-b border-white/6 px-5 py-3">
              <div className="flex items-center gap-2 rounded-full border border-white/12 bg-white/4 px-3 py-1.5">
                <div className="scale-75">{selectedAgent.icon}</div>
                <span className="text-xs text-white/70">
                  ↓ Agente
                </span>
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-white/20" />
              <span className="text-sm font-medium text-white/80">
                {selectedAgent.title}
              </span>
            </div>
          )}

          {/* Mensajes o pantalla de bienvenida */}
          <div className="relative flex-1 overflow-y-auto">
            {/* Halo verde decorativo (estilo mockup) */}
            <div
              className="pointer-events-none absolute bottom-0 right-[10%] h-[45%] w-[35%] rounded-full opacity-30"
              style={{
                background:
                  "radial-gradient(circle, rgba(163,230,53,0.18) 0%, transparent 70%)",
              }}
            />

            {currentMessages.length === 0 ? (
              /* Pantalla vacía / bienvenida */
              selectedAgent && (
                <EmptyState
                  agent={selectedAgent}
                  onTopicClick={handleTopicClick}
                />
              )
            ) : (
              /* Historial de mensajes */
              <div className="flex flex-col gap-4 px-5 py-6">
                {currentMessages.map((msg) => (
                  <MessageBubble
                    key={msg.id}
                    message={msg}
                    agentIcon={selectedAgent?.icon}
                  />
                ))}

                {/* Indicador de que el agente está escribiendo */}
                {isPending && (
                  <div className="flex gap-3">
                    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-purple-500/30 bg-gradient-to-br from-purple-900/40 to-blue-900/30 mt-1">
                      <div className="scale-50">{selectedAgent?.icon}</div>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm border border-white/8 bg-white/5 px-4 py-3">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/40 [animation-delay:0ms]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/40 [animation-delay:150ms]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/40 [animation-delay:300ms]" />
                    </div>
                  </div>
                )}

                {/* Scroll anchor */}
                <div ref={chatEndRef} />
              </div>
            )}
          </div>

          {/* ── INPUT DE INSTRUCCIÓN ────────────────────────────────────────── */}
          <div className="border-t border-white/6 p-4">
            <div className="relative flex items-end gap-3 rounded-2xl border border-white/12 bg-[#141414] px-4 py-3 transition focus-within:border-white/20 focus-within:bg-[#161616]">
              <textarea
                id="agent-input"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  selectedAgent
                    ? `Investigación, ingresa tu tema aquí…`
                    : "Selecciona un agente para comenzar"
                }
                disabled={!selectedAgent || isPending}
                rows={1}
                className="flex-1 resize-none bg-transparent text-sm text-white/80 placeholder:text-white/25 focus:outline-none disabled:cursor-not-allowed disabled:opacity-40"
                style={{ maxHeight: "120px" }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = "auto";
                  target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
                }}
              />

              {/* Botón de enviar */}
              <button
                id="send-message-btn"
                onClick={handleSend}
                disabled={!inputValue.trim() || isPending || !selectedAgent}
                className={[
                  "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl transition-all duration-150",
                  inputValue.trim() && !isPending
                    ? "bg-[#d9ff00] text-[#0A0A0A] hover:bg-[#e8ff33] shadow-[0_0_12px_rgba(217,255,0,0.3)]"
                    : "bg-white/6 text-white/25 cursor-not-allowed",
                ].join(" ")}
                aria-label="Enviar mensaje"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>

            <p className="mt-2 text-center text-[10px] text-white/20">
              Presiona <kbd className="font-mono">Enter</kbd> para enviar ·{" "}
              <kbd className="font-mono">Shift + Enter</kbd> para nueva línea
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Header del Dashboard
───────────────────────────────────────────────────────────────────────────── */

const navLinks = [
  { label: "Inicio", href: "/" },
  { label: "Marketplace", href: "/marketplace" },
  { label: "Planes", href: "#" },
  { label: "Developers", href: "#" },
];

function DashboardHeader({ userEmail }: { userEmail?: string | null }) {
  return (
    <header className="flex items-center justify-between border-b border-white/6 bg-[#0A0A0A] px-5 py-3">
      {/* Logo */}
      <Link
        href="/"
        className="font-heading text-xl uppercase tracking-tight text-[#D7F205]"
        style={{ color: "#D7F205" }}
      >
        Agent Flow
      </Link>

      {/* Navegación central */}
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

      {/* Perfil de usuario */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/4 pl-2 pr-3 py-1.5 text-xs text-white/65">
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
