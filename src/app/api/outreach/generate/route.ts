import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { callClaude } from "@/lib/claude";
import { buildOutreachEmailPrompt } from "@/lib/prompts";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { jobId, resumeId, recipientName, recipientEmail, tone } = await req.json();

  if (!jobId || !recipientEmail) {
    return NextResponse.json(
      { error: "jobId and recipientEmail are required" },
      { status: 400 }
    );
  }

  const job = await prisma.savedJob.findFirst({
    where: { id: jobId, userId: user.id },
  });
  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

  let resumeSummary = `Candidate interested in ${job.title} at ${job.company}`;
  if (resumeId) {
    const resume = await prisma.resume.findFirst({
      where: { id: resumeId, userId: user.id },
    });
    if (resume) {
      resumeSummary = resume.parsed
        ? JSON.parse(resume.parsed).summary || resume.rawText.slice(0, 500)
        : resume.rawText.slice(0, 500);
    }
  }

  try {
    const prompt = buildOutreachEmailPrompt(
      resumeSummary,
      job.title,
      job.company,
      recipientName || null,
      tone || "professional"
    );
    const result = await callClaude(prompt.system, prompt.user);
    const parsed = JSON.parse(result.text);

    const email = await prisma.email.create({
      data: {
        userId: user.id,
        jobId,
        recipientEmail,
        recipientName: recipientName || null,
        subject: parsed.subject,
        body: parsed.body,
        status: "draft",
      },
    });

    return NextResponse.json({ ...parsed, id: email.id });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Generation failed" },
      { status: 500 }
    );
  }
}
