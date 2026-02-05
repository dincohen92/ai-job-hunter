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
      application: {
        include: {
          job: { select: { id: true, title: true, company: true, description: true } },
        },
      },
    },
  });

  if (!interview) {
    return NextResponse.json({ error: "Interview not found" }, { status: 404 });
  }

  // Verify ownership
  if (interview.application.userId !== user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  return NextResponse.json(interview);
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  const existing = await prisma.interview.findFirst({
    where: { id },
    include: { application: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Interview not found" }, { status: 404 });
  }

  // Verify ownership
  if (existing.application.userId !== user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const {
    scheduledAt,
    duration,
    type,
    location,
    interviewers,
    status,
    prepNotes,
    postNotes,
  } = body;

  const updated = await prisma.interview.update({
    where: { id },
    data: {
      scheduledAt: scheduledAt ? new Date(scheduledAt) : existing.scheduledAt,
      duration: duration !== undefined ? duration : existing.duration,
      type: type ?? existing.type,
      location: location !== undefined ? location : existing.location,
      interviewers:
        interviewers !== undefined
          ? interviewers
            ? JSON.stringify(interviewers)
            : null
          : existing.interviewers,
      status: status ?? existing.status,
      prepNotes: prepNotes !== undefined ? prepNotes : existing.prepNotes,
      postNotes: postNotes !== undefined ? postNotes : existing.postNotes,
    },
    include: {
      application: {
        include: {
          job: { select: { title: true, company: true } },
        },
      },
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await prisma.interview.findFirst({
    where: { id },
    include: { application: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Interview not found" }, { status: 404 });
  }

  // Verify ownership
  if (existing.application.userId !== user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  await prisma.interview.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
