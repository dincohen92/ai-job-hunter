import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const jobs = await prisma.savedJob.findMany({
    where: { userId: user.id },
    include: { application: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(jobs);
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  const job = await prisma.savedJob.create({
    data: {
      userId: user.id,
      externalId: body.externalId || null,
      source: body.source || "manual",
      title: body.title,
      company: body.company,
      location: body.location || null,
      description: body.description,
      requirements: body.requirements || null,
      salary: body.salary || null,
      jobType: body.jobType || null,
      applyUrl: body.applyUrl || null,
      companyLogo: body.companyLogo || null,
      postedAt: body.postedAt ? new Date(body.postedAt) : null,
    },
  });

  return NextResponse.json(job);
}
