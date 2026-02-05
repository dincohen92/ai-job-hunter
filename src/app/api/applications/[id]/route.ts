import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  const result = await prisma.application.updateMany({
    where: { id: params.id, userId: user.id },
    data: {
      status: body.status,
      notes: body.notes,
      appliedAt: body.status === "applied" ? new Date() : undefined,
      nextStep: body.nextStep,
    },
  });

  if (result.count === 0)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ success: true });
}
