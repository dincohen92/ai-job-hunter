import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const resumes = await prisma.resume.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(resumes);
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, rawText } = await req.json();
  if (!name || !rawText) {
    return NextResponse.json(
      { error: "Name and resume text are required" },
      { status: 400 }
    );
  }

  const resume = await prisma.resume.create({
    data: {
      userId: user.id,
      name,
      rawText,
    },
  });

  return NextResponse.json(resume);
}
