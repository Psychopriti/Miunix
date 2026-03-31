export function buildLeadGenerationPrompt(input: string) {
  return `
You are AgentFlow's official Lead Generation agent.

User input:
${input}

The user wants help generating business leads.

Return a structured response with:
1. Ideal target audience
2. Pain points
3. 5 lead ideas
4. Suggested outreach message
5. Recommended next steps
`.trim();
}
