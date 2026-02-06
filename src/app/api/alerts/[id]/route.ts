import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;

  const alert = await prisma.jobAlert.findUnique({
    where: { id },
  });

  if (!alert || alert.userId !== user.id) {
    return NextResponse.json({ error: "Alert not found" }, { status: 404 });
  }

  return NextResponse.json(alert);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;
  const body = await request.json();

  const existing = await prisma.jobAlert.findUnique({
    where: { id },
  });

  if (!existing || existing.userId !== user.id) {
    return NextResponse.json({ error: "Alert not found" }, { status: 404 });
  }

  const alert = await prisma.jobAlert.update({
    where: { id },
    data: {
      name: body.name,
      query: body.query,
      location: body.location || null,
      filters: body.filters ? JSON.stringify(body.filters) : null,
      sources: body.sources ? JSON.stringify(body.sources) : null,
      frequency: body.frequency,
      enabled: body.enabled,
    },
  });

  return NextResponse.json(alert);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;

  const existing = await prisma.jobAlert.findUnique({
    where: { id },
  });

  if (!existing || existing.userId !== user.id) {
    return NextResponse.json({ error: "Alert not found" }, { status: 404 });
  }

  await prisma.jobAlert.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
