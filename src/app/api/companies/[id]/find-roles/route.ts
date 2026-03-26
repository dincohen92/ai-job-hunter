import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { searchMultipleSources, deduplicateJobs } from "@/lib/job-providers";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const company = await prisma.company.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!company) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 });
  }

  try {
    const result = await searchMultipleSources({
      query: company.name,
      page: 1,
      limit: 20,
    });

    const jobs = deduplicateJobs(result.results);

    // Keep only jobs that appear to be from this company
    const companyNameLower = company.name.toLowerCase();
    const matchingJobs = jobs.filter(
      (job) =>
        job.company.toLowerCase().includes(companyNameLower) ||
        companyNameLower.includes(job.company.toLowerCase())
    );

    let newCount = 0;
    const savedJobIds: string[] = [];

    for (const job of matchingJobs) {
      // Check if job already saved for this user
      const existing = job.externalId
        ? await prisma.savedJob.findFirst({
            where: {
              userId: session.user.id,
              externalId: job.externalId,
              source: job.source,
            },
          })
        : null;

      if (existing) {
        // Link to company if not already linked
        if (!existing.companyId) {
          await prisma.savedJob.update({
            where: { id: existing.id },
            data: { companyId: id },
          });
        }
        savedJobIds.push(existing.id);
      } else {
        const created = await prisma.savedJob.create({
          data: {
            userId: session.user.id,
            externalId: job.externalId || null,
            source: job.source,
            title: job.title,
            company: job.company,
            location: job.location || null,
            description: job.description,
            requirements: job.requirements || null,
            salary: job.salary || null,
            salaryMin: job.salaryMin || null,
            salaryMax: job.salaryMax || null,
            jobType: job.jobType || null,
            applyUrl: job.applyUrl || null,
            companyLogo: job.companyLogo || null,
            postedAt: job.postedAt || null,
            companyId: id,
          },
        });
        newCount++;
        savedJobIds.push(created.id);
      }
    }

    return NextResponse.json({
      success: true,
      totalFound: matchingJobs.length,
      newlySaved: newCount,
      jobIds: savedJobIds,
      errors: result.errors,
    });
  } catch (error) {
    console.error("Find roles error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Role discovery failed" },
      { status: 500 }
    );
  }
}
