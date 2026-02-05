import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { callClaude } from "@/lib/claude";
import { buildResumeAnalysisPrompt } from "@/lib/prompts";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { resumeId } = await req.json();
  if (!resumeId) {
    return NextResponse.json({ error: "resumeId is required" }, { status: 400 });
  }

  const resume = await prisma.resume.findFirst({
    where: { id: resumeId, userId: user.id },
  });

  if (!resume) {
    return NextResponse.json({ error: "Resume not found" }, { status: 404 });
  }

  try {
    const prompt = buildResumeAnalysisPrompt(resume.rawText);
    const result = await callClaude(prompt.system, prompt.user);
    const parsed = JSON.parse(result.text);

    await prisma.resume.update({
      where: { id: resumeId },
      data: { parsed: result.text },
    });

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Resume analyze error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Analysis failed" },
      { status: 500 }
    );
  }
}
