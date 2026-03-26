import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const company = await prisma.company.findFirst({
    where: {
      id,
      userId: session.user.id,
    },
    include: {
      savedJobs: {
        select: {
          id: true,
          title: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      },
      contacts: {
        select: {
          id: true,
          name: true,
          role: true,
          email: true,
        },
        orderBy: { name: "asc" },
      },
    },
  });

  if (!company) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 });
  }

  return NextResponse.json(company);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  // Verify ownership
  const existing = await prisma.company.findFirst({
    where: {
      id,
      userId: session.user.id,
    },
  });

  if (!existing) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 });
  }

  const { name, website, industry, size, location, description, culture, techStack, glassdoor, linkedin, notes, pros, cons, salaryRange, interviewProcess, isTarget } = body;

  // Check for duplicate name if name is being changed
  if (name && name.trim() !== existing.name) {
    const duplicate = await prisma.company.findUnique({
      where: {
        userId_name: {
          userId: session.user.id,
          name: name.trim(),
        },
      },
    });

    if (duplicate) {
      return NextResponse.json({ error: "A company with this name already exists" }, { status: 409 });
    }
  }

  const company = await prisma.company.update({
    where: { id },
    data: {
      ...(name && { name: name.trim() }),
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
      ...(isTarget !== undefined && { isTarget }),
    },
  });

  return NextResponse.json(company);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Verify ownership
  const existing = await prisma.company.findFirst({
    where: {
      id,
      userId: session.user.id,
    },
  });

  if (!existing) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 });
  }

  await prisma.company.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}
