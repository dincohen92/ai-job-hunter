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
