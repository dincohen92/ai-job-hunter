import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

interface ImportData {
  version?: string;
  cvProfile?: {
    fullName?: string;
    email?: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    website?: string;
    summary?: string;
    experience?: string;
    education?: string;
    skills?: string;
    projects?: string;
    certifications?: string;
  };
  savedJobs?: Array<{
    title: string;
    company: string;
    location?: string;
    description?: string;
    salary?: string;
    jobType?: string;
    applyUrl?: string;
    externalId?: string;
    source?: string;
  }>;
  contacts?: Array<{
    name: string;
    company?: string;
    role?: string;
    email?: string;
    phone?: string;
    linkedInUrl?: string;
    relationshipType?: string;
    notes?: string;
  }>;
  companies?: Array<{
    name: string;
    website?: string;
    industry?: string;
    size?: string;
    location?: string;
    description?: string;
    notes?: string;
  }>;
  templates?: Array<{
    category: string;
    question: string;
    answer: string;
    tags?: string;
  }>;
}

export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("mode") || "merge"; // merge or replace

  let data: ImportData;
  try {
    data = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON data" },
      { status: 400 }
    );
  }

  const stats = {
    cvProfile: false,
    savedJobs: 0,
    contacts: 0,
    companies: 0,
    templates: 0,
  };

  // Import CV Profile
  if (data.cvProfile) {
    if (mode === "replace") {
      await prisma.cvProfile.deleteMany({ where: { userId: user.id } });
    }

    await prisma.cvProfile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        ...data.cvProfile,
      },
      update: data.cvProfile,
    });
    stats.cvProfile = true;
  }

  // Import Saved Jobs
  if (data.savedJobs?.length) {
    if (mode === "replace") {
      await prisma.savedJob.deleteMany({ where: { userId: user.id } });
    }

    for (const job of data.savedJobs) {
      try {
        await prisma.savedJob.create({
          data: {
            userId: user.id,
            title: job.title,
            company: job.company,
            location: job.location,
            description: job.description || "",
            salary: job.salary,
            jobType: job.jobType,
            applyUrl: job.applyUrl,
            externalId: job.externalId,
            source: job.source || "import",
          },
        });
        stats.savedJobs++;
      } catch {
        // Skip duplicates
      }
    }
  }

  // Import Contacts
  if (data.contacts?.length) {
    if (mode === "replace") {
      await prisma.contact.deleteMany({ where: { userId: user.id } });
    }

    for (const contact of data.contacts) {
      try {
        await prisma.contact.create({
          data: {
            userId: user.id,
            name: contact.name,
            company: contact.company,
            role: contact.role,
            email: contact.email,
            phone: contact.phone,
            linkedInUrl: contact.linkedInUrl,
            relationshipType: contact.relationshipType || "other",
            notes: contact.notes,
          },
        });
        stats.contacts++;
      } catch {
        // Skip duplicates
      }
    }
  }

  // Import Companies
  if (data.companies?.length) {
    if (mode === "replace") {
      await prisma.company.deleteMany({ where: { userId: user.id } });
    }

    for (const company of data.companies) {
      try {
        await prisma.company.upsert({
          where: {
            userId_name: { userId: user.id, name: company.name },
          },
          create: {
            userId: user.id,
            name: company.name,
            website: company.website,
            industry: company.industry,
            size: company.size,
            location: company.location,
            description: company.description,
            notes: company.notes,
          },
          update: {
            website: company.website,
            industry: company.industry,
            size: company.size,
            location: company.location,
            description: company.description,
            notes: company.notes,
          },
        });
        stats.companies++;
      } catch {
        // Skip errors
      }
    }
  }

  // Import Templates
  if (data.templates?.length) {
    if (mode === "replace") {
      await prisma.applicationTemplate.deleteMany({ where: { userId: user.id } });
    }

    for (const template of data.templates) {
      try {
        await prisma.applicationTemplate.create({
          data: {
            userId: user.id,
            category: template.category,
            question: template.question,
            answer: template.answer,
            tags: template.tags,
            charCount: template.answer.length,
          },
        });
        stats.templates++;
      } catch {
        // Skip errors
      }
    }
  }

  return NextResponse.json({
    message: "Import completed",
    stats,
  });
}
