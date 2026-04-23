"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ChevronDown,
  Loader2,
  MessageCircle,
  Send,
  X,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

// ─── Types ────────────────────────────────────────────────────────────────────

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

// ─── Static data ─────────────────────────────────────────────────────────────

const STARTER_PROMPTS = [
  { emoji: "🚀", label: "¿Qué es Miunix?" },
  { emoji: "🤖", label: "¿Qué agentes tienen?" },
  { emoji: "📈", label: "Quiero automatizar ventas" },
  { emoji: "👨‍💻", label: "Soy developer, ¿cómo publico?" },
];

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: "welcome",
    role: "assistant",
    content:
      "¡Hola! 👋 Soy el asistente de Miunix. Estoy aquí para ayudarte a descubrir qué agente necesitas, cómo funcionan los workflows, o si MIUNIX+ es para ti.\n\n¿Por dónde empezamos? 😊",
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Render markdown-style links like [label](/path) as styled pill links */
function renderContent(content: string) {
  return content.split(/(\[[^\]]+\]\([^)]+\))/g).map((part, i) => {
    const match = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (!match) {
      // preserve newlines
      return part.split("\n").map((line, j) => (
        <span key={`${i}-${j}`}>
          {line}
          {j < part.split("\n").length - 1 && <br />}
        </span>
      ));
    }
    const [, label, href] = match;
    if (!href.startsWith("/")) return <span key={i}>{label}</span>;
    return (
      <Link
        key={i}
        href={href}
        className="mx-0.5 inline-flex items-center rounded-full border border-[#d7f209]/25 bg-[#d7f209]/12 px-2 py-0.5 text-[0.78rem] font-semibold text-[#efffa8] transition hover:bg-[#d7f209] hover:text-black"
      >
        {label}
      </Link>
    );
  });
}

function buildRequest(messages: ChatMessage[], next: string) {
  return [
    ...messages
      .filter((m) => m.id !== "welcome")
      .map(({ role, content }) => ({ role, content })),
    { role: "user" as const, content: next },
  ];
}

async function readAssistantPayload(res: Response) {
  const text = await res.text();

  if (!text.trim()) {
    return {
      success: false,
      error: "El asistente no devolvio respuesta. Intenta otra vez.",
    };
  }

  try {
    return JSON.parse(text) as {
      success: boolean;
      message?: string;
      error?: string;
      remainingPrompts?: number | null;
      requiresUpgrade?: boolean;
    };
  } catch {
    return {
      success: false,
      error: "El asistente tuvo un problema temporal, pero MIUNIX sigue activo.",
    };
  }
}

// ─── Avatar component ─────────────────────────────────────────────────────────

