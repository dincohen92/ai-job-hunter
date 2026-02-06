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

  const offer = await prisma.offer.findFirst({
    where: {
      id,
      application: {
        userId: session.user.id,
      },
    },
    include: {
      application: {
        include: {
          job: {
            select: {
              id: true,
              title: true,
              company: true,
              location: true,
              salaryMin: true,
              salaryMax: true,
              salaryExpectation: true,
            },
          },
        },
      },
    },
  });

  if (!offer) {
    return NextResponse.json({ error: "Offer not found" }, { status: 404 });
  }

  return NextResponse.json(offer);
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
  const existing = await prisma.offer.findFirst({
    where: {
      id,
      application: {
        userId: session.user.id,
      },
    },
  });

  if (!existing) {
    return NextResponse.json({ error: "Offer not found" }, { status: 404 });
  }

  const { baseSalary, bonus, bonusType, equity, equityValue, vestingYears, benefits, benefitsValue, pto, remotePolicy, location, startDate, expirationDate, status, notes, negotiationLog } = body;

  const offer = await prisma.offer.update({
    where: { id },
    data: {
      baseSalary,
      bonus,
      bonusType,
      equity,
      equityValue,
      vestingYears,
      benefits,
      benefitsValue,
      pto,
      remotePolicy,
      location,
      startDate: startDate ? new Date(startDate) : null,
      expirationDate: expirationDate ? new Date(expirationDate) : null,
      status,
      notes,
      negotiationLog,
    },
    include: {
      application: {
        include: {
          job: {
            select: {
              id: true,
              title: true,
              company: true,
            },
          },
        },
      },
    },
  });

  // Update application status based on offer status
  if (status === "accepted") {
    await prisma.application.update({
      where: { id: existing.applicationId },
      data: { status: "accepted" },
    });
  } else if (status === "declined") {
    await prisma.application.update({
      where: { id: existing.applicationId },
      data: { status: "rejected" },
    });
  }

  return NextResponse.json(offer);
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
  const existing = await prisma.offer.findFirst({
    where: {
      id,
      application: {
        userId: session.user.id,
      },
    },
  });

  if (!existing) {
    return NextResponse.json({ error: "Offer not found" }, { status: 404 });
  }

  await prisma.offer.delete({
    where: { id },
  });

  // Revert application status
  await prisma.application.update({
    where: { id: existing.applicationId },
    data: { status: "interviewing" },
  });

  return NextResponse.json({ success: true });
}
