import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Briefcase, FileText, Send, TrendingUp } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;

  const [jobCount, applicationCount, resumeCount, emailSentCount, recentJobs, recentApplications] =
    await Promise.all([
      prisma.savedJob.count({ where: { userId } }),
      prisma.application.count({ where: { userId } }),
      prisma.resume.count({ where: { userId } }),
      prisma.email.count({ where: { userId, status: "sent" } }),
      prisma.savedJob.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.application.findMany({
        where: { userId },
        include: { job: true },
        orderBy: { updatedAt: "desc" },
        take: 5,
      }),
    ]);

  const statusCounts = await prisma.application.groupBy({
    by: ["status"],
    where: { userId },
    _count: true,
  });

  const statusMap = Object.fromEntries(
    statusCounts.map((s) => [s.status, s._count])
  );

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Saved Jobs
            </CardTitle>
            <Briefcase className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{jobCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Applications
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{applicationCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Resumes
            </CardTitle>
            <FileText className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resumeCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Emails Sent
            </CardTitle>
            <Send className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{emailSentCount}</div>
          </CardContent>
        </Card>
      </div>

      {applicationCount > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Application Pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {["saved", "applied", "interviewing", "offer", "accepted", "rejected"].map(
                (status) => (
                  <div
                    key={status}
                    className="flex-1 min-w-[100px] rounded-lg border p-4 text-center"
                  >
                    <p className="text-2xl font-bold">
                      {statusMap[status] || 0}
                    </p>
                    <p className="text-sm capitalize text-gray-500">{status}</p>
                  </div>
                )
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Saved Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            {recentJobs.length === 0 ? (
              <p className="text-sm text-gray-500">
                No saved jobs yet.{" "}
                <Link href="/jobs" className="text-blue-600 hover:underline">
                  Search for jobs
                </Link>
              </p>
            ) : (
              <div className="space-y-3">
                {recentJobs.map((job) => (
                  <Link
                    key={job.id}
                    href={`/jobs/${job.id}`}
                    className="block rounded-md border p-3 transition-colors hover:bg-gray-50"
                  >
                    <p className="font-medium">{job.title}</p>
                    <p className="text-sm text-gray-500">{job.company}</p>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Applications</CardTitle>
          </CardHeader>
          <CardContent>
            {recentApplications.length === 0 ? (
              <p className="text-sm text-gray-500">
                No applications tracked yet. Save a job and update its status.
              </p>
            ) : (
              <div className="space-y-3">
                {recentApplications.map((app) => (
                  <Link
                    key={app.id}
                    href={`/jobs/${app.jobId}`}
                    className="flex items-center justify-between rounded-md border p-3 transition-colors hover:bg-gray-50"
                  >
                    <div>
                      <p className="font-medium">{app.job.title}</p>
                      <p className="text-sm text-gray-500">
                        {app.job.company}
                      </p>
                    </div>
                    <Badge className="capitalize">{app.status}</Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {jobCount === 0 && resumeCount === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600">
                  1
                </div>
                <div>
                  <p className="font-medium">Upload your resume</p>
                  <p className="text-sm text-gray-500">
                    Go to the{" "}
                    <Link
                      href="/resume"
                      className="text-blue-600 hover:underline"
                    >
                      Resume
                    </Link>{" "}
                    page and upload your resume.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600">
                  2
                </div>
                <div>
                  <p className="font-medium">Search for jobs</p>
                  <p className="text-sm text-gray-500">
                    Use the{" "}
                    <Link
                      href="/jobs"
                      className="text-blue-600 hover:underline"
                    >
                      Jobs
                    </Link>{" "}
                    page to find open positions.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600">
                  3
                </div>
                <div>
                  <p className="font-medium">Tailor & send</p>
                  <p className="text-sm text-gray-500">
                    AI will optimize your resume and craft outreach emails.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
