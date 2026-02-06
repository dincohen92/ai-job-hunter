import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const alerts = await prisma.jobAlert.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(alerts);
}

export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  const alert = await prisma.jobAlert.create({
    data: {
      userId: user.id,
      name: body.name,
      query: body.query,
      location: body.location || null,
      filters: body.filters ? JSON.stringify(body.filters) : null,
      sources: body.sources ? JSON.stringify(body.sources) : null,
      frequency: body.frequency || "daily",
      enabled: body.enabled ?? true,
    },
  });

  return NextResponse.json(alert);
}
