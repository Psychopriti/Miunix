"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowUpRight,
  ChevronRight,
  PencilLine,
  Plus,
  Search,
  Send,
  Settings,
  Sparkles,
  Trash2,
  User,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import type { ReactNode } from "react";

import type {
  DashboardAgent,
  DashboardChatHistory,
  DashboardConversation,
  DashboardMessage,
  DashboardProgressItem,
} from "@/lib/dashboard";

type DashboardClientProps = {
  agents: DashboardAgent[];
  initialConversations: DashboardConversation[];
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
  conversationCount,
  onSelect,
}: {
  agent: DashboardAgent;
  isSelected: boolean;
  conversationCount: number;
  onSelect: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onSelect}
      aria-pressed={isSelected}
      whileHover={{ x: 2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
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
            {conversationCount} conversación
            {conversationCount === 1 ? "" : "es"}
          </p>
        </div>

        <AnimatePresence>
          {isSelected && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-purple-400"
            />
          )}
        </AnimatePresence>
      </div>
    </motion.button>
  );
}

function formatConversationTimestamp(timestamp: string) {
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString("es-NI", {
    day: "numeric",
    month: "short",
  });
}

function formatConversationTitle(title: string) {
  const normalized = title.trim();
  return normalized || "Nueva conversacion";
}

