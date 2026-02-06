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
    // Return default preferences
    return NextResponse.json({
      preferredTitles: [],
      preferredSkills: [],
      avoidCompanies: [],
      minSalary: null,
      remoteOnly: false,
      locations: [],
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
  });
}

export async function PUT(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  const data = {
    preferredTitles: body.preferredTitles
      ? JSON.stringify(body.preferredTitles)
      : null,
    preferredSkills: body.preferredSkills
      ? JSON.stringify(body.preferredSkills)
      : null,
    avoidCompanies: body.avoidCompanies
      ? JSON.stringify(body.avoidCompanies)
      : null,
    minSalary: body.minSalary ? parseInt(body.minSalary) : null,
    remoteOnly: body.remoteOnly ?? false,
    locations: body.locations ? JSON.stringify(body.locations) : null,
  };

  const preferences = await prisma.userPreference.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      ...data,
    },
    update: data,
  });

  return NextResponse.json(preferences);
}
