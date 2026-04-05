import { tool } from "langchain";
import { z } from "zod";

type ResearchFrameworkName =
  | "market-landscape"
  | "customer-needs"
  | "competitive-positioning"
  | "go-to-market"
  | "risk-assessment"
  | "investment-screen";

function stringify(value: unknown) {
  return JSON.stringify(value, null, 2);
}

const researchFrameworkTool = tool(
  async ({
    topic,
    objective,
    context,
  }: {
    topic: string;
    objective: string;
    context?: string;
  }) => {
    const loweredObjective = objective.toLowerCase();

    const frameworks: ResearchFrameworkName[] = [];

    if (/(compet|rival|alternativ|mercado|competidor)/i.test(loweredObjective)) {
      frameworks.push("competitive-positioning");
    }

    if (/(cliente|customer|buyer|audience|pain|needs)/i.test(loweredObjective)) {
      frameworks.push("customer-needs");
    }

    if (/(gtm|go-to-market|canal|channel|distribution|outreach)/i.test(loweredObjective)) {
      frameworks.push("go-to-market");
    }

    if (/(risk|riesgo|constraint|barrier|compliance|uncertain)/i.test(loweredObjective)) {
      frameworks.push("risk-assessment");
    }

    if (/(invest|pricing|roi|profit|opportunit|expansion)/i.test(loweredObjective)) {
      frameworks.push("investment-screen");
    }

    if (frameworks.length === 0) {
      frameworks.push("market-landscape", "customer-needs", "risk-assessment");
    }

    return stringify({
      topic,
      objective,
      context: context ?? "",
      recommendedFrameworks: frameworks,
      keyQuestions: [
        "What decision will this research directly support?",
        "Which customer, segment, or geography matters most first?",
        "What evidence would change the recommendation materially?",
      ],
      evidenceChecklist: [
        "Demand or pain intensity",
        "Competitive pressure and substitutes",
        "Operational feasibility",
        "Economic upside and downside",
      ],
    });
  },
  {
    name: "research_framework_selector",
    description:
      "Selects the most useful research frameworks, key questions, and evidence checklist for a business research task.",
    schema: z.object({
      topic: z.string().describe("The topic or market being researched."),
      objective: z
        .string()
        .describe("The decision or research objective the user cares about."),
      context: z
        .string()
        .optional()
        .describe("Optional extra context such as geography, audience, or constraints."),
    }),
  },
);

const signalScannerTool = tool(
  async ({
    segment,
    geography,
    motion,
  }: {
    segment: string;
    geography?: string;
    motion?: string;
  }) => {
    const normalizedMotion = motion?.toLowerCase() ?? "general";

    const operationalSignals =
      normalizedMotion.includes("b2b") || normalizedMotion.includes("sales")
        ? [
            "Inbound demand arriving through fragmented channels",
            "Long response-time gaps between inquiry and follow-up",
            "Manual quoting or qualification steps slowing pipeline velocity",
            "Owner-led sales process with weak delegation",
          ]
        : [
            "Repeated customer questions consuming team time",
            "Operational coordination happening in chat instead of systems",
            "Inconsistent service delivery visibility",
            "Growth constrained by manual admin work",
          ];

    return stringify({
      segment,
      geography: geography ?? "not specified",
      motion: motion ?? "general",
      demandSignals: [
        `${segment} already feels workflow pressure when volume increases`,
        `${segment} tends to pay faster when the pain hits revenue, speed, or visibility`,
        `${segment} is more reachable when the decision-maker is still close to operations`,
      ],
      operationalSignals,
      qualifyingSignals: [
        "Multiple handoffs across people or tools",
        "Visible delays, leakage, or rework",
        "A revenue-bearing process depends on human memory",
      ],
    });
  },
  {
    name: "market_signal_scanner",
    description:
      "Produces practical demand, operational, and qualifying signals for a segment or market.",
    schema: z.object({
      segment: z.string().describe("The segment, niche, or company type."),
      geography: z
        .string()
        .optional()
        .describe("Optional geography, country, or region."),
      motion: z
        .string()
        .optional()
        .describe("Optional commercial motion such as B2B, SaaS, services, or outbound."),
    }),
  },
);

const decisionMatrixTool = tool(
  async ({
    options,
    criteria,
  }: {
    options: Array<{ name: string; rationale?: string }>;
    criteria: string[];
  }) => {
    const weighted = options.map((option, index) => {
      const score = Math.max(1, criteria.length * 2 - index);

      return {
        option: option.name,
        rationale: option.rationale ?? "",
        score,
        strengths: criteria.slice(0, Math.min(criteria.length, 3)),
      };
    });

    return stringify({
      criteria,
      ranking: weighted.sort((left, right) => right.score - left.score),
      recommendationRule:
        "Prefer the highest score only if its operational downside is still acceptable; otherwise pick the next-most-robust option.",
    });
  },
  {
    name: "decision_matrix_builder",
    description:
      "Builds a simple option ranking against decision criteria so the agent can make a clearer recommendation.",
    schema: z.object({
      options: z
        .array(
          z.object({
            name: z.string().describe("Name of the strategic option."),
            rationale: z
              .string()
              .optional()
              .describe("Optional short reason this option is under consideration."),
          }),
        )
        .min(2)
        .describe("Options to compare."),
      criteria: z
        .array(z.string())
        .min(2)
        .describe("Decision criteria such as speed, risk, fit, or ROI."),
    }),
  },
);

