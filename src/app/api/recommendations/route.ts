import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const recommendations = await prisma.jobRecommendation.findMany({
    where: { userId: user.id },
    include: {
      job: {
        include: {
          companyRef: true,
          application: true,
        },
      },
    },
    orderBy: { score: "desc" },
    take: 20,
  });

  // Mark as seen
  const unseenIds = recommendations.filter((r) => !r.seen).map((r) => r.id);
  if (unseenIds.length > 0) {
    await prisma.jobRecommendation.updateMany({
      where: { id: { in: unseenIds } },
      data: { seen: true },
    });
  }

  return NextResponse.json(recommendations);
}
