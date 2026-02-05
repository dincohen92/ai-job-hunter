import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { callClaude } from "@/lib/claude";
import { buildResumeTailoringPrompt } from "@/lib/prompts";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { resumeId, jobId } = await req.json();
  if (!resumeId || !jobId) {
    return NextResponse.json(
      { error: "resumeId and jobId are required" },
      { status: 400 }
    );
  }

  const [resume, job] = await Promise.all([
    prisma.resume.findFirst({ where: { id: resumeId, userId: user.id } }),
    prisma.savedJob.findFirst({ where: { id: jobId, userId: user.id } }),
  ]);

  if (!resume) return NextResponse.json({ error: "Resume not found" }, { status: 404 });
  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

  try {
    const prompt = buildResumeTailoringPrompt(
      resume.rawText,
      job.description,
      job.title,
      job.company
    );
    const result = await callClaude(prompt.system, prompt.user, {
      maxTokens: 4096,
    });
    const parsed = JSON.parse(result.text);

    const tailored = await prisma.tailoredResume.upsert({
      where: {
        resumeId_jobId: { resumeId, jobId },
      },
      create: {
        resumeId,
        jobId,
        tailoredText: parsed.tailoredResume,
        tailoredParsed: result.text,
        matchScore: parsed.matchScore,
        suggestions: JSON.stringify(parsed.suggestions),
      },
      update: {
        tailoredText: parsed.tailoredResume,
        tailoredParsed: result.text,
        matchScore: parsed.matchScore,
        suggestions: JSON.stringify(parsed.suggestions),
      },
    });

    return NextResponse.json({ ...parsed, id: tailored.id });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Tailoring failed" },
      { status: 500 }
    );
  }
}
