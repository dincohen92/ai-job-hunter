import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { callClaude } from "@/lib/claude";

// Common skill aliases for normalization
const skillAliases: Record<string, string[]> = {
  javascript: ["js", "javascript", "ecmascript", "es6", "es2015"],
  typescript: ["ts", "typescript"],
  react: ["react", "reactjs", "react.js"],
  "node.js": ["node", "nodejs", "node.js"],
  python: ["python", "python3", "py"],
  java: ["java"],
  "c++": ["c++", "cpp"],
  "c#": ["c#", "csharp", "c-sharp"],
  go: ["go", "golang"],
  rust: ["rust"],
  sql: ["sql", "mysql", "postgresql", "postgres"],
  mongodb: ["mongodb", "mongo"],
  aws: ["aws", "amazon web services"],
  docker: ["docker", "containerization"],
  kubernetes: ["kubernetes", "k8s"],
  git: ["git", "github", "gitlab", "version control"],
  agile: ["agile", "scrum", "kanban"],
  rest: ["rest", "restful", "rest api"],
  graphql: ["graphql", "gql"],
  vue: ["vue", "vuejs", "vue.js"],
  angular: ["angular", "angularjs"],
  nextjs: ["nextjs", "next.js", "next"],
  css: ["css", "css3", "styling"],
  html: ["html", "html5"],
  tailwind: ["tailwind", "tailwindcss"],
};

function normalizeSkill(skill: string): string {
  const lower = skill.toLowerCase().trim();
  for (const [canonical, aliases] of Object.entries(skillAliases)) {
    if (aliases.includes(lower)) {
      return canonical;
    }
  }
  return lower;
}

interface SkillExtraction {
  skills: string[];
  required: string[];
  preferred: string[];
}

export async function POST() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get user's saved jobs
  const savedJobs = await prisma.savedJob.findMany({
    where: { userId: user.id },
    select: { description: true, requirements: true },
  });

  if (savedJobs.length === 0) {
    return NextResponse.json({
      message: "No saved jobs to analyze",
      count: 0,
    });
  }

  // Get user's CV profile skills
  const cvProfile = await prisma.cvProfile.findUnique({
    where: { userId: user.id },
    select: { skills: true },
  });

  let userSkills: string[] = [];
  if (cvProfile?.skills) {
    try {
      userSkills = JSON.parse(cvProfile.skills).map((s: string) =>
        normalizeSkill(s)
      );
    } catch {
      // If not JSON, try splitting by comma
      userSkills = cvProfile.skills.split(",").map((s) => normalizeSkill(s));
    }
  }

  // Aggregate skill counts from job descriptions
  const skillCounts: Record<string, { count: number; required: number }> = {};

  // Process jobs in batches
  const batchSize = 5;
  for (let i = 0; i < savedJobs.length; i += batchSize) {
    const batch = savedJobs.slice(i, i + batchSize);
    const jobTexts = batch
      .map((j) => `${j.description}\n${j.requirements || ""}`)
      .join("\n---\n");

    const prompt = `Extract all technical skills, tools, and technologies mentioned in these job descriptions.

JOB DESCRIPTIONS:
${jobTexts.slice(0, 8000)}

Return a JSON object with:
- skills: array of ALL skills mentioned
- required: array of skills marked as required/must-have
- preferred: array of skills marked as preferred/nice-to-have

Example: {"skills": ["React", "TypeScript", "AWS"], "required": ["React"], "preferred": ["AWS"]}`;

    try {
      const response = await callClaude(
        "You are a skill extraction AI. Return only valid JSON.",
        prompt,
        { maxTokens: 2048, temperature: 0.2 }
      );

      const extraction = JSON.parse(response.text) as SkillExtraction;

      for (const skill of extraction.skills) {
        const normalized = normalizeSkill(skill);
        if (!skillCounts[normalized]) {
          skillCounts[normalized] = { count: 0, required: 0 };
        }
        skillCounts[normalized].count++;
        if (extraction.required.map(normalizeSkill).includes(normalized)) {
          skillCounts[normalized].required++;
        }
      }
    } catch (error) {
      console.error("Error extracting skills from batch:", error);
    }
  }

  // Generate learning resources for top missing skills
  const missingSkills = Object.entries(skillCounts)
    .filter(([skill]) => !userSkills.includes(skill))
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 20);

  // Save skill analysis to database
  let created = 0;
  for (const [skill, data] of Object.entries(skillCounts)) {
    const hasSkill = userSkills.includes(skill);
    const priority =
      data.required > 2 ? "high" : data.count > 3 ? "medium" : "low";

    // Generate resources for missing high-demand skills
    let resources: string[] = [];
    if (!hasSkill && data.count >= 2) {
      resources = [
        `https://www.google.com/search?q=learn+${encodeURIComponent(skill)}+tutorial`,
        `https://www.udemy.com/courses/search/?q=${encodeURIComponent(skill)}`,
        `https://www.coursera.org/search?query=${encodeURIComponent(skill)}`,
      ];
    }

    try {
      await prisma.skillAnalysis.upsert({
        where: {
          userId_skill: { userId: user.id, skill },
        },
        create: {
          userId: user.id,
          skill,
          demandCount: data.count,
          hasSkill,
          priority,
          resources: resources.length > 0 ? JSON.stringify(resources) : null,
          status: hasSkill ? "acquired" : "gap",
        },
        update: {
          demandCount: data.count,
          hasSkill,
          priority,
          resources: resources.length > 0 ? JSON.stringify(resources) : null,
        },
      });
      created++;
    } catch (error) {
      console.error("Error saving skill:", error);
    }
  }

  return NextResponse.json({
    message: `Analyzed ${savedJobs.length} jobs, found ${created} skills`,
    count: created,
    gaps: missingSkills.length,
  });
}
