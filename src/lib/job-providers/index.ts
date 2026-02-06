import { JobSearchProvider, JobSearchParams, MultiSearchResult } from "./types";
import { JSearchProvider } from "./jsearch";
import { RemoteOKProvider } from "./remoteok";

export * from "./types";

// Registry of all available providers
const providers: JobSearchProvider[] = [
  new JSearchProvider(),
  new RemoteOKProvider(),
];

export function getProvider(name: string): JobSearchProvider | undefined {
  return providers.find((p) => p.name === name);
}

export function getConfiguredProviders(): JobSearchProvider[] {
  return providers.filter((p) => p.isConfigured());
}

export function getAllProviders(): { name: string; displayName: string; configured: boolean }[] {
  return providers.map((p) => ({
    name: p.name,
    displayName: p.displayName,
    configured: p.isConfigured(),
  }));
}

export async function searchMultipleSources(
  params: JobSearchParams,
  sources?: string[]
): Promise<MultiSearchResult> {
  const configuredProviders = getConfiguredProviders();

  // Filter to requested sources if specified
  const selectedProviders = sources
    ? configuredProviders.filter((p) => sources.includes(p.name))
    : configuredProviders;

  if (selectedProviders.length === 0) {
    return { results: [], errors: [{ source: "all", error: "No job sources configured" }] };
  }

  // Search all sources in parallel
  const searchPromises = selectedProviders.map(async (provider) => {
    try {
      const result = await provider.search(params);
      return { success: true as const, result };
    } catch (error) {
      return {
        success: false as const,
        source: provider.name,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  });

  const outcomes = await Promise.all(searchPromises);

  const results = outcomes
    .filter((o) => o.success)
    .map((o) => (o as { success: true; result: MultiSearchResult["results"][0] }).result);

  const errors = outcomes
    .filter((o) => !o.success)
    .map((o) => ({
      source: (o as { source: string; error: string }).source,
      error: (o as { source: string; error: string }).error,
    }));

  return { results, errors };
}

export function deduplicateJobs(
  results: MultiSearchResult["results"]
): MultiSearchResult["results"][0]["jobs"] {
  const seenJobs = new Map<string, MultiSearchResult["results"][0]["jobs"][0]>();

  for (const result of results) {
    for (const job of result.jobs) {
      // Create a dedup key based on title + company (normalized)
      const key = `${job.title.toLowerCase().trim()}_${job.company.toLowerCase().trim()}`;

      if (!seenJobs.has(key)) {
        seenJobs.set(key, job);
      }
      // If duplicate exists, keep the one with more info (longer description)
      else {
        const existing = seenJobs.get(key)!;
        if (job.description.length > existing.description.length) {
          seenJobs.set(key, job);
        }
      }
    }
  }

  return Array.from(seenJobs.values());
}
