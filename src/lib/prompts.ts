export function buildResumeAnalysisPrompt(resumeText: string) {
  return {
    system: `You are an expert career coach and resume reviewer. Analyze the resume and return a structured JSON response with these fields:

{
  "summary": "Brief professional summary extracted or inferred",
  "skills": ["skill1", "skill2"],
  "experience": [
    {
      "title": "Job Title",
      "company": "Company Name",
      "duration": "Date Range",
      "highlights": ["achievement 1", "achievement 2"]
    }
  ],
  "education": [
    {
      "degree": "Degree",
      "institution": "School",
      "year": "Year"
    }
  ],
  "strengths": ["strength 1", "strength 2"],
  "weaknesses": ["area for improvement 1"],
  "overallScore": 75
}

Return ONLY valid JSON, no markdown formatting or extra text.`,
    user: `Please analyze this resume:\n\n${resumeText}`,
  };
}

export function buildResumeTailoringPrompt(
  resumeText: string,
  jobDescription: string,
  jobTitle: string,
  company: string
) {
  return {
    system: `You are an expert resume writer and ATS optimization specialist. Tailor a resume to match a specific job posting while keeping content truthful.

Rules:
- Do NOT fabricate experience or skills the candidate does not have
- DO reorder, rephrase, and emphasize existing experience to match job requirements
- DO mirror keywords and phrases from the job description where they honestly apply
- DO quantify achievements where possible
- DO adjust the professional summary to target this specific role

Return a JSON response:
{
  "tailoredResume": "The full tailored resume text",
  "matchScore": 82,
  "changes": ["Reworded summary to emphasize X", "Added keyword Y"],
  "missingSkills": ["skill they should learn"],
  "suggestions": ["Consider getting X certification"]
}

Return ONLY valid JSON.`,
    user: `ORIGINAL RESUME:\n${resumeText}\n\nTARGET JOB:\nTitle: ${jobTitle}\nCompany: ${company}\n\nJOB DESCRIPTION:\n${jobDescription}\n\nPlease tailor this resume for the job above.`,
  };
}

export function buildOutreachEmailPrompt(
  resumeSummary: string,
  jobTitle: string,
  company: string,
  recipientName: string | null,
  tone: "professional" | "casual" | "enthusiastic"
) {
  return {
    system: `You are an expert at writing personalized recruiter outreach emails. Write a concise, compelling email that:

- Is 150-250 words maximum
- Has a compelling subject line
- References the specific role and company
- Highlights 2-3 relevant qualifications
- Includes a clear call to action
- Matches the requested tone: ${tone}
- Feels personal, not templated

Return a JSON response:
{
  "subject": "Email subject line",
  "body": "Full email body in HTML format with <p> tags",
  "plainText": "Plain text version"
}

Return ONLY valid JSON.`,
    user: `CANDIDATE BACKGROUND:\n${resumeSummary}\n\nTARGET:\nRole: ${jobTitle}\nCompany: ${company}\nRecipient: ${recipientName || "Hiring Manager"}\n\nPlease write a ${tone} outreach email.`,
  };
}

import type { CvProfileData } from "@/types/cv";

export function buildCvParsingPrompt(rawText: string) {
  return {
    system: `You are an expert resume parser. Extract ALL information from the document into a structured JSON format. Be thorough - capture every detail including all work experience, education, projects, skills, and certifications. If information is not present, use empty strings or empty arrays.

Return this exact JSON structure:
{
  "fullName": "...",
  "email": "...",
  "phone": "...",
  "location": "...",
  "linkedin": "...",
  "website": "...",
  "summary": "...",
  "experience": [
    {
      "id": "exp-1",
      "title": "Job Title",
      "company": "Company Name",
      "location": "City, State",
      "startDate": "YYYY-MM",
      "endDate": "YYYY-MM",
      "current": false,
      "description": "Role description",
      "highlights": ["achievement 1", "achievement 2"]
    }
  ],
  "education": [
    {
      "id": "edu-1",
      "degree": "Degree Name",
      "field": "Field of Study",
      "institution": "School Name",
      "location": "City, State",
      "startDate": "YYYY-MM",
      "endDate": "YYYY-MM",
      "gpa": "",
      "highlights": []
    }
  ],
  "skills": ["skill1", "skill2"],
  "projects": [
    {
      "id": "proj-1",
      "name": "Project Name",
      "description": "What it does",
      "url": "",
      "technologies": ["tech1"],
      "highlights": ["highlight1"]
    }
  ],
  "certifications": [
    {
      "id": "cert-1",
      "name": "Certification Name",
      "issuer": "Issuing Organization",
      "date": "YYYY-MM",
      "url": ""
    }
  ]
}

Return ONLY valid JSON, no markdown formatting or extra text.`,
    user: `Parse this resume/CV document into the structured format:\n\n${rawText}`,
  };
}

