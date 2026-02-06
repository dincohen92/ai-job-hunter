import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const skills = await prisma.skillAnalysis.findMany({
    where: { userId: user.id },
    orderBy: [{ priority: "asc" }, { demandCount: "desc" }],
  });

  // Parse resources JSON
  const parsed = skills.map((skill) => ({
    ...skill,
    resources: skill.resources ? JSON.parse(skill.resources) : [],
  }));

  return NextResponse.json(parsed);
}
