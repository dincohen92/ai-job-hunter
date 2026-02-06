import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;

  const existing = await prisma.applicationTemplate.findUnique({
    where: { id },
  });

  if (!existing || existing.userId !== user.id) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  // Increment usage count
  const template = await prisma.applicationTemplate.update({
    where: { id },
    data: {
      usageCount: { increment: 1 },
    },
  });

  return NextResponse.json({
    answer: template.answer,
    message: "Copied to clipboard",
  });
}
