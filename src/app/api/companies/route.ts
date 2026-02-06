import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";

  const companies = await prisma.company.findMany({
    where: {
      userId: session.user.id,
      ...(search && {
        OR: [
          { name: { contains: search } },
          { industry: { contains: search } },
          { location: { contains: search } },
        ],
      }),
    },
    include: {
      _count: {
        select: {
          savedJobs: true,
          contacts: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(companies);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, website, industry, size, location, description, culture, techStack, glassdoor, linkedin, notes, pros, cons, salaryRange, interviewProcess } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "Company name is required" }, { status: 400 });
  }

  // Check for duplicate company name for this user
  const existing = await prisma.company.findUnique({
    where: {
      userId_name: {
        userId: session.user.id,
        name: name.trim(),
      },
    },
  });

  if (existing) {
    return NextResponse.json({ error: "A company with this name already exists" }, { status: 409 });
  }

  const company = await prisma.company.create({
    data: {
      userId: session.user.id,
      name: name.trim(),
      website,
      industry,
      size,
      location,
      description,
      culture,
      techStack,
      glassdoor,
      linkedin,
      notes,
      pros,
      cons,
      salaryRange,
      interviewProcess,
    },
  });

  return NextResponse.json(company, { status: 201 });
}
