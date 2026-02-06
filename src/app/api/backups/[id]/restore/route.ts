import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

/* eslint-disable @typescript-eslint/no-unused-vars */

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

  // Delete existing data (careful!)
  await prisma.$transaction([
    prisma.skillAnalysis.deleteMany({ where: { userId: user.id } }),
    prisma.jobAlert.deleteMany({ where: { userId: user.id } }),
    prisma.applicationTemplate.deleteMany({ where: { userId: user.id } }),
    prisma.contactInteraction.deleteMany({
      where: { contact: { userId: user.id } },
    }),
    prisma.contact.deleteMany({ where: { userId: user.id } }),
    prisma.company.deleteMany({ where: { userId: user.id } }),
    prisma.interview.deleteMany({
      where: { application: { userId: user.id } },
    }),
    prisma.offer.deleteMany({
      where: { application: { userId: user.id } },
    }),
    prisma.application.deleteMany({ where: { userId: user.id } }),
    prisma.savedJob.deleteMany({ where: { userId: user.id } }),
    prisma.cvProfile.deleteMany({ where: { userId: user.id } }),
  ]);

  // Restore CV Profile
  if (data.cvProfile) {
    const { id: _, userId: __, ...profileData } = data.cvProfile;
    await prisma.cvProfile.create({
      data: {
        userId: user.id,
        ...profileData,
      },
    });
  }

  // Restore Companies first (for relations)
  const companyMap = new Map<string, string>();
  if (data.companies?.length) {
    for (const company of data.companies) {
      const { id: oldId, userId: _, ...companyData } = company;
      const created = await prisma.company.create({
        data: {
          userId: user.id,
          ...companyData,
        },
      });
      companyMap.set(oldId, created.id);
    }
  }

  // Restore Saved Jobs
  const jobMap = new Map<string, string>();
  if (data.savedJobs?.length) {
    for (const job of data.savedJobs) {
      const {
        id: oldId,
        userId: _,
        companyId,
        application: __,
        companyRef: ___,
        ...jobData
      } = job;
      const created = await prisma.savedJob.create({
        data: {
          userId: user.id,
          ...jobData,
          companyId: companyId ? companyMap.get(companyId) : null,
        },
      });
      jobMap.set(oldId, created.id);
    }
  }

  // Restore Applications
  const appMap = new Map<string, string>();
  if (data.applications?.length) {
    for (const app of data.applications) {
      const {
        id: oldId,
        userId: _,
        jobId,
        job: __,
        interviews: ___,
        offer: ____,
        ...appData
      } = app;
      const newJobId = jobMap.get(jobId);
      if (newJobId) {
        const created = await prisma.application.create({
          data: {
            userId: user.id,
            jobId: newJobId,
            ...appData,
          },
        });
        appMap.set(oldId, created.id);
      }
    }
  }

  // Restore Contacts
  if (data.contacts?.length) {
    for (const contact of data.contacts) {
      const {
        id: _,
        userId: __,
        companyId,
        interactions,
        companyRef: ___,
        ...contactData
      } = contact;
      const created = await prisma.contact.create({
        data: {
          userId: user.id,
          ...contactData,
          companyId: companyId ? companyMap.get(companyId) : null,
        },
      });

      // Restore interactions
      if (interactions?.length) {
        for (const interaction of interactions) {
          const { id: _, contactId: __, ...intData } = interaction;
          await prisma.contactInteraction.create({
            data: {
              contactId: created.id,
              ...intData,
            },
          });
        }
      }
    }
  }

  // Restore Templates
  if (data.templates?.length) {
    for (const template of data.templates) {
      const { id: _, userId: __, ...templateData } = template;
      await prisma.applicationTemplate.create({
        data: {
          userId: user.id,
          ...templateData,
        },
      });
    }
  }

  // Restore Alerts
  if (data.alerts?.length) {
    for (const alert of data.alerts) {
      const { id: _, userId: __, ...alertData } = alert;
      await prisma.jobAlert.create({
        data: {
          userId: user.id,
          ...alertData,
        },
      });
    }
  }

  // Restore Skills
  if (data.skills?.length) {
    for (const skill of data.skills) {
      const { id: _, userId: __, ...skillData } = skill;
      await prisma.skillAnalysis.create({
        data: {
          userId: user.id,
          ...skillData,
        },
      });
    }
  }

  return NextResponse.json({
    message: "Restore completed",
    restoredFrom: backup.name,
  });
}
