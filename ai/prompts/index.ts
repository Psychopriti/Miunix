import { buildLeadGenerationPrompt, buildLeadGenerationSystemPrompt } from "@/ai/prompts/lead-generation";
import {
  buildMarketingContentPrompt,
  buildMarketingContentSystemPrompt,
} from "@/ai/prompts/marketing-content";
import { buildResearchPrompt, buildResearchSystemPrompt } from "@/ai/prompts/research";

const platformPromptBuilders = {
  "lead-generation": {
    buildPrompt: buildLeadGenerationPrompt,
    buildSystemPrompt: buildLeadGenerationSystemPrompt,
  },
  "marketing-content": {
    buildPrompt: buildMarketingContentPrompt,
    buildSystemPrompt: buildMarketingContentSystemPrompt,
  },
  research: {
    buildPrompt: buildResearchPrompt,
    buildSystemPrompt: buildResearchSystemPrompt,
  },
} as const;

export function isPlatformAgentWithBuiltInPrompt(slug: string) {
  return slug in platformPromptBuilders;
}

export function getPlatformAgentPrompt(slug: string, input: string) {
  const builder =
    platformPromptBuilders[slug as keyof typeof platformPromptBuilders];

  if (!builder) {
    return null;
  }

  return builder.buildPrompt(input);
}

export function getPlatformAgentSystemPrompt(slug: string) {
  const builder =
    platformPromptBuilders[slug as keyof typeof platformPromptBuilders];

  if (!builder) {
    return null;
  }

  return builder.buildSystemPrompt();
}
