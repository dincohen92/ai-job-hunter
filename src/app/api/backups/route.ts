import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const backups = await prisma.backup.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      size: true,
      createdAt: true,
    },
  });

  return NextResponse.json(backups);
}

export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const name = body.name || `Backup ${new Date().toISOString().split("T")[0]}`;

  // Fetch all user data
  const data = {
    exportDate: new Date().toISOString(),
    version: "1.0",
    cvProfile: await prisma.cvProfile.findUnique({
      where: { userId: user.id },
    }),
    savedJobs: await prisma.savedJob.findMany({
      where: { userId: user.id },
      include: { application: true },
    }),
    applications: await prisma.application.findMany({
      where: { userId: user.id },
      include: { interviews: true, offer: true },
    }),
    contacts: await prisma.contact.findMany({
      where: { userId: user.id },
      include: { interactions: true },
    }),
    companies: await prisma.company.findMany({
      where: { userId: user.id },
    }),
    templates: await prisma.applicationTemplate.findMany({
      where: { userId: user.id },
    }),
    alerts: await prisma.jobAlert.findMany({
      where: { userId: user.id },
    }),
    skills: await prisma.skillAnalysis.findMany({
      where: { userId: user.id },
    }),
  };

  const jsonData = JSON.stringify(data);
  const size = new TextEncoder().encode(jsonData).length;

  // Create backup record
  const backup = await prisma.backup.create({
    data: {
      userId: user.id,
      name,
      size,
      data: jsonData,
    },
  });

  // Keep only last 10 backups
  const oldBackups = await prisma.backup.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    skip: 10,
    select: { id: true },
  });

  if (oldBackups.length > 0) {
    await prisma.backup.deleteMany({
      where: { id: { in: oldBackups.map((b) => b.id) } },
    });
  }

  return NextResponse.json({
    id: backup.id,
    name: backup.name,
    size: backup.size,
    createdAt: backup.createdAt,
  });
}
