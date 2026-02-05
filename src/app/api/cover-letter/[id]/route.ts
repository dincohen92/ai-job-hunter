import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const coverLetter = await prisma.coverLetter.findFirst({
    where: { id, userId: user.id },
    include: { job: { select: { title: true, company: true } } },
  });

  if (!coverLetter) {
    return NextResponse.json({ error: "Cover letter not found" }, { status: 404 });
  }

  return NextResponse.json(coverLetter);
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { content, tone } = await req.json();

  const existing = await prisma.coverLetter.findFirst({
    where: { id, userId: user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Cover letter not found" }, { status: 404 });
  }

  const updated = await prisma.coverLetter.update({
    where: { id },
    data: {
      content: content ?? existing.content,
      tone: tone ?? existing.tone,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await prisma.coverLetter.findFirst({
    where: { id, userId: user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Cover letter not found" }, { status: 404 });
  }

  await prisma.coverLetter.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
