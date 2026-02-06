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

  const template = await prisma.applicationTemplate.findUnique({
    where: { id },
  });

  if (!template || template.userId !== user.id) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  return NextResponse.json(template);
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

  const existing = await prisma.applicationTemplate.findUnique({
    where: { id },
  });

  if (!existing || existing.userId !== user.id) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  const template = await prisma.applicationTemplate.update({
    where: { id },
    data: {
      category: body.category,
      question: body.question,
      answer: body.answer,
      tags: body.tags ? JSON.stringify(body.tags) : null,
      charCount: body.answer?.length || 0,
    },
  });

  return NextResponse.json(template);
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

  const existing = await prisma.applicationTemplate.findUnique({
    where: { id },
  });

  if (!existing || existing.userId !== user.id) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  await prisma.applicationTemplate.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
