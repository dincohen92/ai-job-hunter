import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get("jobId");

  const where = jobId
    ? { userId: user.id, jobId }
    : { userId: user.id };

  const coverLetters = await prisma.coverLetter.findMany({
    where,
    include: { job: { select: { title: true, company: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(coverLetters);
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { jobId, content, tone } = await req.json();

  if (!jobId || !content) {
    return NextResponse.json(
      { error: "jobId and content are required" },
      { status: 400 }
    );
  }

  // Get the current max version for this job
  const existing = await prisma.coverLetter.findMany({
    where: { userId: user.id, jobId },
    orderBy: { version: "desc" },
    take: 1,
  });

  const nextVersion = existing.length > 0 ? existing[0].version + 1 : 1;

  const coverLetter = await prisma.coverLetter.create({
    data: {
      userId: user.id,
      jobId,
      content,
      tone: tone || "professional",
      version: nextVersion,
    },
  });

  return NextResponse.json(coverLetter);
}
