import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { callClaude } from "@/lib/claude";
import { buildInterviewQuestionsPrompt } from "@/lib/prompts";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const interview = await prisma.interview.findFirst({
    where: { id },
    include: {
      application: {
        include: {
          job: { select: { title: true, company: true, description: true } },
        },
      },
    },
  });

  if (!interview) {
    return NextResponse.json({ error: "Interview not found" }, { status: 404 });
  }

  if (interview.application.userId !== user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { job } = interview.application;

  if (!job.description) {
    return NextResponse.json(
      { error: "Job description is required to generate questions" },
      { status: 400 }
    );
  }

  try {
    const prompt = buildInterviewQuestionsPrompt(
      job.description,
      job.title,
      job.company,
      interview.type
    );

    const result = await callClaude(prompt.system, prompt.user, {
      maxTokens: 4096,
    });

    const parsed = JSON.parse(result.text);

    // Save all generated questions to the database
    const createdQuestions = await Promise.all(
      parsed.questions.map((q: { question: string; type: string; hint?: string; starFramework?: object }) =>
        prisma.interviewQuestion.create({
          data: {
            interviewId: id,
            question: q.question,
            type: q.type,
            notes: q.hint || null,
            starAnswer: q.starFramework ? JSON.stringify(q.starFramework) : null,
          },
        })
      )
    );

    return NextResponse.json({
      questions: createdQuestions,
      companyResearchTips: parsed.companyResearchTips || [],
      prepChecklist: parsed.prepChecklist || [],
    });
  } catch (error) {
    console.error("Question generation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate questions" },
      { status: 500 }
    );
  }
}
