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
  const status = searchParams.get("status");

  const offers = await prisma.offer.findMany({
    where: {
      application: {
        userId: session.user.id,
      },
      ...(status && { status }),
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
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(offers);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { applicationId, baseSalary, bonus, bonusType, equity, equityValue, vestingYears, benefits, benefitsValue, pto, remotePolicy, location, startDate, expirationDate, status, notes } = body;

  if (!applicationId) {
    return NextResponse.json({ error: "Application ID is required" }, { status: 400 });
  }

  // Verify user owns the application
  const application = await prisma.application.findFirst({
    where: {
      id: applicationId,
      userId: session.user.id,
    },
  });

  if (!application) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  // Check if offer already exists
  const existingOffer = await prisma.offer.findUnique({
    where: { applicationId },
  });

  if (existingOffer) {
    return NextResponse.json({ error: "An offer already exists for this application" }, { status: 409 });
  }

  const offer = await prisma.offer.create({
    data: {
      applicationId,
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
      status: status || "pending",
      notes,
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

  // Update application status to "offer"
  await prisma.application.update({
    where: { id: applicationId },
    data: { status: "offer" },
  });

  return NextResponse.json(offer, { status: 201 });
}
