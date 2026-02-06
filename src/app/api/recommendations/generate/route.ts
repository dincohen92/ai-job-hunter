import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { callClaude } from "@/lib/claude";

interface RecommendationScore {
  jobId: string;
  score: number;
  reason: string;
}

export async function POST() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get user's CV profile
  const cvProfile = await prisma.cvProfile.findUnique({
    where: { userId: user.id },
  });

  // Get user's preferences
  const preferences = await prisma.userPreference.findUnique({
    where: { userId: user.id },
  });

  // Get user's saved jobs that haven't been recommended yet
  const savedJobs = await prisma.savedJob.findMany({
    where: {
      userId: user.id,
      recommendations: { none: { userId: user.id } },
      application: null, // Only jobs not yet applied to
    },
    take: 50, // Limit to avoid token limits
  });

  if (savedJobs.length === 0) {
    return NextResponse.json({ message: "No new jobs to recommend", count: 0 });
  }

  // Build profile context
  const profileContext = cvProfile
    ? `
User Skills: ${cvProfile.skills || "Not specified"}
Experience: ${cvProfile.experience || "Not specified"}
Summary: ${cvProfile.summary || "Not specified"}
Location: ${cvProfile.location || "Not specified"}
`
    : "No CV profile available";

  const preferencesContext = preferences
    ? `
Preferred Job Titles: ${preferences.preferredTitles || "Any"}
Preferred Skills: ${preferences.preferredSkills || "Any"}
Companies to Avoid: ${preferences.avoidCompanies || "None"}
Minimum Salary: ${preferences.minSalary ? `$${preferences.minSalary.toLocaleString()}` : "Not specified"}
Remote Only: ${preferences.remoteOnly ? "Yes" : "No"}
Preferred Locations: ${preferences.locations || "Any"}
`
    : "No preferences set";

  // Score each job using AI
  const recommendations: RecommendationScore[] = [];

  // Process jobs in batches to avoid token limits
  const batchSize = 10;
  for (let i = 0; i < savedJobs.length; i += batchSize) {
    const batch = savedJobs.slice(i, i + batchSize);

    const jobsForScoring = batch.map((job) => ({
      id: job.id,
      title: job.title,
      company: job.company,
      location: job.location || "Not specified",
      description: job.description.slice(0, 500), // Truncate to save tokens
      salary: job.salary || "Not specified",
      jobType: job.jobType || "Not specified",
    }));

    const prompt = `You are a job matching assistant. Score how well each job matches this candidate.

USER PROFILE:
${profileContext}

USER PREFERENCES:
${preferencesContext}

JOBS TO SCORE:
${JSON.stringify(jobsForScoring, null, 2)}

For each job, provide a score from 0 to 1 (where 1 is perfect match) and a brief reason (1 sentence).

Respond in JSON format:
[
  {"jobId": "...", "score": 0.85, "reason": "Strong match for your React and TypeScript skills"},
  ...
]

Consider:
- Skill match
- Experience level fit
- Location/remote preferences
- Salary expectations
- Career goals alignment`;

    try {
      const response = await callClaude(
        "You are a job matching AI. Return only valid JSON arrays.",
        prompt,
        { maxTokens: 2048, temperature: 0.3 }
      );

      const scores = JSON.parse(response.text) as RecommendationScore[];
      recommendations.push(...scores);
    } catch (error) {
      console.error("Error scoring batch:", error);
      // Continue with other batches
    }
  }

  // Save recommendations to database
  let created = 0;
  for (const rec of recommendations) {
    try {
      await prisma.jobRecommendation.upsert({
        where: {
          userId_jobId: { userId: user.id, jobId: rec.jobId },
        },
        create: {
          userId: user.id,
          jobId: rec.jobId,
          score: rec.score,
          reason: rec.reason,
        },
        update: {
          score: rec.score,
          reason: rec.reason,
        },
      });
      created++;
    } catch (error) {
      console.error("Error saving recommendation:", error);
    }
  }

  return NextResponse.json({
    message: `Generated ${created} recommendations`,
    count: created,
  });
}
