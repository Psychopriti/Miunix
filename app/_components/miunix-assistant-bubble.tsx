"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Loader2, Send, Sparkles, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const starterPrompts = [
  "Tengo un negocio y quiero automatizar ventas",
  "Que agente me recomiendas para marketing?",
  "Soy developer, como publico un agente?",
];

const initialMessages: ChatMessage[] = [
  {
    id: "welcome",
    role: "assistant",
    content:
      "Hola, soy el asistente de Miunix. Puedo ayudarte a entender que ofrecemos, elegir un agente, encontrar un workflow o decidir si necesitas MIUNIX+ para crear tu propio agente privado.",
  },
];

function renderMessageContent(content: string) {
  const parts = content.split(/(\[[^\]]+\]\([^)]+\))/g);

  return parts.map((part, index) => {
    const match = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);

    if (!match) {
      return <span key={`${part}-${index}`}>{part}</span>;
    }

    const [, label, href] = match;
    const isInternalLink = href.startsWith("/");

    if (!isInternalLink) {
      return <span key={`${part}-${index}`}>{label}</span>;
    }

    return (
      <Link
        key={`${href}-${index}`}
        href={href}
        className="mx-0.5 inline-flex items-center rounded-full border border-[#d9ff00]/25 bg-[#d9ff00]/10 px-2 py-0.5 text-[0.78rem] font-semibold text-[#efffa8] transition hover:bg-[#d9ff00] hover:text-black"
      >
        {label}
      </Link>
    );
  });
}

function buildRequestMessages(messages: ChatMessage[], nextInput: string) {
  return [
    ...messages
      .filter((message) => message.id !== "welcome")
      .map(({ role, content }) => ({ role, content })),
    { role: "user" as const, content: nextInput },
  ];
}

export function MiunixAssistantBubble() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [inputValue, setInputValue] = useState("");
  const [remainingPrompts, setRemainingPrompts] = useState<number | null>(10);
  const [requiresUpgrade, setRequiresUpgrade] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const lastMessagesForRequest = useMemo(
    () => messages.slice(-7),
    [messages],
  );

  async function sendMessage(value?: string) {
    const nextInput = (value ?? inputValue).trim();

    if (!nextInput || isSending || requiresUpgrade) {
      return;
    }

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: nextInput,
    };

    setMessages((current) => [...current, userMessage]);
    setInputValue("");
    setIsSending(true);

    try {
      const response = await fetch("/api/miunix-assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: buildRequestMessages(lastMessagesForRequest, nextInput),
        }),
      });
      const payload = (await response.json()) as {
        success: boolean;
        message?: string;
        error?: string;
        remainingPrompts?: number | null;
        requiresUpgrade?: boolean;
      };

      if (payload.requiresUpgrade) {
        setRequiresUpgrade(true);
        setRemainingPrompts(0);
        setMessages((current) => [
          ...current,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content:
              payload.error ??
              "Ya usaste tus 10 prompts gratis. MIUNIX+ incluye runs ilimitados para este asistente.",
          },
        ]);
        return;
      }

      if (!response.ok || !payload.success) {
        throw new Error(payload.error ?? "No pude responder en este momento.");
      }

      setRemainingPrompts(
        typeof payload.remainingPrompts === "number"
          ? payload.remainingPrompts
          : null,
      );
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content:
            payload.message ??
            "Puedo guiarte hacia Marketplace, Workflows, Developers o MIUNIX+.",
        },
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content:
            error instanceof Error
              ? error.message
              : "No pude responder en este momento.",
        },
      ]);
    } finally {
      setIsSending(false);
      window.setTimeout(() => {
        listRef.current?.scrollTo({
          top: listRef.current.scrollHeight,
          behavior: "smooth",
        });
      }, 80);
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      <AnimatePresence>
        {isOpen ? (
          <motion.section
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.96 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="flex h-[min(640px,calc(100vh-7rem))] w-[min(390px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-[1.5rem] border border-white/12 bg-[#0b0b0d]/95 shadow-[0_24px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl"
          >
            <header className="flex items-center justify-between gap-3 border-b border-white/8 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#d9ff00] text-black">
                  <Image
                    src="/brand/miunix-mark.svg"
                    alt="Robot Miunix"
                    width={40}
                    height={40}
                    className="h-10 w-10 rounded-2xl"
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">
                    Asistente Miunix
                  </p>
                  <p className="text-xs text-white/42">
                    {remainingPrompts === null
                      ? "MIUNIX+ activo: runs ilimitados"
                      : `${remainingPrompts} prompts gratis restantes`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-xl text-white/45 transition hover:bg-white/8 hover:text-white"
                aria-label="Cerrar asistente"
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-4">
              <div className="flex flex-col gap-3">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-3 text-sm leading-6 ${
                        message.role === "user"
                          ? "bg-[#d9ff00] text-black"
                          : "border border-white/8 bg-white/[0.05] text-white/76"
                      }`}
                    >
                      {renderMessageContent(message.content)}
                    </div>
                  </div>
                ))}
                {isSending ? (
                  <div className="flex justify-start">
                    <div className="inline-flex items-center gap-2 rounded-2xl border border-white/8 bg-white/[0.05] px-3.5 py-3 text-sm text-white/52">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Pensando...
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="border-t border-white/8 px-4 py-3">
              {messages.length === 1 ? (
                <div className="mb-3 flex flex-wrap gap-2">
                  {starterPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => void sendMessage(prompt)}
                      className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-left text-[11px] text-white/62 transition hover:bg-white/8 hover:text-white"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              ) : null}

              {requiresUpgrade ? (
                <div className="rounded-2xl border border-[#d9ff00]/18 bg-[#d9ff00]/8 px-3 py-3">
                  <p className="text-xs leading-5 text-white/70">
                    Para seguir usando el asistente necesitas MIUNIX+. Los tres
                    planes incluyen runs ilimitados.
                  </p>
                  <Link
                    href="/miunix-plus"
                    className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[#d9ff00] px-3 py-2 text-xs font-semibold text-black"
                  >
                    Ver planes MIUNIX+
                    <Sparkles className="h-3.5 w-3.5" />
                  </Link>
                </div>
              ) : (
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    void sendMessage();
                  }}
                  className="flex items-end gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2"
                >
                  <textarea
                    value={inputValue}
                    onChange={(event) => setInputValue(event.target.value)}
                    rows={1}
                    placeholder="Pregunta que agente necesitas..."
                    className="max-h-24 flex-1 resize-none bg-transparent py-1 text-sm text-white/80 outline-none placeholder:text-white/30"
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        void sendMessage();
                      }
                    }}
                  />
                  <button
                    type="submit"
                    disabled={!inputValue.trim() || isSending}
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[#d9ff00] text-black transition hover:bg-[#e8ff33] disabled:cursor-not-allowed disabled:bg-white/8 disabled:text-white/25"
                    aria-label="Enviar al asistente"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              )}
            </div>
          </motion.section>
        ) : null}
      </AnimatePresence>

      <motion.button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        className="group flex items-center gap-3 rounded-full border border-[#d9ff00]/30 bg-[#d9ff00] px-4 py-3 text-sm font-semibold text-black shadow-[0_18px_45px_rgba(217,255,0,0.25)] transition hover:bg-[#e8ff33]"
        aria-expanded={isOpen}
      >
        <Image
          src="/brand/miunix-mark.svg"
          alt="Robot Miunix"
          width={28}
          height={28}
          className="h-7 w-7 rounded-full border border-black/10"
        />
        <span className="hidden sm:inline">Probar a Miunix</span>
      </motion.button>
    </div>
  );
}
