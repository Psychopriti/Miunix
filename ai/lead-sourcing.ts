import { getServerEnv } from "@/lib/env/server";

type SearchResult = {
  title: string;
  url: string;
  snippet: string;
};

function getOptionalEnv(name: keyof NodeJS.ProcessEnv) {
  const value = process.env[name];
  return value?.trim() ? value.trim() : null;
}

export function hasConfiguredSearchProvider() {
  return Boolean(
    getOptionalEnv("SERPER_API_KEY") || getOptionalEnv("TAVILY_API_KEY"),
  );
}

function stripHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeUrl(candidate: string) {
  try {
    return new URL(candidate).toString();
  } catch {
    return null;
  }
}

async function searchWithSerper(query: string, limit: number) {
  const apiKey = getOptionalEnv("SERPER_API_KEY");

  if (!apiKey) {
    return null;
  }

  const response = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": apiKey,
    },
    body: JSON.stringify({
      q: query,
      num: limit,
      gl: "ni",
      hl: "es",
    }),
  });

  if (!response.ok) {
    throw new Error(`Serper search failed with status ${response.status}.`);
  }

  const payload = (await response.json()) as {
    organic?: Array<{
      title?: string;
      link?: string;
      snippet?: string;
    }>;
  };

  return (payload.organic ?? [])
    .map((item) => {
      const url = typeof item.link === "string" ? normalizeUrl(item.link) : null;

      if (!url) {
        return null;
      }

      return {
        title: item.title?.trim() || url,
        url,
        snippet: item.snippet?.trim() || "",
      } satisfies SearchResult;
    })
    .filter((item): item is SearchResult => item !== null)
    .slice(0, limit);
}

async function searchWithTavily(query: string, limit: number) {
  const apiKey = getOptionalEnv("TAVILY_API_KEY");

  if (!apiKey) {
    return null;
  }

  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      max_results: limit,
      topic: "general",
      search_depth: "basic",
      include_answer: false,
      include_raw_content: false,
    }),
  });

  if (!response.ok) {
    throw new Error(`Tavily search failed with status ${response.status}.`);
  }

  const payload = (await response.json()) as {
    results?: Array<{
      title?: string;
      url?: string;
      content?: string;
    }>;
  };

  return (payload.results ?? [])
    .map((item) => {
      const url = typeof item.url === "string" ? normalizeUrl(item.url) : null;

      if (!url) {
        return null;
      }

      return {
        title: item.title?.trim() || url,
        url,
        snippet: item.content?.trim() || "",
      } satisfies SearchResult;
    })
    .filter((item): item is SearchResult => item !== null)
    .slice(0, limit);
}

async function searchWithDuckDuckGo(query: string, limit: number) {
  const response = await fetch(
    `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`,
    {
      headers: {
        "User-Agent": "Mozilla/5.0 Miunix/1.0",
      },
    },
  );

  if (!response.ok) {
    throw new Error(
      `DuckDuckGo search failed with status ${response.status}.`,
    );
  }

  const html = await response.text();
  const results: SearchResult[] = [];
  const resultRegex =
    /<a[^>]*class="[^"]*result__a[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?(?:<a[^>]*class="[^"]*result__snippet[^"]*"[^>]*>|<div[^>]*class="[^"]*result__snippet[^"]*"[^>]*>)([\s\S]*?)(?:<\/a>|<\/div>)/gi;

  for (const match of html.matchAll(resultRegex)) {
    const url = normalizeUrl(match[1] ?? "");

    if (!url) {
      continue;
    }

    results.push({
      title: stripHtml(match[2] ?? "") || url,
      url,
      snippet: stripHtml(match[3] ?? ""),
    });

    if (results.length >= limit) {
      break;
    }
  }

  return results;
}

export async function searchCompanySources(query: string, limit = 5) {
  const normalizedLimit = Math.max(1, Math.min(limit, 10));

  try {
    const serperResults = await searchWithSerper(query, normalizedLimit);

    if (serperResults && serperResults.length > 0) {
      return {
        provider: "serper",
        results: serperResults,
      };
    }

    const tavilyResults = await searchWithTavily(query, normalizedLimit);

    if (tavilyResults && tavilyResults.length > 0) {
      return {
        provider: "tavily",
        results: tavilyResults,
      };
    }

    const duckResults = await searchWithDuckDuckGo(query, normalizedLimit);

    return {
      provider: "duckduckgo",
      results: duckResults,
    };
  } catch (error) {
    return {
      provider: "error",
      results: [] satisfies SearchResult[],
      error: error instanceof Error ? error.message : "Search failed.",
    };
  }
}

export async function searchCompanySourcesAcrossQueries(
  queries: string[],
  limitPerQuery = 5,
  maxTotalResults = 12,
) {
  const seenUrls = new Set<string>();
  const aggregated: Array<
    SearchResult & {
      query: string;
      provider: string;
    }
  > = [];

  for (const rawQuery of queries) {
    const query = rawQuery.trim();

    if (!query) {
      continue;
    }

    const searchResult = await searchCompanySources(query, limitPerQuery);

    for (const result of searchResult.results) {
      if (seenUrls.has(result.url)) {
        continue;
      }

      seenUrls.add(result.url);
      aggregated.push({
        ...result,
        query,
        provider: searchResult.provider,
      });

      if (aggregated.length >= maxTotalResults) {
        return aggregated;
      }
    }
  }

  return aggregated;
}

export async function extractCompanyPage(
  url: string,
  maxCharacters = 5000,
) {
  const normalizedUrl = normalizeUrl(url);

  if (!normalizedUrl) {
    throw new Error("Invalid URL.");
  }

  getServerEnv();

  const response = await fetch(normalizedUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 Miunix/1.0",
      Accept: "text/html,application/xhtml+xml",
    },
  });

  if (!response.ok) {
    throw new Error(`Page fetch failed with status ${response.status}.`);
  }

  const html = await response.text();
  const text = stripHtml(html).slice(0, Math.max(500, maxCharacters));
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);

  return {
    url: normalizedUrl,
    title: titleMatch ? stripHtml(titleMatch[1]) : normalizedUrl,
    text,
  };
}
