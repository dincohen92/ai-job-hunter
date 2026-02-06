import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const resume = await prisma.generatedResume.findUnique({
    where: { id: params.id },
    include: {
      job: { select: { title: true, company: true } },
      cvProfile: { select: { userId: true } },
    },
  });

  if (!resume || resume.cvProfile.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    ...resume,
    changes: resume.changes ? JSON.parse(resume.changes) : [],
    suggestions: resume.suggestions ? JSON.parse(resume.suggestions) : [],
  });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const resume = await prisma.generatedResume.findUnique({
    where: { id: params.id },
    include: { cvProfile: { select: { userId: true } } },
  });

  if (!resume || resume.cvProfile.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.generatedResume.delete({ where: { id: params.id } });

  return NextResponse.json({ success: true });
}
