import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const upcoming = searchParams.get("upcoming");

  // Get all applications for this user first
  const applications = await prisma.application.findMany({
    where: { userId: user.id },
    select: { id: true },
  });

  const applicationIds = applications.map((a) => a.id);

  const where: Record<string, unknown> = {
    applicationId: { in: applicationIds },
  };

  if (status && status !== "all") {
    where.status = status;
  }

  if (upcoming === "true") {
    where.scheduledAt = { gte: new Date() };
    where.status = "scheduled";
  }

  const interviews = await prisma.interview.findMany({
    where,
    include: {
      application: {
        include: {
          job: {
            select: { id: true, title: true, company: true },
          },
        },
      },
    },
    orderBy: { scheduledAt: "asc" },
  });

  return NextResponse.json(interviews);
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const {
    applicationId,
    scheduledAt,
    duration,
    type,
    location,
    interviewers,
    prepNotes,
  } = body;

  if (!applicationId || !scheduledAt) {
    return NextResponse.json(
      { error: "applicationId and scheduledAt are required" },
      { status: 400 }
    );
  }

  // Verify application belongs to user
  const application = await prisma.application.findFirst({
    where: { id: applicationId, userId: user.id },
  });

  if (!application) {
    return NextResponse.json(
      { error: "Application not found" },
      { status: 404 }
    );
  }

  const interview = await prisma.interview.create({
    data: {
      applicationId,
      scheduledAt: new Date(scheduledAt),
      duration: duration || null,
      type: type || "video",
      location: location || null,
      interviewers: interviewers ? JSON.stringify(interviewers) : null,
      prepNotes: prepNotes || null,
    },
    include: {
      application: {
        include: {
          job: { select: { title: true, company: true } },
        },
      },
    },
  });

  // Update application status to interviewing if it's not already past that
  if (application.status === "saved" || application.status === "applied") {
    await prisma.application.update({
      where: { id: applicationId },
      data: { status: "interviewing" },
    });
  }

  return NextResponse.json(interview);
}
