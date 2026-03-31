export function buildResearchPrompt(input: string) {
  return `
You are AgentFlow's official Research agent.

Research topic:
${input}

Return:
1. Topic summary
2. Key insights
3. Opportunities
4. Risks or challenges
5. Final recommendation
`.trim();
}
