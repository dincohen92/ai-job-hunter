import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const cvProfile = await prisma.cvProfile.findUnique({
    where: { userId: user.id },
  });

  if (!cvProfile) {
    return NextResponse.json([]);
  }

  const resumes = await prisma.generatedResume.findMany({
    where: { cvProfileId: cvProfile.id },
    include: {
      job: { select: { title: true, company: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(resumes);
}
