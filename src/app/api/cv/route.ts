import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const cv = await prisma.cvProfile.findUnique({
    where: { userId: user.id },
  });

  if (!cv) return NextResponse.json(null);

  return NextResponse.json({
    ...cv,
    experience: cv.experience ? JSON.parse(cv.experience) : [],
    education: cv.education ? JSON.parse(cv.education) : [],
    skills: cv.skills ? JSON.parse(cv.skills) : [],
    projects: cv.projects ? JSON.parse(cv.projects) : [],
    certifications: cv.certifications ? JSON.parse(cv.certifications) : [],
  });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  const data = {
    fullName: body.fullName || null,
    email: body.email || null,
    phone: body.phone || null,
    location: body.location || null,
    linkedin: body.linkedin || null,
    website: body.website || null,
    summary: body.summary || null,
    experience: JSON.stringify(body.experience || []),
    education: JSON.stringify(body.education || []),
    skills: JSON.stringify(body.skills || []),
    projects: JSON.stringify(body.projects || []),
    certifications: JSON.stringify(body.certifications || []),
  };

  const cv = await prisma.cvProfile.upsert({
    where: { userId: user.id },
    create: { userId: user.id, ...data },
    update: data,
  });

  return NextResponse.json({
    ...cv,
    experience: JSON.parse(cv.experience || "[]"),
    education: JSON.parse(cv.education || "[]"),
    skills: JSON.parse(cv.skills || "[]"),
    projects: JSON.parse(cv.projects || "[]"),
    certifications: JSON.parse(cv.certifications || "[]"),
  });
}