export function buildCvResumeGenerationPrompt(
  cvData: CvProfileData,
  jobDescription: string,
  jobTitle: string,
  company: string
) {
  const experienceText = cvData.experience
    .map(
      (e) =>
        `${e.title} at ${e.company} (${e.startDate} - ${e.current ? "Present" : e.endDate || "N/A"})${e.location ? ` | ${e.location}` : ""}
${e.description}
${e.highlights.map((h) => `- ${h}`).join("\n")}`
    )
    .join("\n\n");

  const educationText = cvData.education
    .map(
      (e) =>
        `${e.degree}${e.field ? ` in ${e.field}` : ""} - ${e.institution} (${e.endDate || "N/A"})${e.gpa ? ` | GPA: ${e.gpa}` : ""}
${e.highlights.length > 0 ? e.highlights.map((h) => `- ${h}`).join("\n") : ""}`
    )
    .join("\n\n");

  const projectsText = cvData.projects
    .map(
      (p) =>
        `${p.name}: ${p.description}
Technologies: ${p.technologies.join(", ")}
${p.highlights.map((h) => `- ${h}`).join("\n")}`
    )
    .join("\n\n");

  const certsText = cvData.certifications
    .map((c) => `${c.name} - ${c.issuer} (${c.date || "N/A"})`)
    .join("\n");

  return {
    system: `You are an expert resume writer and ATS optimization specialist. Given a candidate's complete professional profile and a target job, create a tailored 1-page resume.

Rules:
- SELECT the most relevant experience, skills, and projects from the candidate's full profile
- Do NOT fabricate experience or skills the candidate does not have
- DO reorder and emphasize experience to match job requirements
- DO mirror keywords from the job description where they honestly apply
- DO quantify achievements where possible
- DO write a targeted professional summary for this specific role
- OMIT less relevant experience if space is limited (this is a resume, not the full CV)
- FORMAT the resume text with clear sections using markdown headers and bullet points

Return a JSON response:
{
  "resume": "The full tailored resume text formatted with markdown headers (## Section) and bullet points",
  "resumeHtml": "Same resume as clean HTML suitable for printing. Use semantic tags: <h1> for name, <h2> for sections, <p>, <ul>, <li>. Include minimal inline styles for professional appearance.",
  "matchScore": 82,
  "changes": ["Selected X experience over Y because...", "Emphasized skill Z"],
  "missingSkills": ["skill the job wants but candidate lacks"],
  "suggestions": ["Consider getting X certification"]
}

Return ONLY valid JSON.`,
    user: `CANDIDATE PROFILE:
Name: ${cvData.fullName}
Email: ${cvData.email}
${cvData.phone ? `Phone: ${cvData.phone}` : ""}
${cvData.location ? `Location: ${cvData.location}` : ""}
${cvData.linkedin ? `LinkedIn: ${cvData.linkedin}` : ""}
${cvData.website ? `Website: ${cvData.website}` : ""}

PROFESSIONAL SUMMARY:
${cvData.summary || "Not provided"}

WORK EXPERIENCE:
${experienceText || "None provided"}

EDUCATION:
${educationText || "None provided"}

SKILLS:
${cvData.skills.join(", ") || "None provided"}

PROJECTS:
${projectsText || "None provided"}

CERTIFICATIONS:
${certsText || "None provided"}

---

TARGET JOB:
Title: ${jobTitle}
Company: ${company}

JOB DESCRIPTION:
${jobDescription}

Please create a tailored 1-page resume for this specific job, selecting and emphasizing the most relevant parts of the candidate's profile.`,
  };
}

export function buildJobParsingPrompt(rawText: string) {
  return {
    system: `You are a job posting parser. Extract structured information from raw job posting text. Return a JSON response:

{
  "title": "Job Title",
  "company": "Company Name",
  "location": "Location or Remote",
  "jobType": "full-time | part-time | contract | remote",
  "salary": "Salary range if mentioned, or null",
  "description": "Clean, formatted job description",
  "requirements": ["requirement 1", "requirement 2"],
  "niceToHave": ["optional skill 1"],
  "benefits": ["benefit 1"]
}

Return ONLY valid JSON. If a field is not found, use null.`,
    user: `Parse this job posting:\n\n${rawText}`,
  };
}

export function buildCoverLetterPrompt(
  cvData: CvProfileData,
  jobDescription: string,
  jobTitle: string,
  company: string,
  tone: "professional" | "enthusiastic" | "creative"
) {
  const experienceHighlights = cvData.experience
    .slice(0, 3)
    .map((e) => `${e.title} at ${e.company}: ${e.highlights.slice(0, 2).join("; ")}`)
    .join("\n");

  const toneInstructions = {
    professional: "Maintain a formal, polished tone. Use industry-standard language and structure.",
    enthusiastic: "Show genuine excitement and passion for the role. Be energetic but still professional.",
    creative: "Be more conversational and memorable. Show personality while remaining appropriate.",
  };

  return {
    system: `You are an expert cover letter writer. Create a compelling, personalized cover letter that:

- Is 250-350 words (3-4 paragraphs)
- Has a strong opening that grabs attention
- Connects the candidate's specific experience to the job requirements
- Shows genuine knowledge/interest in the company
- Highlights 2-3 most relevant achievements with specifics
- Ends with a confident call to action
- Tone: ${toneInstructions[tone]}

Structure:
1. Opening: Hook + why this role/company
2. Body 1: Most relevant experience/achievement
3. Body 2: Additional relevant skills/accomplishments
4. Closing: Enthusiasm + call to action

Do NOT:
- Use cliches like "I am writing to apply for..."
- Be generic - make it specific to THIS job
- Fabricate experience the candidate doesn't have
- Exceed 400 words

Return ONLY the cover letter text. No JSON, no markdown formatting, no extra commentary.`,
    user: `CANDIDATE PROFILE:
Name: ${cvData.fullName}

PROFESSIONAL SUMMARY:
${cvData.summary || "Experienced professional"}

KEY EXPERIENCE:
${experienceHighlights || "Various professional experience"}

SKILLS:
${cvData.skills.slice(0, 15).join(", ") || "Various skills"}

---

TARGET JOB:
Title: ${jobTitle}
Company: ${company}

JOB DESCRIPTION:
${jobDescription}

---

Please write a ${tone} cover letter for this position.`,
  };
}
