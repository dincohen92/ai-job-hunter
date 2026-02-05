import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const days = parseInt(searchParams.get("days") || "30", 10);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Fetch all applications with their jobs
  const applications = await prisma.application.findMany({
    where: { userId: user.id },
    include: { job: true },
    orderBy: { createdAt: "asc" },
  });

  // Fetch all saved jobs
  const savedJobs = await prisma.savedJob.findMany({
    where: { userId: user.id },
  });

  // Calculate funnel metrics
  const totalSaved = applications.length;
  const applied = applications.filter(
    (a) => a.status !== "saved" && a.appliedAt
  ).length;
  const interviewing = applications.filter((a) =>
    ["interviewing", "offer", "accepted"].includes(a.status)
  ).length;
  const offers = applications.filter((a) =>
    ["offer", "accepted"].includes(a.status)
  ).length;
  const accepted = applications.filter((a) => a.status === "accepted").length;
  const rejected = applications.filter((a) => a.status === "rejected").length;

  // Calculate rates
  const responseRate = applied > 0 ? ((interviewing / applied) * 100).toFixed(1) : "0";
  const interviewRate = applied > 0 ? ((interviewing / applied) * 100).toFixed(1) : "0";
  const offerRate = interviewing > 0 ? ((offers / interviewing) * 100).toFixed(1) : "0";
  const acceptRate = offers > 0 ? ((accepted / offers) * 100).toFixed(1) : "0";

  // Status counts for funnel
  const statusCounts = {
    saved: applications.filter((a) => a.status === "saved").length,
    applied: applications.filter((a) => a.status === "applied").length,
    interviewing: applications.filter((a) => a.status === "interviewing").length,
    offer: applications.filter((a) => a.status === "offer").length,
    accepted: applications.filter((a) => a.status === "accepted").length,
    rejected: applications.filter((a) => a.status === "rejected").length,
  };

  // Activity over time (last N days)
  const activityByDay: Record<string, { applications: number; jobs: number }> = {};
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];
    activityByDay[dateStr] = { applications: 0, jobs: 0 };
  }

  applications.forEach((app) => {
    const dateStr = app.createdAt.toISOString().split("T")[0];
    if (activityByDay[dateStr]) {
      activityByDay[dateStr].applications++;
    }
  });

  savedJobs.forEach((job) => {
    const dateStr = job.createdAt.toISOString().split("T")[0];
    if (activityByDay[dateStr]) {
      activityByDay[dateStr].jobs++;
    }
  });

  // Convert to array sorted by date
  const activityTrend = Object.entries(activityByDay)
    .map(([date, counts]) => ({ date, ...counts }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Breakdown by source
  const sourceBreakdown: Record<string, { total: number; applied: number; interviewing: number }> = {};
  applications.forEach((app) => {
    const source = app.job.source || "unknown";
    if (!sourceBreakdown[source]) {
      sourceBreakdown[source] = { total: 0, applied: 0, interviewing: 0 };
    }
    sourceBreakdown[source].total++;
    if (app.status !== "saved") sourceBreakdown[source].applied++;
    if (["interviewing", "offer", "accepted"].includes(app.status)) {
      sourceBreakdown[source].interviewing++;
    }
  });

  // Breakdown by job type
  const jobTypeBreakdown: Record<string, number> = {};
  applications.forEach((app) => {
    const jobType = app.job.jobType || "unspecified";
    jobTypeBreakdown[jobType] = (jobTypeBreakdown[jobType] || 0) + 1;
  });

  // Top companies applied to
  const companyCount: Record<string, number> = {};
  applications.forEach((app) => {
    companyCount[app.job.company] = (companyCount[app.job.company] || 0) + 1;
  });
  const topCompanies = Object.entries(companyCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([company, count]) => ({ company, count }));

  // Weekly summary
  const thisWeekStart = new Date();
  thisWeekStart.setDate(thisWeekStart.getDate() - 7);
  const lastWeekStart = new Date();
  lastWeekStart.setDate(lastWeekStart.getDate() - 14);

  const thisWeekApps = applications.filter(
    (a) => a.createdAt >= thisWeekStart
  ).length;
  const lastWeekApps = applications.filter(
    (a) => a.createdAt >= lastWeekStart && a.createdAt < thisWeekStart
  ).length;
  const weeklyChange = lastWeekApps > 0
    ? (((thisWeekApps - lastWeekApps) / lastWeekApps) * 100).toFixed(0)
    : thisWeekApps > 0 ? "100" : "0";

  return NextResponse.json({
    summary: {
      totalApplications: totalSaved,
      applied,
      interviewing,
      offers,
      accepted,
      rejected,
      responseRate: parseFloat(responseRate),
      interviewRate: parseFloat(interviewRate),
      offerRate: parseFloat(offerRate),
      acceptRate: parseFloat(acceptRate),
    },
    funnel: statusCounts,
    activityTrend,
    sourceBreakdown: Object.entries(sourceBreakdown).map(([source, data]) => ({
      source,
      ...data,
    })),
    jobTypeBreakdown: Object.entries(jobTypeBreakdown).map(([type, count]) => ({
      type,
      count,
    })),
    topCompanies,
    weeklyComparison: {
      thisWeek: thisWeekApps,
      lastWeek: lastWeekApps,
      changePercent: parseInt(weeklyChange),
    },
  });
}
