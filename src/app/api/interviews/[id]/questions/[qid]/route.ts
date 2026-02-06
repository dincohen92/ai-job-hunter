import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string; qid: string }> }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, qid } = await params;
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

  const question = await prisma.interviewQuestion.findFirst({
    where: { id: qid, interviewId: id },
  });

  if (!question) {
    return NextResponse.json({ error: "Question not found" }, { status: 404 });
  }

  const { answer, starAnswer, notes } = body;

  const updated = await prisma.interviewQuestion.update({
    where: { id: qid },
    data: {
      answer: answer !== undefined ? answer : question.answer,
      starAnswer: starAnswer !== undefined
        ? (starAnswer ? JSON.stringify(starAnswer) : null)
        : question.starAnswer,
      notes: notes !== undefined ? notes : question.notes,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; qid: string }> }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, qid } = await params;

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

  const question = await prisma.interviewQuestion.findFirst({
    where: { id: qid, interviewId: id },
  });

  if (!question) {
    return NextResponse.json({ error: "Question not found" }, { status: 404 });
  }

  await prisma.interviewQuestion.delete({ where: { id: qid } });

  return NextResponse.json({ success: true });
}
