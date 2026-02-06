import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

export async function GET(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");

  const where: { userId: string; category?: string } = { userId: user.id };
  if (category) {
    where.category = category;
  }

  const templates = await prisma.applicationTemplate.findMany({
    where,
    orderBy: [{ category: "asc" }, { usageCount: "desc" }],
  });

  return NextResponse.json(templates);
}

export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  const template = await prisma.applicationTemplate.create({
    data: {
      userId: user.id,
      category: body.category,
      question: body.question,
      answer: body.answer,
      tags: body.tags ? JSON.stringify(body.tags) : null,
      charCount: body.answer?.length || 0,
    },
  });

  return NextResponse.json(template);
}
