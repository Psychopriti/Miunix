import { tool } from "langchain";
import { z } from "zod";

import {
  extractCompanyPage,
  searchCompanySources,
  searchCompanySourcesAcrossQueries,
} from "@/ai/lead-sourcing";

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

const leadSegmentPrioritizerTool = tool(
  async ({
    segments,
    offer,
    geography,
  }: {
    segments: Array<{
      name: string;
      operationalPain?: string;
      buyer?: string;
    }>;
    offer?: string;
    geography?: string;
  }) => {
    const ranking = segments.map((segment, index) => {
      const reachability = Math.max(5, 9 - index);
      const urgency = Math.max(5, 8 - index);
      const willingnessToPay = Math.max(4, 8 - index);
      const totalScore = reachability + urgency + willingnessToPay;

      return {
        segment: segment.name,
        buyer: segment.buyer ?? "Owner or operations/commercial lead",
        operationalPain:
          segment.operationalPain ??
          "Leads, follow-up, coordination, or quoting depend on manual work",
        score: totalScore,
        whyItCanWinNow: [
          "The buyer is close enough to operations to feel the pain directly",
          "The workflow pain is frequent rather than occasional",
          "The offer can be translated into a clear speed, control, or revenue outcome",
        ],
        redFlags: [
          "Pain is real but too infrequent",
          "Decision-maker is too far from day-to-day operations",
          "Too much customization is needed before value is obvious",
        ],
      };
    });

    return stringify({
      offer: offer ?? "not specified",
      geography: geography ?? "not specified",
      ranking: ranking.sort((left, right) => right.score - left.score),
      scoringGuide: {
        reachability: "How easy it is to reach the decision-maker directly",
        urgency: "How painful and frequent the operational problem feels today",
        willingnessToPay: "How clearly the pain maps to revenue, speed, or visibility",
      },
    });
  },
  {
    name: "lead_segment_prioritizer",
    description:
      "Scores and ranks target segments for outbound lead generation based on reachability, urgency, and buying potential.",
    schema: z.object({
      segments: z
        .array(
          z.object({
            name: z.string().describe("Segment or company type being evaluated."),
            operationalPain: z
              .string()
              .optional()
              .describe("Optional key operational pain the segment likely feels."),
            buyer: z
              .string()
              .optional()
              .describe("Optional likely buyer or decision-maker."),
          }),
        )
        .min(2)
        .describe("Candidate segments to compare."),
      offer: z
        .string()
        .optional()
        .describe("Optional offer or service being sold."),
      geography: z
        .string()
        .optional()
        .describe("Optional country, city, or region."),
    }),
  },
);

const leadPainTranslatorTool = tool(
  async ({
    niche,
    currentWorkflow,
    offer,
  }: {
    niche: string;
    currentWorkflow?: string;
    offer?: string;
  }) => {
    return stringify({
      niche,
      currentWorkflow: currentWorkflow ?? "not specified",
      offer: offer ?? "not specified",
      hiddenOperationalPains: [
        "Follow-up happens late because no one owns the next step clearly",
        "Leads or requests get lost between chat, calls, and spreadsheets",
        "Management sees outcomes late because reporting depends on manual updates",
        "Quoting, scheduling, or qualification slows down when volume increases",
        "Team quality depends too much on who is personally on top of the workflow",
      ],
      businessConsequences: [
        "Slow response reduces conversion probability",
        "Manual handoffs create leakage and rework",
        "Weak visibility makes it hard to manage pipeline or service quality",
        "Growth adds overhead before it adds control",
      ],
      valueTranslation: [
        "Faster first response and follow-up consistency",
        "Less leakage between inquiry, qualification, and next action",
        "Better operational visibility for managers or owners",
        "Less dependence on memory and heroics from one employee",
      ],
    });
  },
  {
    name: "lead_pain_translator",
    description:
      "Translates a niche and current workflow into concrete operational pains, business consequences, and value angles for outbound strategy.",
    schema: z.object({
      niche: z.string().describe("Niche, segment, or company type."),
      currentWorkflow: z
        .string()
        .optional()
        .describe("Optional description of the current workflow or tools."),
      offer: z
        .string()
        .optional()
        .describe("Optional offer or service being sold."),
    }),
  },
);

