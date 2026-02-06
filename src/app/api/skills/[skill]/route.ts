import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

export async function PUT(
  request: NextRequest,
  { params }: { params: { skill: string } }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const skill = decodeURIComponent(params.skill);
  const body = await request.json();

  const existing = await prisma.skillAnalysis.findUnique({
    where: {
      userId_skill: { userId: user.id, skill },
    },
  });

  if (!existing) {
    return NextResponse.json({ error: "Skill not found" }, { status: 404 });
  }

  const updated = await prisma.skillAnalysis.update({
    where: {
      userId_skill: { userId: user.id, skill },
    },
    data: {
      status: body.status,
      notes: body.notes,
    },
  });

  return NextResponse.json(updated);
}
