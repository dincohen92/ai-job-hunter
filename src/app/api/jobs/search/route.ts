import { NextResponse } from "next/server";
import { searchJobs } from "@/lib/jsearch";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");

    if (!query) {
      return NextResponse.json(
        { error: "Search query is required" },
        { status: 400 }
      );
    }

    const result = await searchJobs({
      query,
      page: Number(searchParams.get("page")) || 1,
      datePosted: searchParams.get("datePosted") || undefined,
      remoteOnly: searchParams.get("remote") === "true",
      employmentType: searchParams.get("type") || undefined,
      jobRequirements: searchParams.get("experience") || undefined,
      radius: Number(searchParams.get("radius")) || undefined,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Job search error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Search failed" },
      { status: 500 }
    );
  }
}