const webCompanySearchTool = tool(
  async ({
    query,
    limit,
  }: {
    query: string;
    limit?: number;
  }) => {
    const result = await searchCompanySources(query, limit ?? 5);

    return stringify({
      provider: result.provider,
      error: result.error ?? null,
      results: result.results,
    });
  },
  {
    name: "web_company_search",
    description:
      "Searches the web for real companies, directories, and local business pages that match a sourcing query.",
    schema: z.object({
      query: z
        .string()
        .describe("Search query to find real companies or local business listings."),
      limit: z
        .number()
        .int()
        .min(1)
        .max(10)
        .optional()
        .describe("Maximum number of results to return."),
    }),
  },
);

const webPageExtractorTool = tool(
  async ({
    url,
    maxCharacters,
  }: {
    url: string;
    maxCharacters?: number;
  }) => {
    const page = await extractCompanyPage(url, maxCharacters ?? 5000);

    return stringify(page);
  },
  {
    name: "web_page_extractor",
    description:
      "Fetches a web page and extracts its title and main text so the agent can inspect a real company or listing page.",
    schema: z.object({
      url: z.string().url().describe("URL of the page to inspect."),
      maxCharacters: z
        .number()
        .int()
        .min(500)
        .max(12000)
        .optional()
        .describe("Maximum number of text characters to return."),
    }),
  },
);

const multiQueryCompanySearchTool = tool(
  async ({
    queries,
    limitPerQuery,
    maxTotalResults,
  }: {
    queries: string[];
    limitPerQuery?: number;
    maxTotalResults?: number;
  }) => {
    const results = await searchCompanySourcesAcrossQueries(
      queries,
      limitPerQuery ?? 4,
      maxTotalResults ?? 12,
    );

    return stringify({
      queries,
      results,
    });
  },
  {
    name: "multi_query_company_search",
    description:
      "Runs multiple web company searches, deduplicates results, and helps source real companies across several query variants.",
    schema: z.object({
      queries: z
        .array(z.string())
        .min(1)
        .max(8)
        .describe("Multiple search queries to run for sourcing companies."),
      limitPerQuery: z
        .number()
        .int()
        .min(1)
        .max(10)
        .optional()
        .describe("Maximum results per query."),
      maxTotalResults: z
        .number()
        .int()
        .min(1)
        .max(20)
        .optional()
        .describe("Maximum deduplicated results to return overall."),
    }),
  },
);