function BotAvatar({ size = 32, glow = false }: { size?: number; glow?: boolean }) {
  return (
    <div
      style={{ width: size, height: size }}
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#d7f209] ${
        glow ? "shadow-[0_0_20px_rgba(215,242,9,0.4)]" : ""
      }`}
    >
      <Image
        src="/brand/miunix-mark.svg"
        alt="Asistente Miunix"
        width={size}
        height={size}
        className="h-full w-full object-contain p-1"
      />
    </div>
  );
}

// ─── Typing indicator ────────────────────────────────────────────────────────

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-white/40"
          animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
          transition={{ duration: 1, delay: i * 0.18, repeat: Infinity }}
        />
      ))}
    </div>
  );
}

// ─── Single message bubble ───────────────────────────────────────────────────

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className={`flex gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      {!isUser && (
        <div className="mt-0.5 shrink-0">
          <BotAvatar size={28} />
        </div>
      )}
      <div
        className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-sm leading-6 ${
          isUser
            ? "rounded-tr-sm bg-[#d7f209] font-medium text-black"
            : "rounded-tl-sm border border-white/[0.08] bg-white/[0.05] text-white/80"
        }`}
      >
        {renderContent(message.content)}
      </div>
    </motion.div>
  );
}

// ─── Starter chip ────────────────────────────────────────────────────────────

function StarterChip({
  emoji,
  label,
  onClick,
  delay,
}: {
  emoji: string;
  label: string;
  onClick: () => void;
  delay: number;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ scale: 1.03, backgroundColor: "rgba(255,255,255,0.08)" }}
      whileTap={{ scale: 0.97 }}
      className="flex w-full items-center gap-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-left text-xs text-white/65 transition"
    >
      <span className="text-base leading-none">{emoji}</span>
      <span>{label}</span>
    </motion.button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function MiunixAssistantBubble() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [inputValue, setInputValue] = useState("");
  const [remainingPrompts, setRemainingPrompts] = useState<number | null>(10);
  const [requiresUpgrade, setRequiresUpgrade] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);

  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const lastMessagesForRequest = useMemo(() => messages.slice(-7), [messages]);

  // Auto-focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setHasNewMessage(false);
      window.setTimeout(() => inputRef.current?.focus(), 120);
    }
  }, [isOpen]);

  // Scroll to bottom on new messages
  function scrollToBottom() {
    window.setTimeout(() => {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
    }, 80);
  }

  async function sendMessage(value?: string) {
    const text = (value ?? inputValue).trim();
    if (!text || isSending || requiresUpgrade) return;

    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsSending(true);
    scrollToBottom();

    try {
      const res = await fetch("/api/miunix-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: buildRequest(lastMessagesForRequest, text) }),
      });
      const payload = await readAssistantPayload(res);

      if (payload.requiresUpgrade) {
        setRequiresUpgrade(true);
        setRemainingPrompts(0);
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content:
              payload.error ??
              "Has usado tus 10 prompts gratis 🎯. Con MIUNIX+ tienes runs ilimitados.",
          },
        ]);
        if (!isOpen) setHasNewMessage(true);
        return;
      }

      if (!res.ok || !payload.success) throw new Error(payload.error ?? "Error desconocido.");

      setRemainingPrompts(
        typeof payload.remainingPrompts === "number" ? payload.remainingPrompts : null,
      );
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content:
            payload.message ?? "Puedo orientarte hacia Marketplace, Workflows o MIUNIX+.",
        },
      ]);
      if (!isOpen) setHasNewMessage(true);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: err instanceof Error ? err.message : "No pude responder ahora 😅",
        },
      ]);
    } finally {
      setIsSending(false);
      scrollToBottom();
    }
  }

  const showStarters = messages.length === 1 && !isSending;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3 sm:bottom-7 sm:right-7">
      {/* ── Chat window ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.section
            key="chat-window"
            initial={{ opacity: 0, y: 28, scale: 0.94, originX: 1, originY: 1 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.94 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="flex h-[min(560px,calc(100dvh-6rem))] w-[min(360px,calc(100vw-2rem))] flex-col overflow-hidden rounded-[1.4rem] border border-white/[0.1] bg-[#0c0c0f]/96 shadow-[0_32px_80px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.04)] backdrop-blur-2xl sm:h-[min(600px,calc(100dvh-7rem))] sm:w-[min(380px,calc(100vw-3rem))] sm:rounded-[1.6rem]"
            aria-label="Chat de asistente Miunix"
          >
            {/* ── Header ── */}
            <header className="relative flex items-center justify-between gap-3 border-b border-white/[0.07] bg-white/[0.02] px-4 py-3.5">
              {/* gradient accent top */}
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#d7f209]/40 to-transparent" />

              <div className="flex items-center gap-3">
                <BotAvatar size={38} glow />
                <div>
                  <p className="text-[13px] font-semibold text-white">Asistente Miunix</p>
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                    <p className="text-[11px] text-white/40">
                      {remainingPrompts === null
                        ? "MIUNIX+ · runs ilimitados"
                        : `${remainingPrompts} prompts gratis`}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-xl text-white/35 transition hover:bg-white/8 hover:text-white/80"
                  aria-label="Minimizar chat"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-xl text-white/35 transition hover:bg-red-500/15 hover:text-red-300"
                  aria-label="Cerrar chat"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </header>

            {/* ── Messages ── */}
            <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-4 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.08)_transparent]">
              <div className="flex flex-col gap-3">
                {messages.map((msg) => (
                  <MessageBubble key={msg.id} message={msg} />
                ))}

                {isSending && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-2"
                  >
                    <BotAvatar size={28} />
                    <div className="rounded-2xl rounded-tl-sm border border-white/[0.08] bg-white/[0.05] px-3.5 py-3">
                      <TypingDots />
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Starter chips */}
              <AnimatePresence>
                {showStarters && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="mt-4 space-y-2"
                  >
                    <p className="mb-3 text-[10px] font-medium uppercase tracking-widest text-white/25">
                      Sugerencias rápidas
                    </p>
                    {STARTER_PROMPTS.map((p, i) => (
                      <StarterChip
                        key={p.label}
                        emoji={p.emoji}
                        label={p.label}
                        onClick={() => void sendMessage(p.label)}
                        delay={i * 0.06}
                      />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ── Footer ── */}
            <div className="border-t border-white/[0.07] px-4 pb-4 pt-3">
              {requiresUpgrade ? (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border border-[#d7f209]/15 bg-gradient-to-br from-[#d7f209]/8 to-transparent p-4"
                >
                  <p className="text-[13px] leading-5 text-white/65">
                    Para continuar, activa{" "}
                    <span className="font-semibold text-[#d7f209]">MIUNIX+</span> y obtén
                    runs ilimitados con el asistente.
                  </p>
                  <Link
                    href="/miunix-plus"
                    className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[#d7f209] px-4 py-2 text-xs font-bold text-black transition hover:bg-[#e4ff33]"
                  >
                    <Zap className="h-3.5 w-3.5" />
                    Ver planes MIUNIX+
                  </Link>
                </motion.div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void sendMessage();
                  }}
                  className="flex items-end gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-2.5 transition focus-within:border-[#858BE3]/40 focus-within:bg-white/[0.05]"
                >
                  <textarea
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        void sendMessage();
                      }
                    }}
                    rows={1}
                    placeholder="Pregúntame lo que quieras…"
                    className="max-h-24 flex-1 resize-none bg-transparent py-0.5 text-sm text-white/80 outline-none placeholder:text-white/25"
                    disabled={isSending}
                  />
                  <motion.button
                    type="submit"
                    disabled={!inputValue.trim() || isSending}
                    whileTap={{ scale: 0.92 }}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#d7f209] text-black transition hover:bg-[#e4ff33] disabled:cursor-not-allowed disabled:bg-white/8 disabled:text-white/25"
                    aria-label="Enviar mensaje"
                  >
                    {isSending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Send className="h-3.5 w-3.5" />
                    )}
                  </motion.button>
                </form>
              )}

              <p className="mt-2 text-center text-[10px] text-white/20">
                Miunix AI · responde en segundos
              </p>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* ── Trigger bubble ── */}
      <div className="relative">
        {/* Notification dot */}
        <AnimatePresence>
          {hasNewMessage && !isOpen && (
            <motion.span
              key="notif"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -right-0.5 -top-0.5 z-10 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500"
            >
              <span className="h-2 w-2 rounded-full bg-white" />
            </motion.span>
          )}
        </AnimatePresence>

        {/* Bubble button */}
        <motion.button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          animate={
            !isOpen
              ? {
                  boxShadow: [
                    "0 0 0 0 rgba(215,242,9,0)",
                    "0 0 0 10px rgba(215,242,9,0.1)",
                    "0 0 0 0 rgba(215,242,9,0)",
                  ],
                }
              : {}
          }
          transition={
            !isOpen
              ? { duration: 2.5, repeat: Infinity, repeatDelay: 3 }
              : { duration: 0.2 }
          }
          aria-expanded={isOpen}
          aria-label={isOpen ? "Cerrar asistente" : "Abrir asistente Miunix"}
          className={`group relative flex items-center gap-3 overflow-hidden rounded-full border px-4 py-3 text-sm font-semibold text-black shadow-[0_16px_48px_rgba(215,242,9,0.3)] transition-all duration-200 ${
            isOpen
              ? "border-white/20 bg-[#18181b] text-white"
              : "border-[#d7f209]/40 bg-[#d7f209] hover:bg-[#e4ff33]"
          }`}
        >
          {/* Shimmer on hover */}
          <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />

          <AnimatePresence mode="wait" initial={false}>
            {isOpen ? (
              <motion.span
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="flex items-center justify-center"
              >
                <X className="h-5 w-5 text-white/70" />
              </motion.span>
            ) : (
              <motion.span
                key="open"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-black/10"
              >
                <Image
                  src="/brand/miunix-mark.svg"
                  alt="Miunix"
                  width={28}
                  height={28}
                  className="h-7 w-7 object-contain"
                />
              </motion.span>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait" initial={false}>
            {!isOpen && (
              <motion.span
                key="label"
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="hidden overflow-hidden whitespace-nowrap sm:block"
              >
                Habla con Miunix
              </motion.span>
            )}
          </AnimatePresence>

          {!isOpen && (
            <motion.span
              animate={{ rotate: [0, 15, -10, 0] }}
              transition={{ duration: 0.6, delay: 1.5, repeat: Infinity, repeatDelay: 5 }}
              className="hidden sm:block"
            >
              <MessageCircle className="h-4 w-4" />
            </motion.span>
          )}
        </motion.button>
      </div>
    </div>
  );
}
