import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const preferences = await prisma.userPreference.findUnique({
    where: { userId: user.id },
  });

  if (!preferences) {
    return NextResponse.json({
      preferredTitles: [],
      preferredSkills: [],
      avoidCompanies: [],
      minSalary: null,
      maxSalary: null,
      remoteOnly: false,
      locations: [],
      jobType: "any",
      workStyle: "any",
      experienceLevel: "any",
    });
  }

  return NextResponse.json({
    ...preferences,
    preferredTitles: preferences.preferredTitles
      ? JSON.parse(preferences.preferredTitles)
      : [],
    preferredSkills: preferences.preferredSkills
      ? JSON.parse(preferences.preferredSkills)
      : [],
    avoidCompanies: preferences.avoidCompanies
      ? JSON.parse(preferences.avoidCompanies)
      : [],
    locations: preferences.locations ? JSON.parse(preferences.locations) : [],
    jobType: preferences.jobType || "any",
    workStyle: preferences.workStyle || "any",
    experienceLevel: preferences.experienceLevel || "any",
  });
}

export async function PUT(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  const data = {
    preferredTitles: body.preferredTitles?.length
      ? JSON.stringify(body.preferredTitles)
      : null,
    preferredSkills: body.preferredSkills?.length
      ? JSON.stringify(body.preferredSkills)
      : null,
    avoidCompanies: body.avoidCompanies?.length
      ? JSON.stringify(body.avoidCompanies)
      : null,
    minSalary: body.minSalary ? parseInt(body.minSalary) : null,
    maxSalary: body.maxSalary ? parseInt(body.maxSalary) : null,
    remoteOnly: body.workStyle === "remote" || body.remoteOnly || false,
    locations: body.locations?.length ? JSON.stringify(body.locations) : null,
    jobType: body.jobType && body.jobType !== "any" ? body.jobType : null,
    workStyle: body.workStyle && body.workStyle !== "any" ? body.workStyle : null,
    experienceLevel:
      body.experienceLevel && body.experienceLevel !== "any"
        ? body.experienceLevel
        : null,
  };

  const preferences = await prisma.userPreference.upsert({
    where: { userId: user.id },
    create: { userId: user.id, ...data },
    update: data,
  });

  return NextResponse.json({
    ...preferences,
    preferredTitles: preferences.preferredTitles
      ? JSON.parse(preferences.preferredTitles)
      : [],
    preferredSkills: preferences.preferredSkills
      ? JSON.parse(preferences.preferredSkills)
      : [],
    avoidCompanies: preferences.avoidCompanies
      ? JSON.parse(preferences.avoidCompanies)
      : [],
    locations: preferences.locations ? JSON.parse(preferences.locations) : [],
    jobType: preferences.jobType || "any",
    workStyle: preferences.workStyle || "any",
    experienceLevel: preferences.experienceLevel || "any",
  });
}
