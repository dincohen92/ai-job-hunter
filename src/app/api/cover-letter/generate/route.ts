import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { callClaude } from "@/lib/claude";
import { buildCoverLetterPrompt } from "@/lib/prompts";
import type { CvProfileData } from "@/types/cv";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { jobId, tone = "professional" } = await req.json();

  if (!jobId) {
    return NextResponse.json({ error: "jobId is required" }, { status: 400 });
  }

  // Fetch job details
  const job = await prisma.savedJob.findFirst({
    where: { id: jobId, userId: user.id },
  });

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  // Fetch CV profile
  const cvProfile = await prisma.cvProfile.findUnique({
    where: { userId: user.id },
  });

  if (!cvProfile) {
    return NextResponse.json(
      { error: "CV Profile not found. Please create your CV profile first." },
      { status: 400 }
    );
  }

  // Parse CV data
  const cvData: CvProfileData = {
    fullName: cvProfile.fullName || "",
    email: cvProfile.email || "",
    phone: cvProfile.phone || "",
    location: cvProfile.location || "",
    linkedin: cvProfile.linkedin || "",
    website: cvProfile.website || "",
    summary: cvProfile.summary || "",
    experience: cvProfile.experience ? JSON.parse(cvProfile.experience) : [],
    education: cvProfile.education ? JSON.parse(cvProfile.education) : [],
    skills: cvProfile.skills ? JSON.parse(cvProfile.skills) : [],
    projects: cvProfile.projects ? JSON.parse(cvProfile.projects) : [],
    certifications: cvProfile.certifications ? JSON.parse(cvProfile.certifications) : [],
  };

  // Build prompt and call Claude
  const prompt = buildCoverLetterPrompt(
    cvData,
    job.description,
    job.title,
    job.company,
    tone as "professional" | "enthusiastic" | "creative"
  );

  try {
    const response = await callClaude(prompt.system, prompt.user, {
      maxTokens: 1024,
      temperature: 0.7,
    });

    // Return the generated cover letter (not saved yet - user can edit before saving)
    return NextResponse.json({
      content: response.text,
      tone,
      jobId,
      usage: response.usage,
    });
  } catch (error) {
    console.error("Cover letter generation failed:", error);
    return NextResponse.json(
      { error: "Failed to generate cover letter" },
      { status: 500 }
    );
  }
}
