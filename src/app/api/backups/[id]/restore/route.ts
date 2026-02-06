import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;

  const backup = await prisma.backup.findUnique({
    where: { id },
  });

  if (!backup || backup.userId !== user.id) {
    return NextResponse.json({ error: "Backup not found" }, { status: 404 });
  }

  // Parse backup data
  let data;
  try {
    data = JSON.parse(backup.data);
  } catch {
    return NextResponse.json(
      { error: "Invalid backup data" },
      { status: 400 }
    );
  }

  try {
    // Delete existing data (careful!)
    await prisma.$transaction([
      prisma.skillAnalysis.deleteMany({ where: { userId: user.id } }),
      prisma.jobAlert.deleteMany({ where: { userId: user.id } }),
      prisma.applicationTemplate.deleteMany({ where: { userId: user.id } }),
      prisma.contactInteraction.deleteMany({
        where: { contact: { userId: user.id } },
      }),
      prisma.contact.deleteMany({ where: { userId: user.id } }),
      prisma.interview.deleteMany({
        where: { application: { userId: user.id } },
      }),
      prisma.offer.deleteMany({
        where: { application: { userId: user.id } },
      }),
      prisma.application.deleteMany({ where: { userId: user.id } }),
      prisma.savedJob.deleteMany({ where: { userId: user.id } }),
      prisma.company.deleteMany({ where: { userId: user.id } }),
      prisma.cvProfile.deleteMany({ where: { userId: user.id } }),
    ]);

    // Restore CV Profile
    if (data.cvProfile) {
      await prisma.cvProfile.create({
        data: {
          userId: user.id,
          fullName: data.cvProfile.fullName,
          email: data.cvProfile.email,
          phone: data.cvProfile.phone,
          location: data.cvProfile.location,
          linkedin: data.cvProfile.linkedin,
          website: data.cvProfile.website,
          summary: data.cvProfile.summary,
          experience: data.cvProfile.experience,
          education: data.cvProfile.education,
          skills: data.cvProfile.skills,
          projects: data.cvProfile.projects,
          certifications: data.cvProfile.certifications,
        },
      });
    }

    // Restore Companies first (for relations)
    const companyMap = new Map<string, string>();
    if (data.companies?.length) {
      for (const company of data.companies) {
        const created = await prisma.company.create({
          data: {
            userId: user.id,
            name: company.name,
            website: company.website,
            industry: company.industry,
            size: company.size,
            location: company.location,
            description: company.description,
            culture: company.culture,
            techStack: company.techStack,
            glassdoor: company.glassdoor,
            linkedin: company.linkedin,
            notes: company.notes,
            pros: company.pros,
            cons: company.cons,
            salaryRange: company.salaryRange,
            interviewProcess: company.interviewProcess,
          },
        });
        companyMap.set(company.id, created.id);
      }
    }

    // Restore Saved Jobs
    const jobMap = new Map<string, string>();
    if (data.savedJobs?.length) {
      for (const job of data.savedJobs) {
        const created = await prisma.savedJob.create({
          data: {
            userId: user.id,
            externalId: job.externalId,
            source: job.source,
            title: job.title,
            company: job.company,
            location: job.location,
            description: job.description,
            requirements: job.requirements,
            salary: job.salary,
            jobType: job.jobType,
            applyUrl: job.applyUrl,
            companyLogo: job.companyLogo,
            postedAt: job.postedAt ? new Date(job.postedAt) : null,
            companyId: job.companyId ? companyMap.get(job.companyId) : null,
            salaryMin: job.salaryMin,
            salaryMax: job.salaryMax,
            salaryExpectation: job.salaryExpectation,
          },
        });
        jobMap.set(job.id, created.id);
      }
    }

    // Restore Applications
    const appMap = new Map<string, string>();
    if (data.applications?.length) {
      for (const app of data.applications) {
        const newJobId = jobMap.get(app.jobId);
        if (newJobId) {
          const created = await prisma.application.create({
            data: {
              userId: user.id,
              jobId: newJobId,
              status: app.status,
              notes: app.notes,
              appliedAt: app.appliedAt ? new Date(app.appliedAt) : null,
              nextStep: app.nextStep,
            },
          });
          appMap.set(app.id, created.id);
        }
      }
    }

    // Restore Contacts
    if (data.contacts?.length) {
      for (const contact of data.contacts) {
        const created = await prisma.contact.create({
          data: {
            userId: user.id,
            name: contact.name,
            company: contact.company,
            companyId: contact.companyId ? companyMap.get(contact.companyId) : null,
            role: contact.role,
            email: contact.email,
            phone: contact.phone,
            linkedInUrl: contact.linkedInUrl,
            relationshipType: contact.relationshipType,
            notes: contact.notes,
            tags: contact.tags,
          },
        });

        // Restore interactions
        if (contact.interactions?.length) {
          for (const interaction of contact.interactions) {
            await prisma.contactInteraction.create({
              data: {
                contactId: created.id,
                type: interaction.type,
                date: new Date(interaction.date),
                notes: interaction.notes,
                nextAction: interaction.nextAction,
              },
            });
          }
        }
      }
    }

    // Restore Templates
    if (data.templates?.length) {
      for (const template of data.templates) {
        await prisma.applicationTemplate.create({
          data: {
            userId: user.id,
            category: template.category,
            question: template.question,
            answer: template.answer,
            tags: template.tags,
            charCount: template.charCount,
            usageCount: template.usageCount || 0,
          },
        });
      }
    }

    // Restore Alerts
    if (data.alerts?.length) {
      for (const alert of data.alerts) {
        await prisma.jobAlert.create({
          data: {
            userId: user.id,
            name: alert.name,
            query: alert.query,
            location: alert.location,
            filters: alert.filters,
            sources: alert.sources,
            frequency: alert.frequency,
            enabled: alert.enabled,
          },
        });
      }
    }

    // Restore Skills
    if (data.skills?.length) {
      for (const skill of data.skills) {
        await prisma.skillAnalysis.create({
          data: {
            userId: user.id,
            skill: skill.skill,
            demandCount: skill.demandCount,
            hasSkill: skill.hasSkill,
            priority: skill.priority,
            resources: skill.resources,
            notes: skill.notes,
            status: skill.status,
          },
        });
      }
    }

    return NextResponse.json({
      message: "Restore completed",
      restoredFrom: backup.name,
    });
  } catch (error) {
    console.error("Restore error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Restore failed" },
      { status: 500 }
    );
  }
}
