export interface SerperResult {
  title: string;
  link: string;
  snippet: string;
  date?: string;
}

interface SerperResponse {
  organic: SerperResult[];
}

export async function webSearch(query: string, numResults = 5): Promise<SerperResult[]> {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) {
    throw new Error("SERPER_API_KEY is not configured");
  }

  const response = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: {
      "X-API-KEY": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ q: query, num: numResults }),
  });

  if (!response.ok) {
    throw new Error(`Serper API error: ${response.status} ${response.statusText}`);
  }

  const data: SerperResponse = await response.json();
  return data.organic || [];
}

export function formatSearchResults(results: SerperResult[]): string {
  if (results.length === 0) return "No search results found.";
  return results
    .map((r, i) => `[${i + 1}] ${r.title}\n${r.snippet}${r.date ? ` (${r.date})` : ""}`)
    .join("\n\n");
}
