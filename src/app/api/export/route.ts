import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

export async function GET(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") || "json";
  const types = searchParams.get("types")?.split(",") || [
    "cvProfile",
    "savedJobs",
    "applications",
    "contacts",
    "companies",
    "templates",
  ];

  // Fetch all user data
  const data: Record<string, unknown> = {
    exportDate: new Date().toISOString(),
    version: "1.0",
    user: { email: user.email, name: user.name },
  };

  if (types.includes("cvProfile")) {
    data.cvProfile = await prisma.cvProfile.findUnique({
      where: { userId: user.id },
    });
  }

  if (types.includes("savedJobs")) {
    data.savedJobs = await prisma.savedJob.findMany({
      where: { userId: user.id },
      include: {
        application: true,
        companyRef: true,
      },
    });
  }

  if (types.includes("applications")) {
    data.applications = await prisma.application.findMany({
      where: { userId: user.id },
      include: {
        job: true,
        interviews: true,
        offer: true,
      },
    });
  }

  if (types.includes("contacts")) {
    data.contacts = await prisma.contact.findMany({
      where: { userId: user.id },
      include: {
        interactions: true,
      },
    });
  }

  if (types.includes("companies")) {
    data.companies = await prisma.company.findMany({
      where: { userId: user.id },
    });
  }

  if (types.includes("templates")) {
    data.templates = await prisma.applicationTemplate.findMany({
      where: { userId: user.id },
    });
  }

  if (types.includes("alerts")) {
    data.alerts = await prisma.jobAlert.findMany({
      where: { userId: user.id },
    });
  }

  if (types.includes("skills")) {
    data.skills = await prisma.skillAnalysis.findMany({
      where: { userId: user.id },
    });
  }

  if (format === "csv") {
    // Generate CSV for jobs
    const jobs = (data.savedJobs as Array<{
      title: string;
      company: string;
      location: string | null;
      salary: string | null;
      jobType: string | null;
      applyUrl: string | null;
      application?: { status: string; appliedAt: Date | null } | null;
      createdAt: Date;
    }>) || [];
    const csvRows = [
      "Title,Company,Location,Status,Applied Date,Salary,Job Type,URL",
      ...jobs.map((job) => {
        const status = job.application?.status || "saved";
        const appliedAt = job.application?.appliedAt
          ? new Date(job.application.appliedAt).toISOString().split("T")[0]
          : "";
        return [
          `"${(job.title || "").replace(/"/g, '""')}"`,
          `"${(job.company || "").replace(/"/g, '""')}"`,
          `"${(job.location || "").replace(/"/g, '""')}"`,
          status,
          appliedAt,
          `"${(job.salary || "").replace(/"/g, '""')}"`,
          job.jobType || "",
          job.applyUrl || "",
        ].join(",");
      }),
    ].join("\n");

    return new NextResponse(csvRows, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="ai-job-hunter-export-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  }

  // Default JSON export
  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="ai-job-hunter-export-${new Date().toISOString().split("T")[0]}.json"`,
    },
  });
}