const leadProfileCanvasTool = tool(
  async ({
    niche,
    geography,
    offer,
  }: {
    niche: string;
    geography?: string;
    offer?: string;
  }) => {
    return stringify({
      niche,
      geography: geography ?? "not specified",
      offer: offer ?? "not specified",
      decisionMakers: [
        "Founder or owner-operator",
        "Commercial or operations manager",
        "GM in companies with growing service complexity",
      ],
      buyingTriggers: [
        "Lead leakage or slow response is visible",
        "Team growth has increased coordination overhead",
        "Current process depends on WhatsApp, spreadsheets, and memory",
      ],
      qualificationFilters: [
        "High enough inquiry volume to justify workflow change",
        "Pain is frequent, not occasional",
        "The buyer can act without a long procurement cycle",
      ],
    });
  },
  {
    name: "lead_profile_canvas",
    description:
      "Generates a concise ICP and decision-maker canvas for lead generation strategy.",
    schema: z.object({
      niche: z.string().describe("The niche or market to target."),
      geography: z.string().optional().describe("Optional target geography."),
      offer: z.string().optional().describe("Optional offer being sold."),
    }),
  },
);

const outreachPlannerTool = tool(
  async ({
    audience,
    channel,
    objective,
  }: {
    audience: string;
    channel: "whatsapp" | "email" | "linkedin";
    objective: string;
  }) => {
    const tones = {
      whatsapp: "short, direct, and conversational",
      email: "clear, credible, and easy to forward internally",
      linkedin: "professional, concise, and low-friction",
    } as const;

    return stringify({
      audience,
      channel,
      objective,
      recommendedTone: tones[channel],
      angleChecklist: [
        "Lead with a concrete operational problem",
        "Translate the offer into business outcomes",
        "Reduce perceived implementation risk",
      ],
      callToActionPatterns: [
        "Quick diagnostic call",
        "Share one workflow example",
        "Ask if the problem is already happening internally",
      ],
    });
  },
  {
    name: "outreach_channel_planner",
    description:
      "Recommends tone, outreach angles, and CTA patterns for WhatsApp, email, or LinkedIn prospecting.",
    schema: z.object({
      audience: z.string().describe("Audience or buyer profile."),
      channel: z
        .enum(["whatsapp", "email", "linkedin"])
        .describe("The outreach channel."),
      objective: z.string().describe("The immediate outreach goal."),
    }),
  },
);

const campaignAngleTool = tool(
  async ({
    offer,
    audience,
    channel,
  }: {
    offer: string;
    audience: string;
    channel?: string;
  }) => {
    return stringify({
      offer,
      audience,
      channel: channel ?? "best-fit channel",
      angles: [
        "Speed-to-outcome angle",
        "Risk-reduction angle",
        "Visibility-and-control angle",
      ],
      proofPrompts: [
        "Why should the audience believe this now?",
        "What objection will block conversion first?",
        "What concrete outcome sounds most credible?",
      ],
    });
  },
  {
    name: "campaign_angle_generator",
    description:
      "Generates positioning angles, proof prompts, and channel framing for a marketing campaign.",
    schema: z.object({
      offer: z.string().describe("The offer or product being marketed."),
      audience: z.string().describe("The target audience."),
      channel: z
        .string()
        .optional()
        .describe("Optional target channel such as landing page, email, or ads."),
    }),
  },
);

const copyChannelSpecTool = tool(
  async ({
    channel,
    goal,
  }: {
    channel: string;
    goal: string;
  }) => {
    return stringify({
      channel,
      goal,
      structure: [
        "Hook with a specific pain or desired outcome",
        "Introduce the offer with differentiation",
        "Handle the main objection before the CTA",
        "Close with one clear next step",
      ],
      optimizationNotes: [
        "Keep the first lines scannable",
        "Prioritize specificity over adjectives",
        "Use one primary CTA unless the channel demands alternatives",
      ],
    });
  },
  {
    name: "copy_channel_specifier",
    description:
      "Returns copy structure and optimization notes for a specific marketing channel and goal.",
    schema: z.object({
      channel: z.string().describe("The content channel or asset type."),
      goal: z.string().describe("The conversion or communication goal."),
    }),
  },
);

const agentToolsBySlug = {
  "lead-generation": [leadProfileCanvasTool, outreachPlannerTool],
  "marketing-content": [campaignAngleTool, copyChannelSpecTool],
  research: [researchFrameworkTool, signalScannerTool, decisionMatrixTool],
} as const;

export function getAgentTools(slug: string) {
  return [...(agentToolsBySlug[slug as keyof typeof agentToolsBySlug] ?? [])];
}
