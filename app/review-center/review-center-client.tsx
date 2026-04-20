"use client";

import { motion } from "motion/react";

// ─── Types ────────────────────────────────────────────────────────────────────

type ReviewAction = {
  label: string;
  value: "ready_for_review" | "in_review" | "changes_requested" | "approved";
};

type LatestRunEntry = {
  agentId: string;
  run: {
    status: string;
    created_at: string;
    input_data: unknown;
    output_data: unknown;
  };
};

type QueueAgent = {
  id: string;
  name: string;
  short_description: string | null;
  description: string | null;
  review_status: string;
  last_test_run_status: string;
  toolCount: number;
  model: string;
  pricing_type: string;
  price: string | null;
  developerName: string;
};

type ReviewCenterClientProps = {
  queue: QueueAgent[];
  latestRunsArray: LatestRunEntry[];
  message?: string;
  messageType?: "success" | "error";
  runReviewTestAction: (formData: FormData) => Promise<void>;
  updateReviewStatusAction: (formData: FormData) => Promise<void>;
  deleteApprovedAgentAction: (formData: FormData) => Promise<void>;
};

// ─── Static data ──────────────────────────────────────────────────────────────

const reviewActions: ReviewAction[] = [
  { label: "Ready", value: "ready_for_review" },
  { label: "In Review", value: "in_review" },
  { label: "Changes", value: "changes_requested" },
  { label: "Approve", value: "approved" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getJsonTextValue(value: unknown, key: "sample_input" | "text" | "error") {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const candidate = (value as Record<string, unknown>)[key];
  return typeof candidate === "string" ? candidate : null;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ReviewCenterClient({
  queue,
  latestRunsArray,
  message,
  messageType,
  runReviewTestAction,
  updateReviewStatusAction,
  deleteApprovedAgentAction,
}: ReviewCenterClientProps) {
  // Reconstruir el Map desde el array serializado
  const latestRuns = new Map(latestRunsArray.map(({ agentId, run }) => [agentId, run]));

  return (
    <section className="flex flex-1 flex-col gap-8 pb-6 pt-10 sm:pt-14">

      {/* ── Hero banner ── */}
      <motion.div
        initial={{ opacity: 0, y: 22, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="rounded-[1.8rem] border border-white/10 bg-[linear-gradient(120deg,#d9ff00_0%,#dff0ab_30%,#8f90ff_100%)] px-6 py-7 text-black shadow-[0_20px_55px_rgba(0,0,0,0.24)]"
      >
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="text-xs uppercase tracking-[0.28em] text-black/55"
        >
          Review Center
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="mt-3 max-w-4xl text-balance text-[2.4rem] font-medium leading-[0.95] tracking-[-0.06em] sm:text-[3.6rem]"
        >
          Revisa las solicitudes enviadas por developers
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.32, duration: 0.45 }}
          className="mt-4 max-w-2xl text-sm leading-6 text-black/72 sm:text-base"
        >
          Cuando un agente pasa a aprobado se publica automaticamente en el marketplace.
        </motion.p>
      </motion.div>

      {/* ── Toast de feedback ── */}
      {message ? (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className={`rounded-[1rem] border px-4 py-3 text-sm ${
            messageType === "error"
              ? "border-[#ff7a7a]/30 bg-[#3a1111] text-[#ffd0d0]"
              : "border-[#d9ff00]/20 bg-[#11190a] text-[#e9ff9a]"
          }`}
        >
          {message}
        </motion.div>
      ) : null}

      {/* ── Queue section ── */}
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="rounded-[1.6rem] border border-white/10 bg-white/[0.03] px-5 py-5"
      >
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-white/45">
              Cola de revision
            </p>
            <h2 className="mt-3 text-2xl font-medium tracking-[-0.04em] text-white">
              Solicitudes activas
            </h2>
          </div>
          <p className="text-sm text-white/55">
            {queue.length} solicitud{queue.length === 1 ? "" : "es"}
          </p>
        </div>

        <div className="mt-6 space-y-4">
          {queue.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.4 }}
              className="rounded-[1.2rem] border border-dashed border-white/12 bg-white/[0.02] px-5 py-6 text-sm leading-6 text-white/58"
            >
              No hay agentes en cola de revision.
            </motion.div>
          ) : (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                visible: { transition: { staggerChildren: 0.09, delayChildren: 0.55 } },
                hidden: {},
              }}
              className="space-y-4"
            >
              {queue.map((agent) => {
                const latestRun = latestRuns.get(agent.id);
                const latestOutput = latestRun
                  ? getJsonTextValue(latestRun.output_data, "text")
                  : null;
                const latestError = latestRun
                  ? getJsonTextValue(latestRun.output_data, "error")
                  : null;
                const latestInput = latestRun
                  ? getJsonTextValue(latestRun.input_data, "sample_input")
                  : null;

                return (
                  <motion.article
                    key={agent.id}
                    variants={{
                      hidden: { opacity: 0, y: 18 },
                      visible: { opacity: 1, y: 0, transition: { duration: 0.42 } },
                    }}
                    className="rounded-[1.2rem] border border-white/10 bg-[#0d0d0d] px-5 py-5 shadow-[0_16px_36px_rgba(0,0,0,0.18)]"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      {/* Left: agent info + test form */}
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-medium text-white">{agent.name}</h3>
                          <span className="rounded-full bg-white/8 px-2.5 py-1 text-[0.65rem] uppercase tracking-[0.16em] text-white/65">
                            {agent.review_status.replaceAll("_", " ")}
                          </span>
                          <span
                            className={`rounded-full px-2.5 py-1 text-[0.65rem] uppercase tracking-[0.16em] ${
                              agent.last_test_run_status === "passed"
                                ? "bg-[#d9ff00]/14 text-[#d9ff00]"
                                : agent.last_test_run_status === "failed"
                                  ? "bg-[#ff7a7a]/12 text-[#ffb0b0]"
                                  : "bg-white/8 text-white/60"
                            }`}
                          >
                            test {agent.last_test_run_status}
                          </span>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-white/65">
                          {agent.short_description ?? "Sin descripcion corta."}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-4 text-xs uppercase tracking-[0.16em] text-white/35">
                          <span>by {agent.developerName}</span>
                          <span>{agent.toolCount} tools</span>
                          <span>{agent.model}</span>
                          <span>
                            {agent.pricing_type === "free" ? "gratis" : `$${agent.price}`}
                          </span>
                        </div>
                        <p className="mt-4 max-w-3xl text-sm leading-6 text-white/58">
                          {agent.description ?? "Sin descripcion completa."}
                        </p>

                        <form action={runReviewTestAction} className="mt-4 space-y-3">
                          <input type="hidden" name="agentId" value={agent.id} />
                          <label className="block max-w-3xl">
                            <span className="mb-2 block text-xs uppercase tracking-[0.22em] text-white/45">
                              Input de prueba para revision
                            </span>
                            <textarea
                              required
                              name="sampleInput"
                              rows={4}
                              defaultValue={latestInput ?? ""}
                              className="w-full rounded-[1rem] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/28 focus:border-[#8f90ff]"
                              placeholder="Escribe aqui la prueba que quieres correr contra el agente."
                            />
                          </label>
                          <motion.button
                            type="submit"
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.96 }}
                            className="rounded-full border border-white/14 px-4 py-2 text-sm text-white/82 transition hover:border-white/24 hover:bg-white/6"
                          >
                            Probar agente
                          </motion.button>
                        </form>

                        {latestRun ? (
                          <div className="mt-4 max-w-3xl rounded-[1rem] border border-white/10 bg-white/[0.03] px-4 py-4">
                            <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.16em] text-white/42">
                              <span>ultimo test</span>
                              <span>{latestRun.status}</span>
                              <span>
                                {new Date(latestRun.created_at).toLocaleString("es-NI")}
                              </span>
                            </div>
                            <p className="mt-3 text-xs uppercase tracking-[0.18em] text-white/42">
                              Resultado
                            </p>
                            <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap rounded-[0.9rem] bg-black/18 px-4 py-3 text-sm leading-6 text-white/78">
                              {latestOutput ?? latestError ?? "Sin salida registrada."}
                            </pre>
                          </div>
                        ) : null}
                      </div>

                      {/* Right: action buttons */}
                      <div className="grid gap-2 sm:grid-cols-2">
                        {reviewActions.map((action) => (
                          <form key={action.value} action={updateReviewStatusAction}>
                            <input type="hidden" name="agentId" value={agent.id} />
                            <input type="hidden" name="status" value={action.value} />
                            <motion.button
                              type="submit"
                              whileHover={{ scale: 1.04 }}
                              whileTap={{ scale: 0.95 }}
                              className={`w-full rounded-full border px-4 py-2 text-sm transition ${
                                action.value === "approved"
                                  ? "border-[#d9ff00]/25 bg-[#d9ff00] font-medium text-black hover:bg-[#e5ff45]"
                                  : action.value === "changes_requested"
                                    ? "border-[#ff7a7a]/25 bg-[#341616] text-[#ffd0d0] hover:bg-[#441b1b]"
                                    : "border-white/14 text-white/82 hover:border-white/24 hover:bg-white/6"
                              }`}
                            >
                              {action.label}
                            </motion.button>
                          </form>
                        ))}
                        {agent.review_status === "approved" ? (
                          <form action={deleteApprovedAgentAction}>
                            <input type="hidden" name="agentId" value={agent.id} />
                            <motion.button
                              type="submit"
                              whileHover={{ scale: 1.04 }}
                              whileTap={{ scale: 0.95 }}
                              className="w-full rounded-full border border-[#ff7a7a]/25 bg-[#341616] px-4 py-2 text-sm text-[#ffd0d0] transition hover:bg-[#441b1b]"
                            >
                              Delete
                            </motion.button>
                          </form>
                        ) : null}
                      </div>
                    </div>
                  </motion.article>
                );
              })}
            </motion.div>
          )}
        </div>
      </motion.section>
    </section>
  );
}
