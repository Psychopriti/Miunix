import { runAgentWithLangChain } from "@/ai/langchain.ts";

const promptsByAgent = {
  "lead-generation": [
    "Necesito 8 empresas reales en Nicaragua que puedan comprar automatizacion para seguimiento comercial por WhatsApp. Prioriza negocios de servicios, evita software, agencias y competidores. Para cada una dame senal observada, problema probable, confidence y URL fuente.",
    "Vendemos automatizacion para pymes que hoy trabajan con WhatsApp y Excel. Dame 3 ICPs realmente diferentes en Nicaragua, con buyer, trigger, dolor operativo y un primer mensaje de outreach por WhatsApp para cada uno.",
  ],
  "marketing-content": [
    "Tenemos un servicio de automatizacion de seguimiento para clinicas dentales. Crea una campana para landing page hero + 5 headlines + CTA. Quiero que el mensaje suene concreto, no generico.",
    "Analiza el angulo de mensaje de HubSpot y Pipedrive para una landing enfocada en pymes de servicios y luego proponme un angulo diferencial para AgentFlow. Incluye framework, copy principal y 5 CTA.",
  ],
  research: [
    "Quiero evaluar si en Nicaragua debemos enfocarnos primero en clinicas, talleres o inmobiliarias para vender automatizacion comercial. Compara las 3 y dime cual atacarias primero y por que.",
    "Investiga el posicionamiento de HubSpot vs Pipedrive vs Zoho para pymes y dime donde hay espacio para una propuesta mas operativa enfocada en seguimiento por WhatsApp y procesos manuales.",
  ],
};

const platformAgents = Object.keys(promptsByAgent);

function createAgent(slug) {
  return {
    id: `test-${slug}`,
    slug,
    name: slug,
    owner_type: "platform",
    owner_profile_id: null,
    prompt_template: null,
    model: null,
    tool_definitions: [],
    is_active: true,
    is_published: true,
    status: "published",
    total_runs: 0,
  };
}

function summarizeOutput(text, limit = 1200) {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= limit) {
    return normalized;
  }

  return `${normalized.slice(0, limit)}...`;
}

async function main() {
  const results = [];

  for (const slug of platformAgents) {
    const agent = createAgent(slug);

    for (const prompt of promptsByAgent[slug]) {
      const startedAt = Date.now();

      try {
        const result = await runAgentWithLangChain(agent, prompt);

        results.push({
          slug,
          prompt,
          durationMs: Date.now() - startedAt,
          toolsAvailable: result.metadata.toolsAvailable,
          toolsUsed: result.metadata.toolsUsed,
          output: summarizeOutput(result.output),
          status: "ok",
        });
      } catch (error) {
        results.push({
          slug,
          prompt,
          durationMs: Date.now() - startedAt,
          status: "error",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  console.log(JSON.stringify(results, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
