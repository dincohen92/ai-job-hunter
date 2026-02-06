import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;
  const body = await request.json();
  const { feedback } = body; // "liked" or "disliked"

  if (!["liked", "disliked"].includes(feedback)) {
    return NextResponse.json(
      { error: "Invalid feedback. Use 'liked' or 'disliked'" },
      { status: 400 }
    );
  }

  const recommendation = await prisma.jobRecommendation.findUnique({
    where: { id },
  });

  if (!recommendation || recommendation.userId !== user.id) {
    return NextResponse.json(
      { error: "Recommendation not found" },
      { status: 404 }
    );
  }

  const updated = await prisma.jobRecommendation.update({
    where: { id },
    data: { feedback },
  });

  return NextResponse.json(updated);
}