const companyProspectScorerTool = tool(
  async ({
    companies,
    offer,
    targetGeography,
  }: {
    companies: Array<{
      name: string;
      url?: string;
      signals?: string[];
      businessType?: string;
    }>;
    offer?: string;
    targetGeography?: string;
  }) => {
    const ranking = companies.map((company, index) => {
      const visibleSignals = company.signals ?? [];
      const lowerName = company.name.toLowerCase();
      const lowerSignals = visibleSignals.join(" ").toLowerCase();
      const lowerBusinessType = company.businessType?.toLowerCase() ?? "";
      const url = company.url?.toLowerCase() ?? "";

      const competitorPattern =
        /(crm|chatbot|automatiz|automation|marketing digital|agencia de marketing|software|saas|whatsapp api|mensajes masivos|bulk messaging|contact center platform)/i;
      const operationalBusinessPattern =
        /(clinica|hospital|taller|ferreter|inmobili|agencia de viajes|restaurante|hotel|universidad|colegio|distribuidor|laboratorio|optica|dent|car rental|renta|constructora|servicio)/i;
      const aggregatorPattern =
        /(mapanicaragua|directorio|paginasamarillas|yellowpages|listado|business\.site|facebook\.com\/.*\/posts|instagram\.com)/i;

      const competitorPenalty =
        competitorPattern.test(lowerName) ||
        competitorPattern.test(lowerSignals) ||
        competitorPattern.test(lowerBusinessType)
          ? 28
          : 0;

      const operationalBonus =
        operationalBusinessPattern.test(lowerName) ||
        operationalBusinessPattern.test(lowerSignals) ||
        operationalBusinessPattern.test(lowerBusinessType)
          ? 16
          : 0;

      const aggregatorPenalty = aggregatorPattern.test(url) ? 14 : 0;
      const ownedSourceBonus =
        url && !aggregatorPattern.test(url) && !url.includes("facebook.com")
          ? 8
          : 0;

      const score = Math.max(
        18,
        78 -
          index * 5 +
          visibleSignals.length * 3 +
          operationalBonus +
          ownedSourceBonus -
          competitorPenalty -
          aggregatorPenalty,
      );

      return {
        company: company.name,
        url: company.url ?? null,
        score,
        confidence:
          score >= 82 ? "alta" : score >= 58 ? "media" : "baja",
        whyItMayFit: [
          competitorPenalty > 0
            ? "This company may be adjacent to the solution space, so it is less attractive as a direct prospect"
            : "The business appears reachable through public digital channels",
          operationalBonus > 0
            ? "The business looks like an operational company that may suffer workflow friction in sales, service, quoting, or follow-up"
            : "There are visible operational or commercial workflows that can likely be improved",
          "The company is easier to prioritize when the website or listing shows active demand capture",
        ],
        signalsUsed: visibleSignals,
        prospectType:
          competitorPenalty > 0 ? "adjacent_or_competitor" : "operational_buyer",
        sourceType: aggregatorPattern.test(url)
          ? "directory_or_social"
          : "owned_or_direct_source",
      };
    });

    return stringify({
      offer: offer ?? "not specified",
      targetGeography: targetGeography ?? "not specified",
      ranking: ranking
        .sort((left, right) => right.score - left.score)
        .filter((item) => item.score >= 28),
    });
  },
  {
    name: "company_prospect_scorer",
    description:
      "Ranks real companies for prospecting based on visible signals and probable fit for the offer.",
    schema: z.object({
      companies: z
        .array(
          z.object({
            name: z.string().describe("Company name."),
            url: z.string().optional().describe("Optional company or listing URL."),
            signals: z
              .array(z.string())
              .optional()
              .describe("Observed signals from search results or pages."),
            businessType: z
              .string()
              .optional()
              .describe("Optional business category inferred from the result or page."),
          }),
        )
        .min(1)
        .max(10)
        .describe("Candidate companies to rank."),
      offer: z
        .string()
        .optional()
        .describe("Optional offer being sold."),
      targetGeography: z
        .string()
        .optional()
        .describe("Optional target geography."),
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

const outboundSequenceBuilderTool = tool(
  async ({
    prospect,
    pain,
    offer,
    channels,
  }: {
    prospect: string;
    pain: string;
    offer: string;
    channels?: Array<"whatsapp" | "email" | "linkedin">;
  }) => {
    const selectedChannels = channels?.length ? channels : ["whatsapp", "email"];

    return stringify({
      prospect,
      pain,
      offer,
      sequenceLogic: [
        "Open with a specific workflow pain, not the product.",
        "Make the cost of inaction concrete.",
        "Introduce the offer as a low-friction operational fix.",
        "Ask for a small diagnostic conversation, not a big commitment.",
      ],
      steps: selectedChannels.map((channel, index) => ({
        day: index * 2 + 1,
        channel,
        job: "Start the conversation with a concrete operational observation.",
        messageAngle: `Tie ${pain} to a visible business consequence for ${prospect}.`,
      })),
      objectionHandlers: [
        {
          objection: "Ya lo hacemos manualmente.",
          responseFrame:
            "Acknowledge the workaround, then contrast human effort with consistency, visibility, and response speed.",
        },
        {
          objection: "No tenemos presupuesto.",
          responseFrame:
            "Reframe around leakage, missed appointments, slow follow-up, or owner time before discussing price.",
        },
      ],
    });
  },
  {
    name: "outbound_sequence_builder",
    description:
      "Builds a practical multi-touch outbound sequence with channel logic and objection-handling frames.",
    schema: z.object({
      prospect: z.string().describe("Prospect segment, ICP, or account type."),
      pain: z.string().describe("Core workflow pain to anchor the sequence."),
      offer: z.string().describe("Offer being sold."),
      channels: z
        .array(z.enum(["whatsapp", "email", "linkedin"]))
        .optional()
        .describe("Optional outreach channels to include."),
    }),
  },
);

const qualificationScorecardTool = tool(
  async ({
    segment,
    offer,
    buyingTriggers,
  }: {
    segment: string;
    offer: string;
    buyingTriggers?: string[];
  }) => {
    return stringify({
      segment,
      offer,
      scoringDimensions: [
        {
          name: "Pain frequency",
          weight: 30,
          highSignal:
            "The workflow problem happens daily or weekly and affects revenue, response time, or service quality.",
        },
        {
          name: "Decision access",
          weight: 20,
          highSignal:
            "Owner, gerente, or commercial/operations lead is reachable without long procurement.",
        },
        {
          name: "Economic consequence",
          weight: 25,
          highSignal:
            "The pain creates missed sales, lost appointments, rework, delays, or owner overload.",
        },
        {
          name: "Implementation fit",
          weight: 15,
          highSignal:
            "The current process already uses WhatsApp, forms, spreadsheets, CRM, or manual reminders.",
        },
        {
          name: "Urgency trigger",
          weight: 10,
          highSignal:
            "Growth, new location, high inbound volume, seasonal pressure, or service bottleneck.",
        },
      ],
      buyingTriggers: buyingTriggers ?? [
        "Slow response or missed follow-up is visible",
        "Manual coordination is creating leakage",
        "Owner wants growth without adding admin burden",
      ],
      recommendedDisqualificationRules: [
        "Pain is occasional, not repeated",
        "Buyer cannot name a concrete operational bottleneck",
        "The offer would require heavy custom work before value is visible",
      ],
    });
  },
  {
    name: "qualification_scorecard",
    description:
      "Creates a weighted qualification scorecard for ICPs, segments, or accounts.",
    schema: z.object({
      segment: z.string().describe("Target segment or account type."),
      offer: z.string().describe("Offer being sold."),
      buyingTriggers: z
        .array(z.string())
        .optional()
        .describe("Optional buying triggers already identified."),
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

const offerOutcomeMapperTool = tool(
  async ({
    offer,
    audience,
    currentSituation,
  }: {
    offer: string;
    audience: string;
    currentSituation?: string;
  }) => {
    return stringify({
      offer,
      audience,
      currentSituation: currentSituation ?? "not specified",
      likelyBuyerJobs: [
        "Reduce friction in a revenue-bearing workflow",
        "Improve speed, visibility, or consistency in execution",
        "Get results without adding coordination overhead",
      ],
      outcomeTranslation: [
        "Faster response or turnaround time",
        "Fewer manual handoffs and copy-paste steps",
        "More control and visibility for the team or owner",
        "Less leakage between inquiry, action, and follow-up",
      ],
      proofAngles: [
        "What changes in the team's day-to-day workflow",
        "What bottleneck gets removed first",
        "Why this is easier to adopt than the status quo",
      ],
      objectionPatterns: [
        "This sounds useful but hard to implement",
        "We already handle this manually well enough",
        "I am not sure the problem is large enough to prioritize",
      ],
    });
  },
  {
    name: "offer_outcome_mapper",
    description:
      "Translates an offer into concrete buyer jobs, outcomes, proof angles, and likely objections.",
    schema: z.object({
      offer: z.string().describe("The offer, product, or service being positioned."),
      audience: z.string().describe("The target audience or buyer profile."),
      currentSituation: z
        .string()
        .optional()
        .describe("Optional current workflow, pain, or status quo context."),
    }),
  },
);

const messagingEvidenceExtractorTool = tool(
  async ({
    sourceName,
    sourceText,
    audience,
  }: {
    sourceName: string;
    sourceText: string;
    audience?: string;
  }) => {
    const normalizedAudience = audience ?? "not specified";
    const excerpt = sourceText.slice(0, 3500);

    return stringify({
      sourceName,
      audience: normalizedAudience,
      evidenceSummary: [
        "Core promise and positioning signals visible in the source",
        "Proof, trust, or credibility signals explicitly present",
        "Likely CTA path or conversion intent suggested by the copy",
      ],
      extractionHeuristics: [
        `Review this source through the lens of ${normalizedAudience}`,
        "Separate explicit claims from implied messaging",
        "Flag where the message is strong, generic, or missing proof",
      ],
      sourceExcerpt: excerpt,
    });
  },
  {
    name: "messaging_evidence_extractor",
    description:
      "Structures evidence from a landing page, ad, or competitor copy so the agent can analyze messaging more rigorously.",
    schema: z.object({
      sourceName: z.string().describe("Name of the company, page, or asset being analyzed."),
      sourceText: z
        .string()
        .describe("Raw text extracted from the page or provided by the user."),
      audience: z
        .string()
        .optional()
        .describe("Optional audience used to interpret the messaging."),
    }),
  },
);

const competitiveGapAnalyzerTool = tool(
  async ({
    subject,
    competitors,
    focus,
  }: {
    subject: string;
    competitors: Array<{
      name: string;
      positioning?: string;
      strengths?: string[];
    }>;
    focus?: string;
  }) => {
    return stringify({
      subject,
      focus: focus ?? "general positioning",
      competitors: competitors.map((competitor) => ({
        name: competitor.name,
        positioning: competitor.positioning ?? "not specified",
        strengths: competitor.strengths ?? [],
      })),
      whitespaceOpportunities: [
        "A sharper promise tied to a specific workflow outcome",
        "A clearer proof path instead of generic value claims",
        "A more specific buyer or use-case focus",
      ],
      comparisonQuestions: [
        "What does each competitor appear to optimize for first?",
        "Which claims sound common across the category?",
        "Where is the clearest opportunity to sound more concrete or more credible?",
      ],
    });
  },
  {
    name: "competitive_gap_analyzer",
    description:
      "Finds positioning white space, generic category claims, and strategic differentiation opportunities across competitors.",
    schema: z.object({
      subject: z.string().describe("The product, offer, or company being positioned."),
      competitors: z
        .array(
          z.object({
            name: z.string().describe("Competitor name."),
            positioning: z
              .string()
              .optional()
              .describe("Optional observed positioning or tagline."),
            strengths: z
              .array(z.string())
              .optional()
              .describe("Optional observed strengths or themes."),
          }),
        )
        .min(1)
        .max(8)
        .describe("Competitors to compare."),
      focus: z
        .string()
        .optional()
        .describe("Optional focus such as pricing, messaging, GTM, or differentiation."),
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

const creativeTestingMatrixTool = tool(
  async ({
    campaignConcept,
    audience,
    channels,
  }: {
    campaignConcept: string;
    audience: string;
    channels?: string[];
  }) => {
    const selectedChannels = channels?.length
      ? channels
      : ["Meta Ads", "Landing page", "Email"];

    return stringify({
      campaignConcept,
      audience,
      testPlan: selectedChannels.map((channel) => ({
        channel,
        hypotheses: [
          "Pain-led messaging will outperform feature-led messaging when the buyer already feels operational friction.",
          "Risk-reduction proof will improve conversion when the buyer fears implementation complexity.",
          "Outcome-specific CTAs will outperform generic demo CTAs in early tests.",
        ],
        variablesToTest: [
          "Hook mechanism",
          "Proof angle",
          "CTA commitment level",
          "Visual framing",
        ],
      })),
      decisionRules: [
        "Keep tests focused on one major variable at a time.",
        "Winner is not only CTR; look for qualified replies, booked calls, or high-intent actions.",
        "Kill angles that attract curiosity but not buying intent.",
      ],
    });
  },
  {
    name: "creative_testing_matrix",
    description:
      "Builds a campaign testing matrix with hypotheses, variables, and decision rules across channels.",
    schema: z.object({
      campaignConcept: z.string().describe("Core campaign concept or promise."),
      audience: z.string().describe("Target audience."),
      channels: z.array(z.string()).optional().describe("Optional channels to test."),
    }),
  },
);

const brandVoiceCalibratorTool = tool(
  async ({
    brand,
    audience,
    desiredPerception,
  }: {
    brand: string;
    audience: string;
    desiredPerception?: string;
  }) => {
    return stringify({
      brand,
      audience,
      desiredPerception:
        desiredPerception ?? "credible, direct, helpful, and commercially sharp",
      voiceRules: [
        "Sound like an operator who understands the buyer's workflow.",
        "Use concrete outcomes instead of motivational language.",
        "Avoid hype unless the proof and category context justify it.",
        "Make CTAs feel easy to accept and aligned to awareness level.",
      ],
      phraseBank: {
        useMore: [
          "responder mas rapido",
          "evitar fugas de seguimiento",
          "tener visibilidad del proceso",
          "menos trabajo manual para el equipo",
        ],
        avoid: [
          "transforma tu negocio",
          "desbloquea el crecimiento",
          "solucion revolucionaria",
          "automatizacion inteligente sin contexto",
        ],
      },
    });
  },
  {
    name: "brand_voice_calibrator",
    description:
      "Defines voice rules, phrase guidance, and tone calibration for campaign copy.",
    schema: z.object({
      brand: z.string().describe("Brand, offer, or product name."),
      audience: z.string().describe("Target audience."),
      desiredPerception: z
        .string()
        .optional()
        .describe("How the brand should be perceived."),
    }),
  },
);

const visualAssetCreatorTool = tool(
  async ({
    campaignGoal,
    audience,
    format,
    visualDirection,
  }: {
    campaignGoal: string;
    audience: string;
    format?: string;
    visualDirection?: string;
  }) => {
    const productionPrompt = [
      `Create a polished marketing image for: ${campaignGoal}.`,
      `Audience: ${audience}.`,
      visualDirection
        ? `Visual direction: ${visualDirection}.`
        : "Visual direction: modern, credible, conversion-focused, with clear subject hierarchy.",
      "Use a clean composition, strong focal point, realistic lighting, and enough negative space for headline placement.",
      "Avoid fake logos, unreadable text, exaggerated claims, and cluttered UI fragments.",
      "Do not include readable text inside the image unless it is minimal and generic.",
    ].join(" ");

      return stringify({
        assetType: format ?? "campaign image",
        campaignGoal,
        audience,
        status: "image_prompt_ready",
        productionPrompt,
        artDirection: {
          composition: "Primary subject or product context in the center, supporting visual signals around it.",
        palette: "Use brand-aware contrast instead of a one-color wash.",
        copySpace: "Leave safe space for headline, CTA, or campaign label.",
      },
      variants: [
        "Hero visual for landing page",
        "Square social ad",
        "Wide banner for email or web",
      ],
    });
  },
      {
        name: "visual_asset_creator",
        description:
          "Creates a production-ready image prompt and art direction. The runtime generates the actual image after the final answer to avoid passing base64 through the language model.",
    schema: z.object({
      campaignGoal: z.string().describe("The campaign goal or offer to visualize."),
      audience: z.string().describe("The audience the image must persuade."),
      format: z
        .string()
        .optional()
        .describe("Optional image format such as hero, social ad, banner, or product mockup."),
      visualDirection: z
        .string()
        .optional()
        .describe("Optional desired style, subject, or art direction."),
    }),
  },
);

const researchDocumentBuilderTool = tool(
  async ({
    title,
    objective,
    audience,
    sections,
    evidenceNotes,
  }: {
    title: string;
    objective: string;
    audience?: string;
    sections?: string[];
    evidenceNotes?: string[];
  }) => {
    const normalizedSections =
      sections && sections.length > 0
        ? sections
        : [
            "Executive summary",
            "Evidence and observations",
            "Analysis",
            "Recommendation",
            "Next questions",
          ];

    return stringify({
      documentType: "research_memo",
      status: "document_outline_ready",
      title,
      objective,
      audience: audience ?? "decision-maker",
      markdownTemplate: [
        `# ${title}`,
        "",
        `**Objective:** ${objective}`,
        `**Audience:** ${audience ?? "decision-maker"}`,
        "",
        ...normalizedSections.flatMap((section) => [
          `## ${section}`,
          "- Key point:",
          "- Supporting evidence:",
          "- Decision implication:",
          "",
        ]),
      ].join("\n"),
      evidenceNotes: evidenceNotes ?? [],
      qualityChecklist: [
        "Separate observed evidence from inference.",
        "Make the recommendation explicit.",
        "Name the uncertainties that could change the conclusion.",
      ],
    });
  },
  {
    name: "research_document_builder",
    description:
      "Creates a structured markdown research document outline or memo template for a decision-ready research deliverable.",
    schema: z.object({
      title: z.string().describe("Document title."),
      objective: z.string().describe("Decision or research objective."),
      audience: z.string().optional().describe("Who will use the document."),
      sections: z
        .array(z.string())
        .optional()
        .describe("Optional document sections requested by the user."),
      evidenceNotes: z
        .array(z.string())
        .optional()
        .describe("Optional observed evidence or notes to preserve in the document."),
    }),
  },
);

const assumptionRiskMapTool = tool(
  async ({
    decision,
    assumptions,
  }: {
    decision: string;
    assumptions: string[];
  }) => {
    return stringify({
      decision,
      assumptionMap: assumptions.map((assumption, index) => ({
        assumption,
        criticality: index < 2 ? "high" : "medium",
        failureMode:
          "If this assumption is wrong, the recommendation may overestimate urgency, feasibility, or willingness to pay.",
        validationMethod:
          "Validate through customer interviews, observed workflow evidence, search/source evidence, or a small market test.",
      })),
      recommendationRule:
        "Prioritize validating assumptions that combine high uncertainty with high consequence.",
    });
  },
  {
    name: "assumption_risk_mapper",
    description:
      "Maps critical assumptions, failure modes, and validation methods for a strategic decision.",
    schema: z.object({
      decision: z.string().describe("Decision being evaluated."),
      assumptions: z
        .array(z.string())
        .min(1)
        .describe("Important assumptions behind the decision."),
    }),
  },
);

const evidenceConfidenceLadderTool = tool(
  async ({
    claims,
  }: {
    claims: Array<{ claim: string; evidence?: string }>;
  }) => {
    return stringify({
      claims: claims.map((item) => {
        const hasEvidence = Boolean(item.evidence?.trim());

        return {
          claim: item.claim,
          evidence: item.evidence ?? "not provided",
          confidence: hasEvidence ? "medium" : "low",
          upgradePath: hasEvidence
            ? "Confirm with a second source or direct customer signal."
            : "Find a source, customer quote, observed page, pricing signal, or workflow example.",
        };
      }),
      rule:
        "Do not let low-confidence claims drive the final recommendation unless they are framed as hypotheses.",
    });
  },
  {
    name: "evidence_confidence_ladder",
    description:
      "Grades claims by evidence confidence and names what would improve confidence.",
    schema: z.object({
      claims: z
        .array(
          z.object({
            claim: z.string().describe("Claim or insight to grade."),
            evidence: z.string().optional().describe("Evidence supporting the claim."),
          }),
        )
        .min(1),
    }),
  },
);

const agentToolsBySlug = {
  "lead-generation": [
    leadProfileCanvasTool,
    leadSegmentPrioritizerTool,
    leadPainTranslatorTool,
    offerOutcomeMapperTool,
    signalScannerTool,
    decisionMatrixTool,
    outreachPlannerTool,
    outboundSequenceBuilderTool,
    qualificationScorecardTool,
    webCompanySearchTool,
    multiQueryCompanySearchTool,
    webPageExtractorTool,
    companyProspectScorerTool,
  ],
  "marketing-content": [
    campaignAngleTool,
    copyChannelSpecTool,
    offerOutcomeMapperTool,
    messagingEvidenceExtractorTool,
    competitiveGapAnalyzerTool,
    creativeTestingMatrixTool,
    brandVoiceCalibratorTool,
    signalScannerTool,
    webCompanySearchTool,
    webPageExtractorTool,
    multiQueryCompanySearchTool,
    visualAssetCreatorTool,
  ],
  research: [
    researchFrameworkTool,
    signalScannerTool,
    decisionMatrixTool,
    competitiveGapAnalyzerTool,
    messagingEvidenceExtractorTool,
    webCompanySearchTool,
    webPageExtractorTool,
    multiQueryCompanySearchTool,
    researchDocumentBuilderTool,
    assumptionRiskMapTool,
    evidenceConfidenceLadderTool,
  ],
} as const;

export function getAgentTools(slug: string) {
  return [...(agentToolsBySlug[slug as keyof typeof agentToolsBySlug] ?? [])];
}
