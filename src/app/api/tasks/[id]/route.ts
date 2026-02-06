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

  const task = await prisma.task.findFirst({
    where: { id, userId: user.id },
    include: {
      application: {
        include: {
          job: { select: { title: true, company: true } },
        },
      },
      contact: { select: { name: true, company: true } },
      job: { select: { title: true, company: true } },
    },
  });

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  return NextResponse.json(task);
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

  const existing = await prisma.task.findFirst({
    where: { id, userId: user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const {
    title,
    description,
    dueDate,
    priority,
    status,
    type,
    applicationId,
    contactId,
    jobId,
  } = body;

  // Handle completion
  let completedAt = existing.completedAt;
  if (status === "completed" && existing.status !== "completed") {
    completedAt = new Date();
  } else if (status !== "completed" && existing.status === "completed") {
    completedAt = null;
  }

  const task = await prisma.task.update({
    where: { id },
    data: {
      title: title !== undefined ? title : existing.title,
      description: description !== undefined ? description : existing.description,
      dueDate: dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : existing.dueDate,
      priority: priority !== undefined ? priority : existing.priority,
      status: status !== undefined ? status : existing.status,
      type: type !== undefined ? type : existing.type,
      applicationId: applicationId !== undefined ? applicationId : existing.applicationId,
      contactId: contactId !== undefined ? contactId : existing.contactId,
      jobId: jobId !== undefined ? jobId : existing.jobId,
      completedAt,
    },
    include: {
      application: {
        include: {
          job: { select: { title: true, company: true } },
        },
      },
      contact: { select: { name: true, company: true } },
      job: { select: { title: true, company: true } },
    },
  });

  return NextResponse.json(task);
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

  const existing = await prisma.task.findFirst({
    where: { id, userId: user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  await prisma.task.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
