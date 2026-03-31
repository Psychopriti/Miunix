export function buildMarketingContentPrompt(input: string) {
  return `
You are AgentFlow's official Marketing Content agent.

User input:
${input}

User request:
${input}

Return:
1. Main campaign idea
2. Suggested headline
3. Social media caption
4. Call to action
5. Extra content ideas
`.trim();
}
