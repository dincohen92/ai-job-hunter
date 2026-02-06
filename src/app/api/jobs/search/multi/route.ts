import { NextRequest, NextResponse } from "next/server";
import { searchMultipleSources, deduplicateJobs } from "@/lib/job-providers";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  const sources = searchParams.get("sources")?.split(",").filter(Boolean);
  const page = parseInt(searchParams.get("page") || "1");
  const location = searchParams.get("location") || undefined;
  const remote = searchParams.get("remote") === "true";
  const dedupe = searchParams.get("dedupe") !== "false";

  if (!query) {
    return NextResponse.json(
      { error: "Search query is required" },
      { status: 400 }
    );
  }

  try {
    const result = await searchMultipleSources(
      { query, location, remote, page, limit: 10 },
      sources
    );

    // Optionally deduplicate results across sources
    const jobs = dedupe
      ? deduplicateJobs(result.results)
      : result.results.flatMap((r) => r.jobs);

    return NextResponse.json({
      jobs,
      sources: result.results.map((r) => ({
        name: r.source,
        count: r.jobs.length,
        hasMore: r.hasMore,
      })),
      errors: result.errors,
      page,
      totalJobs: jobs.length,
    });
  } catch (error) {
    console.error("Multi-source search error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Search failed" },
      { status: 500 }
    );
  }
}
