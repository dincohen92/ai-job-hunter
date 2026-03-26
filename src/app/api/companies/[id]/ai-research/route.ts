import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { callClaude } from "@/lib/claude";
import { buildCompanyResearchPrompt } from "@/lib/prompts";
import { webSearch, formatSearchResults } from "@/lib/web-search";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const company = await prisma.company.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!company) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 });
  }

  try {
    // Run 5 parallel web searches covering different aspects
    const searchQueries = [
      `${company.name} company culture reviews employee Glassdoor 2024 2025`,
      `${company.name} tech stack engineering technologies used`,
      `${company.name} interview process experience questions hiring`,
      `${company.name} salary range compensation software engineers`,
      `${company.name} news layoffs funding growth 2024 2025`,
    ];

    const searchResults = await Promise.allSettled(
      searchQueries.map((q) => webSearch(q, 3))
    );

    const allResults = searchResults
      .filter(
        (r): r is PromiseFulfilledResult<Awaited<ReturnType<typeof webSearch>>> =>
          r.status === "fulfilled"
      )
      .flatMap((r) => r.value);

    const searchContext = formatSearchResults(allResults);

    const prompt = buildCompanyResearchPrompt(
      company.name,
      company.website,
      searchContext,
      company.notes || undefined
    );

    const result = await callClaude(prompt.system, prompt.user, {
      maxTokens: 2048,
      temperature: 0.2,
    });

    const parsed = JSON.parse(result.text);

    // Build update payload with only non-null fields
    const updateData: Record<string, string | number | boolean | null> = {};

    if (parsed.culture) updateData.culture = parsed.culture;
    if (parsed.techStack && Array.isArray(parsed.techStack)) {
      updateData.techStack = JSON.stringify(parsed.techStack);
    }
    if (parsed.interviewProcess) updateData.interviewProcess = parsed.interviewProcess;
    if (parsed.typicalSalaryRange) updateData.salaryRange = parsed.typicalSalaryRange;
    if (parsed.description && !company.description) {
      updateData.description = parsed.description;
    }
    if (parsed.industry && !company.industry) {
      updateData.industry = parsed.industry;
    }
    if (parsed.size && !company.size) {
      updateData.size = parsed.size;
    }
    if (parsed.pros && Array.isArray(parsed.pros)) {
      updateData.pros = JSON.stringify(parsed.pros);
    }

    // Combine cons + redFlags into cons field
    const allCons = [
      ...(Array.isArray(parsed.cons) ? parsed.cons : []),
      ...(Array.isArray(parsed.redFlags)
        ? parsed.redFlags.map((rf: string) => `[Red Flag] ${rf}`)
        : []),
    ];
    if (allCons.length > 0) {
      updateData.cons = JSON.stringify(allCons);
    }

    if (parsed.glassdoorRating && !company.glassdoor) {
      updateData.glassdoor = `Rating: ${parsed.glassdoorRating}/5`;
    }

    const updated = await prisma.company.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      company: updated,
      fieldsUpdated: Object.keys(updateData),
    });
  } catch (error) {
    console.error("AI research error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Research failed" },
      { status: 500 }
    );
  }
}
