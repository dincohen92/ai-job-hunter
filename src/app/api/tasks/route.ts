import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const priority = url.searchParams.get("priority");
  const due = url.searchParams.get("due"); // today, overdue, upcoming, all

  const where: Record<string, unknown> = { userId: user.id };

  if (status && status !== "all") {
    where.status = status;
  }

  if (priority && priority !== "all") {
    where.priority = priority;
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (due === "today") {
    where.dueDate = {
      gte: today,
      lt: tomorrow,
    };
  } else if (due === "overdue") {
    where.dueDate = { lt: today };
    where.status = "pending";
  } else if (due === "upcoming") {
    where.dueDate = { gte: tomorrow };
  }

  const tasks = await prisma.task.findMany({
    where,
    include: {
      application: {
        include: {
          job: { select: { title: true, company: true } },
        },
      },
      contact: { select: { name: true, company: true } },
      job: { select: { title: true, company: true } },
    },
    orderBy: [
      { dueDate: "asc" },
      { priority: "desc" },
      { createdAt: "desc" },
    ],
  });

  return NextResponse.json(tasks);
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const {
    title,
    description,
    dueDate,
    priority,
    type,
    applicationId,
    contactId,
    jobId,
  } = body;

  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const task = await prisma.task.create({
    data: {
      userId: user.id,
      title,
      description: description || null,
      dueDate: dueDate ? new Date(dueDate) : null,
      priority: priority || "medium",
      type: type || "custom",
      applicationId: applicationId || null,
      contactId: contactId || null,
      jobId: jobId || null,
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
