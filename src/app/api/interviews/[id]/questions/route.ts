import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

export async function GET(
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
      application: { select: { userId: true } },
      questions: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!interview) {
    return NextResponse.json({ error: "Interview not found" }, { status: 404 });
  }

  if (interview.application.userId !== user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  return NextResponse.json(interview.questions);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  const interview = await prisma.interview.findFirst({
    where: { id },
    include: { application: { select: { userId: true } } },
  });

  if (!interview) {
    return NextResponse.json({ error: "Interview not found" }, { status: 404 });
  }

  if (interview.application.userId !== user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { question, type, answer, starAnswer, notes } = body;

  const created = await prisma.interviewQuestion.create({
    data: {
      interviewId: id,
      question,
      type: type || "behavioral",
      answer: answer || null,
      starAnswer: starAnswer ? JSON.stringify(starAnswer) : null,
      notes: notes || null,
    },
  });

  return NextResponse.json(created);
}