function getConversationPreview(messages: DashboardMessage[]) {
  const lastMeaningfulMessage = [...messages]
    .reverse()
    .find((message) => message.content.trim());

  if (!lastMeaningfulMessage) {
    return "Sin mensajes todavia";
  }

  const normalized = lastMeaningfulMessage.content
    .replace(/\s+/g, " ")
    .replace(/[#*`>-]/g, "")
    .trim();

  if (!normalized) {
    return "Sin mensajes todavia";
  }

  return normalized.length > 68
    ? `${normalized.slice(0, 65).trimEnd()}...`
    : normalized;
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

function renderInlineMarkdown(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return (
        <strong key={`${part}-${index}`} className="font-semibold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }

    return <span key={`${part}-${index}`}>{part}</span>;
  });
}

function renderMarkdownContent(content: string) {
  const lines = content.split("\n");
  const blocks: ReactNode[] = [];
  let paragraphLines: string[] = [];
  let bulletLines: string[] = [];

  const flushParagraph = () => {
    if (paragraphLines.length === 0) {
      return;
    }

    const paragraph = paragraphLines.join(" ").trim();

    if (paragraph) {
      blocks.push(
        <p key={`paragraph-${blocks.length}`} className="whitespace-pre-wrap">
          {renderInlineMarkdown(paragraph)}
        </p>,
      );
    }

    paragraphLines = [];
  };

  const flushBullets = () => {
    if (bulletLines.length === 0) {
      return;
    }

    blocks.push(
      <ul
        key={`bullets-${blocks.length}`}
        className="space-y-1.5 pl-5 text-inherit"
      >
        {bulletLines.map((line, index) => (
          <li key={`bullet-${index}`} className="list-disc">
            {renderInlineMarkdown(line)}
          </li>
        ))}
      </ul>,
    );

    bulletLines = [];
  };

  for (const line of lines) {
    const trimmedLine = line.trim();

    if (!trimmedLine) {
      flushParagraph();
      flushBullets();
      continue;
    }

    if (trimmedLine.startsWith("- ") || trimmedLine.startsWith("* ")) {
      flushParagraph();
      bulletLines.push(trimmedLine.slice(2).trim());
      continue;
    }

    if (/^\d+\.\s/.test(trimmedLine)) {
      flushParagraph();
      bulletLines.push(trimmedLine.replace(/^\d+\.\s/, "").trim());
      continue;
    }

    if (trimmedLine.startsWith("## ")) {
      flushParagraph();
      flushBullets();
      blocks.push(
        <h3
          key={`heading-${blocks.length}`}
          className="mt-2 text-base font-semibold text-white"
        >
          {renderInlineMarkdown(trimmedLine.slice(3).trim())}
        </h3>,
      );
      continue;
    }

    if (trimmedLine.startsWith("### ")) {
      flushParagraph();
      flushBullets();
      blocks.push(
        <h4
          key={`heading-${blocks.length}`}
          className="mt-2 text-sm font-semibold uppercase tracking-[0.08em] text-white/88"
        >
          {renderInlineMarkdown(trimmedLine.slice(4).trim())}
        </h4>,
      );
      continue;
    }

    if (trimmedLine.startsWith("# ")) {
      flushParagraph();
      flushBullets();
      blocks.push(
        <h2
          key={`heading-${blocks.length}`}
          className="mt-2 text-lg font-semibold text-white"
        >
          {renderInlineMarkdown(trimmedLine.slice(2).trim())}
        </h2>,
      );
      continue;
    }

    flushBullets();
    paragraphLines.push(trimmedLine);
  }

  flushParagraph();
  flushBullets();

  return <div className="space-y-3">{blocks}</div>;
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
  const hasProgress = !!message.progressItems?.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
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
        {message.content ? (
          renderMarkdownContent(message.content)
        ) : null}

        {hasProgress ? (
          <div className={message.content ? "mt-3 space-y-2" : "space-y-2"}>
            {message.progressItems?.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-2 rounded-xl border border-white/6 bg-black/10 px-3 py-2"
              >
                <span
                  className={[
                    "mt-1 h-2 w-2 flex-shrink-0 rounded-full",
                    item.status === "completed"
                      ? "bg-emerald-400"
                      : item.status === "failed"
                        ? "bg-red-400"
                        : "bg-[#d9ff00] animate-pulse",
                  ].join(" ")}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-white/85">{item.label}</p>
                  <p className="mt-0.5 text-[10px] uppercase tracking-[0.14em] text-white/30">
                    {item.kind === "tool" ? "Tool" : "Paso"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        <div
          className={[
            "mt-2 flex items-center gap-2 text-[10px]",
            isUser ? "justify-end text-purple-300/50" : "text-white/25",
          ].join(" ")}
        >
          {!isUser && message.isStreaming ? (
            <span className="rounded-full border border-[#d9ff00]/30 px-1.5 py-0.5 text-[9px] uppercase tracking-[0.16em] text-[#d9ff00]">
              En proceso
            </span>
          ) : null}
          {!isUser && isFailed ? (
            <span className="rounded-full border border-red-500/30 px-1.5 py-0.5 text-[9px] uppercase tracking-[0.16em] text-red-200">
              Fallo
            </span>
          ) : null}
          <span>{formatTimestamp(message.timestamp)}</span>
        </div>
      </div>
    </motion.div>
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
  initialConversations,
  initialChatHistory,
  userEmail,
}: DashboardClientProps) {
  const [selectedAgentSlug, setSelectedAgentSlug] = useState(agents[0]?.slug ?? "");
  const [conversations, setConversations] =
    useState<DashboardConversation[]>(initialConversations);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(
    initialConversations[0]?.id ?? null,
  );
  const [chatHistory, setChatHistory] =
    useState<DashboardChatHistory>(initialChatHistory);
  const [inputValue, setInputValue] = useState("");
  const [conversationSearch, setConversationSearch] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const [conversationActionId, setConversationActionId] = useState<string | null>(null);
  const [renamingConversationId, setRenamingConversationId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const selectedAgent = agents.find((agent) => agent.slug === selectedAgentSlug);
  const conversationsForSelectedAgent = conversations.filter(
    (conversation) => conversation.agentSlug === selectedAgentSlug,
  );
  const filteredConversationsForSelectedAgent = conversationsForSelectedAgent.filter(
    (conversation) =>
      formatConversationTitle(conversation.title)
        .toLowerCase()
        .includes(conversationSearch.trim().toLowerCase()) ||
      getConversationPreview(chatHistory[conversation.id] ?? [])
        .toLowerCase()
        .includes(conversationSearch.trim().toLowerCase()),
  );
  const selectedConversation =
    conversationsForSelectedAgent.find(
      (conversation) => conversation.id === selectedConversationId,
    ) ?? conversationsForSelectedAgent[0] ?? null;
  const currentMessages = selectedConversation
    ? chatHistory[selectedConversation.id] ?? []
    : [];
  const lastMessage = currentMessages[currentMessages.length - 1];
  const lastMessageProgressCount = lastMessage?.progressItems?.length ?? 0;

  useEffect(() => {
    if (!selectedAgentSlug) {
      setSelectedConversationId(null);
      return;
    }

    const nextConversations = conversations.filter(
      (conversation) => conversation.agentSlug === selectedAgentSlug,
    );

    if (nextConversations.length === 0) {
      setSelectedConversationId(null);
      return;
    }

    if (
      !selectedConversationId ||
      !nextConversations.some((conversation) => conversation.id === selectedConversationId)
    ) {
      setSelectedConversationId(nextConversations[0].id);
    }
  }, [conversations, selectedAgentSlug, selectedConversationId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [
    currentMessages.length,
    lastMessage?.isStreaming,
    lastMessageProgressCount,
    selectedAgentSlug,
    isSending,
  ]);

  function updateMessage(
    conversationId: string,
    messageId: string,
    updater: (message: DashboardMessage) => DashboardMessage,
  ) {
    setChatHistory((current) => ({
      ...current,
      [conversationId]: (current[conversationId] ?? []).map((message) =>
        message.id === messageId ? updater(message) : message,
      ),
    }));
  }

  function upsertProgressItem(
    items: DashboardProgressItem[],
    nextItem: DashboardProgressItem,
  ) {
    const existingIndex = items.findIndex((item) => item.id === nextItem.id);

    if (existingIndex === -1) {
      return [...items, nextItem];
    }

    return items.map((item, index) =>
      index === existingIndex ? { ...item, ...nextItem } : item,
    );
  }

  async function readStreamedExecution(
    response: Response,
    conversationId: string,
    progressMessageId: string,
  ) {
    if (!response.body) {
      throw new Error("No se recibio ningun stream del servidor.");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let finalPayload:
      | {
          conversationId?: string;
          output: string;
          execution: {
            id: string;
            status: "pending" | "completed" | "failed";
            created_at: string;
          };
        }
      | undefined;

    const processBlock = (block: string) => {
      const lines = block.split("\n").filter(Boolean);
      const eventName =
        lines.find((line) => line.startsWith("event:"))?.slice(6).trim() ??
        "message";
      const dataText = lines
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice(5).trim())
        .join("\n");

      if (!dataText) {
        return;
      }

      const payload = JSON.parse(dataText) as Record<string, unknown>;

      if (eventName === "progress") {
        const progressItem: DashboardProgressItem = {
          id: String(payload.id ?? crypto.randomUUID()),
          kind: payload.kind === "tool" ? "tool" : "status",
          label: String(payload.label ?? "Paso en curso"),
          status:
            payload.status === "completed" ||
            payload.status === "failed" ||
            payload.status === "running"
              ? payload.status
              : "running",
        };

        updateMessage(conversationId, progressMessageId, (message) => ({
          ...message,
          progressItems: upsertProgressItem(message.progressItems ?? [], progressItem),
        }));
      }

      if (eventName === "complete") {
        finalPayload = payload as typeof finalPayload;
      }

      if (eventName === "error") {
        throw new Error(String(payload.error ?? "No se pudo ejecutar el agente."));
      }
    };

    while (true) {
      const { done, value } = await reader.read();
      buffer += decoder.decode(value ?? new Uint8Array(), { stream: !done });

      let separatorIndex = buffer.indexOf("\n\n");

      while (separatorIndex !== -1) {
        const block = buffer.slice(0, separatorIndex);
        buffer = buffer.slice(separatorIndex + 2);

        if (block.trim()) {
          processBlock(block);
        }

        separatorIndex = buffer.indexOf("\n\n");
      }

      if (done) {
        break;
      }
    }

    if (!finalPayload?.output || !finalPayload.execution) {
      throw new Error("La ejecucion termino sin respuesta final.");
    }

    return finalPayload;
  }

  function handleTopicClick(topic: string) {
    setInputValue(topic);
  }

  async function createConversation(title?: string) {
    if (!selectedAgent) {
      return null;
    }

    setIsCreatingConversation(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/agent-conversations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          agentId: selectedAgent.id,
          title,
        }),
      });

      const payload = (await response.json()) as {
        success: boolean;
        error?: string;
        conversation?: DashboardConversation;
      };

      if (!response.ok || !payload.success || !payload.conversation) {
        throw new Error(payload.error ?? "No se pudo crear la conversacion.");
      }

      setConversations((current) => [payload.conversation!, ...current]);
      setSelectedConversationId(payload.conversation.id);
      setChatHistory((current) => ({
        ...current,
        [payload.conversation!.id]: current[payload.conversation!.id] ?? [],
      }));
      return payload.conversation;
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No se pudo crear la conversacion.",
      );
      return null;
    } finally {
      setIsCreatingConversation(false);
    }
  }

  function handleNewConversation() {
    void createConversation();
  }

  function handleSelectAgent(slug: string) {
    setSelectedAgentSlug(slug);
    setInputValue("");
    setErrorMessage(null);
    setRenamingConversationId(null);
    setConversationSearch("");
  }

  function startRenamingConversation(conversation: DashboardConversation) {
    setRenamingConversationId(conversation.id);
    setRenameValue(conversation.title);
  }

  async function handleRenameConversation(conversationId: string) {
    const title = renameValue.trim();

    if (!title) {
      setRenamingConversationId(null);
      return;
    }

    setConversationActionId(conversationId);
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/agent-conversations/${conversationId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title }),
      });

      const payload = (await response.json()) as {
        success: boolean;
        error?: string;
        conversation?: DashboardConversation;
      };

      if (!response.ok || !payload.success || !payload.conversation) {
        throw new Error(payload.error ?? "No se pudo renombrar la conversacion.");
      }

      setConversations((current) =>
        current.map((conversation) =>
          conversation.id === conversationId ? payload.conversation! : conversation,
        ),
      );
      setRenamingConversationId(null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No se pudo renombrar la conversacion.",
      );
    } finally {
      setConversationActionId(null);
    }
  }

  async function handleDeleteConversation(conversationId: string) {
    setConversationActionId(conversationId);
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/agent-conversations/${conversationId}`, {
        method: "DELETE",
      });

      const payload = (await response.json()) as {
        success: boolean;
        error?: string;
      };

      if (!response.ok || !payload.success) {
        throw new Error(payload.error ?? "No se pudo borrar la conversacion.");
      }

      setConversations((current) =>
        current.filter((conversation) => conversation.id !== conversationId),
      );
      setChatHistory((current) => {
        const next = { ...current };
        delete next[conversationId];
        return next;
      });

      if (selectedConversationId === conversationId) {
        const nextConversation = conversationsForSelectedAgent.find(
          (conversation) => conversation.id !== conversationId,
        );
        setSelectedConversationId(nextConversation?.id ?? null);
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No se pudo borrar la conversacion.",
      );
    } finally {
      setConversationActionId(null);
    }
  }

  async function handleSend() {
    if (!selectedAgent) {
      return;
    }

    const text = inputValue.trim();

    if (!text || isSending) {
      return;
    }

    const activeConversation =
      selectedConversation ?? (await createConversation(text));

    if (!activeConversation) {
      return;
    }

    const userMessage: DashboardMessage = {
      id: crypto.randomUUID(),
      conversationId: activeConversation.id,
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };

    setChatHistory((current) => ({
      ...current,
      [activeConversation.id]: [
        ...(current[activeConversation.id] ?? []),
        userMessage,
      ],
    }));
    setInputValue("");
    setErrorMessage(null);
    setIsSending(true);
    setSelectedConversationId(activeConversation.id);

    const progressMessageId = crypto.randomUUID();
    const progressMessage: DashboardMessage = {
      id: progressMessageId,
      conversationId: activeConversation.id,
      role: "assistant",
      content: "Proceso del agente",
      timestamp: new Date().toISOString(),
      executionStatus: "pending",
      isStreaming: true,
      progressItems: [
        {
          id: "request-received",
          kind: "status",
          label: "Solicitud recibida",
          status: "completed",
        },
      ],
    };

    setChatHistory((current) => ({
      ...current,
      [activeConversation.id]: [
        ...(current[activeConversation.id] ?? []),
        progressMessage,
      ],
    }));

    try {
      const response = await fetch("/api/run-agent/stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          agentId: selectedAgent.id,
          conversationId: activeConversation.id,
          input: text,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "No se pudo iniciar el stream del agente.");
      }

      const payload = await readStreamedExecution(
        response,
        activeConversation.id,
        progressMessageId,
      );

      updateMessage(activeConversation.id, progressMessageId, (message) => ({
        ...message,
        executionStatus: "completed",
        isStreaming: false,
      }));

      const assistantMessage: DashboardMessage = {
        id: crypto.randomUUID(),
        conversationId: payload.conversationId ?? activeConversation.id,
        role: "assistant",
        content: payload.output,
        timestamp: payload.execution.created_at,
        executionStatus: payload.execution.status,
      };

      setChatHistory((current) => ({
        ...current,
        [activeConversation.id]: [
          ...(current[activeConversation.id] ?? []),
          assistantMessage,
        ],
      }));
      setConversations((current) =>
        current
          .map((conversation) =>
            conversation.id === activeConversation.id
              ? {
                  ...conversation,
                  lastMessageAt: payload.execution.created_at,
                  title:
                    conversation.title === "Nueva conversacion"
                      ? text.slice(0, 72)
                      : conversation.title,
                }
              : conversation,
          )
          .sort(
            (left, right) =>
              new Date(right.lastMessageAt).getTime() -
              new Date(left.lastMessageAt).getTime(),
          ),
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Hubo un problema ejecutando el agente.";

      setErrorMessage(message);
      updateMessage(activeConversation.id, progressMessageId, (messageState) => ({
        ...messageState,
        content: `Proceso interrumpido\n\n${message}`,
        executionStatus: "failed",
        isStreaming: false,
        progressItems: upsertProgressItem(messageState.progressItems ?? [], {
          id: "stream-error",
          kind: "status",
          label: "La ejecucion fallo",
          status: "failed",
        }),
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
              disabled={!selectedAgent || isCreatingConversation}
              className="flex items-center gap-2.5 rounded-xl border border-white/8 bg-white/4 px-3 py-2.5 text-xs text-white/70 transition hover:bg-white/8 hover:text-white"
            >
              <Plus className="h-3.5 w-3.5" />
              {isCreatingConversation ? "Creando..." : "Nueva Conversacion"}
            </button>
          </div>

          <div className="flex flex-1 flex-col overflow-y-auto p-3">
            <p className="mb-2 px-1 text-[10px] uppercase tracking-[0.18em] text-white/30">
              Mis Agentes
            </p>
            <div className="flex flex-col gap-1.5">
              {agents.map((agent, i) => (
                <motion.div
                  key={agent.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.06, ease: "easeOut" }}
                >
                  <AgentCard
                    agent={agent}
                    isSelected={selectedAgentSlug === agent.slug}
                    conversationCount={
                      conversations.filter(
                        (conversation) => conversation.agentSlug === agent.slug,
                      ).length
                    }
                    onSelect={() => handleSelectAgent(agent.slug)}
                  />
                </motion.div>
              ))}
            </div>

            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between gap-2 px-1">
                <p className="text-[10px] uppercase tracking-[0.18em] text-white/30">
                  Conversaciones
                </p>
                <span className="text-[10px] text-white/25">
                  {filteredConversationsForSelectedAgent.length}
                </span>
              </div>

              <div className="mb-3 flex items-center gap-2 rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2">
                <Search className="h-3.5 w-3.5 text-white/30" />
                <input
                  value={conversationSearch}
                  onChange={(event) => setConversationSearch(event.target.value)}
                  placeholder="Buscar conversaciones"
                  className="w-full bg-transparent text-xs text-white/75 outline-none placeholder:text-white/25"
                />
              </div>

              {selectedAgent && filteredConversationsForSelectedAgent.length > 0 ? (
                <AnimatePresence initial={false}>
                  <div className="flex flex-col gap-2">
                  {filteredConversationsForSelectedAgent.map((conversation) => {
                    const isSelected = selectedConversation?.id === conversation.id;
                    const isRenaming = renamingConversationId === conversation.id;
                    const isActing = conversationActionId === conversation.id;
                    const preview = getConversationPreview(
                      chatHistory[conversation.id] ?? [],
                    );

                    return (
                      <motion.div
                        key={conversation.id}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.22, ease: "easeOut" }}
                        className={[
                          "rounded-2xl border px-3 py-3 transition cursor-pointer",
                          isSelected
                            ? "border-purple-500/45 bg-purple-500/10"
                            : "border-white/8 bg-white/[0.025] hover:border-white/16 hover:bg-white/[0.04]",
                        ].join(" ")}
                      >
                        <div className="flex items-start gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedConversationId(conversation.id)}
                            className="min-w-0 flex-1 text-left"
                          >
                            {isRenaming ? (
                              <input
                                value={renameValue}
                                onChange={(event) => setRenameValue(event.target.value)}
                                onBlur={() => void handleRenameConversation(conversation.id)}
                                onKeyDown={(event) => {
                                  if (event.key === "Enter") {
                                    event.preventDefault();
                                    void handleRenameConversation(conversation.id);
                                  }

                                  if (event.key === "Escape") {
                                    setRenamingConversationId(null);
                                  }
                                }}
                                autoFocus
                                className="w-full rounded-lg border border-white/12 bg-black/20 px-2 py-1 text-xs text-white outline-none"
                              />
                            ) : (
                              <>
                                <p className="truncate text-xs font-medium text-white/85">
                                  {formatConversationTitle(conversation.title)}
                                </p>
                                <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-white/38">
                                  {preview}
                                </p>
                                <p className="mt-2 text-[10px] text-white/28">
                                  {formatConversationTimestamp(conversation.lastMessageAt)}
                                </p>
                              </>
                            )}
                          </button>

                          {!isRenaming ? (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => startRenamingConversation(conversation)}
                                className="rounded-lg p-1.5 text-white/35 transition hover:bg-white/8 hover:text-white/70"
                                aria-label="Renombrar conversacion"
                              >
                                <PencilLine className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => void handleDeleteConversation(conversation.id)}
                                disabled={isActing}
                                className="rounded-lg p-1.5 text-white/35 transition hover:bg-red-500/10 hover:text-red-200"
                                aria-label="Borrar conversacion"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ) : null}
                        </div>
                      </motion.div>
                    );
                  })}
                  </div>
                </AnimatePresence>
              ) : selectedAgent && conversationsForSelectedAgent.length > 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-3 py-4 text-center text-xs text-white/40">
                  No hay conversaciones que coincidan con esa busqueda.
                </div>
              ) : selectedAgent ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-3 py-4 text-center text-xs text-white/40">
                  Todavia no hay conversaciones para este agente.
                </div>
              ) : null}
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
                <div>
                  <span className="text-sm font-medium text-white/80">
                    {selectedAgent.name}
                  </span>
                  {selectedConversation ? (
                    <p className="text-xs text-white/35">
                      {formatConversationTitle(selectedConversation.title)}
                    </p>
                  ) : null}
                </div>
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

              <motion.button
                type="button"
                onClick={() => void handleSend()}
                disabled={!inputValue.trim() || isSending || !selectedAgent}
                whileHover={inputValue.trim() && !isSending && selectedAgent ? { scale: 1.1 } : {}}
                whileTap={inputValue.trim() && !isSending && selectedAgent ? { scale: 0.88 } : {}}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                className={[
                  "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl transition-all duration-150",
                  inputValue.trim() && !isSending && selectedAgent
                    ? "bg-[#d9ff00] text-[#0A0A0A] shadow-[0_0_12px_rgba(217,255,0,0.3)] hover:bg-[#e8ff33]"
                    : "cursor-not-allowed bg-white/6 text-white/25",
                ].join(" ")}
                aria-label="Enviar mensaje"
              >
                <Send className="h-3.5 w-3.5" />
              </motion.button>
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
        Miunix
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
