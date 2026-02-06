import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { callClaude } from "@/lib/claude";
import { buildCvResumeGenerationPrompt } from "@/lib/prompts";
import type { CvProfileData } from "@/types/cv";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { jobId } = await req.json();
  if (!jobId) {
    return NextResponse.json({ error: "jobId is required" }, { status: 400 });
  }

  const [cvProfile, job] = await Promise.all([
    prisma.cvProfile.findUnique({ where: { userId: user.id } }),
    prisma.savedJob.findFirst({ where: { id: jobId, userId: user.id } }),
  ]);

  if (!cvProfile) {
    return NextResponse.json(
      { error: "CV profile not found. Please create your CV first." },
      { status: 404 }
    );
  }
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const cvData: CvProfileData = {
    fullName: cvProfile.fullName || "",
    email: cvProfile.email || "",
    phone: cvProfile.phone || undefined,
    location: cvProfile.location || undefined,
    linkedin: cvProfile.linkedin || undefined,
    website: cvProfile.website || undefined,
    summary: cvProfile.summary || undefined,
    experience: cvProfile.experience ? JSON.parse(cvProfile.experience) : [],
    education: cvProfile.education ? JSON.parse(cvProfile.education) : [],
    skills: cvProfile.skills ? JSON.parse(cvProfile.skills) : [],
    projects: cvProfile.projects ? JSON.parse(cvProfile.projects) : [],
    certifications: cvProfile.certifications ? JSON.parse(cvProfile.certifications) : [],
  };

  try {
    const prompt = buildCvResumeGenerationPrompt(
      cvData,
      job.description,
      job.title,
      job.company
    );
    const result = await callClaude(prompt.system, prompt.user, {
      maxTokens: 8192,
    });
    const parsed = JSON.parse(result.text);

    const generated = await prisma.generatedResume.create({
      data: {
        cvProfileId: cvProfile.id,
        jobId,
        content: parsed.resume,
        contentHtml: parsed.resumeHtml || null,
        matchScore: parsed.matchScore || null,
        changes: JSON.stringify(parsed.changes || []),
        suggestions: JSON.stringify(parsed.suggestions || []),
      },
    });

    return NextResponse.json({
      id: generated.id,
      resume: parsed.resume,
      resumeHtml: parsed.resumeHtml,
      matchScore: parsed.matchScore,
      changes: parsed.changes,
      missingSkills: parsed.missingSkills,
      suggestions: parsed.suggestions,
    });
  } catch (error) {
    console.error("Resume generation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Generation failed" },
      { status: 500 }
    );
  }
}
