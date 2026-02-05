const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = "jsearch.p.rapidapi.com";

export interface JSearchJob {
  job_id: string;
  employer_name: string;
  employer_logo: string | null;
  job_title: string;
  job_description: string;
  job_apply_link: string;
  job_employment_type: string;
  job_city: string;
  job_state: string;
  job_country: string;
  job_min_salary: number | null;
  job_max_salary: number | null;
  job_salary_currency: string | null;
  job_salary_period: string | null;
  job_posted_at_datetime_utc: string;
  job_required_skills: string[] | null;
}

export interface JSearchResponse {
  status: string;
  data: JSearchJob[];
}

export async function searchJobs(params: {
  query: string;
  page?: number;
  datePosted?: string;
  remoteOnly?: boolean;
  employmentType?: string;
  jobRequirements?: string;
  radius?: number;
}): Promise<JSearchResponse> {
  if (!RAPIDAPI_KEY) {
    throw new Error("RAPIDAPI_KEY not configured. Add it to your .env file.");
  }

  const searchParams = new URLSearchParams({
    query: params.query,
    page: String(params.page || 1),
    num_pages: "1",
  });

  if (params.datePosted) searchParams.set("date_posted", params.datePosted);
  if (params.remoteOnly) searchParams.set("remote_jobs_only", "true");
  if (params.employmentType)
    searchParams.set("employment_types", params.employmentType);
  if (params.jobRequirements)
    searchParams.set("job_requirements", params.jobRequirements);
  if (params.radius) searchParams.set("radius", String(params.radius));

  const response = await fetch(
    `https://${RAPIDAPI_HOST}/search?${searchParams.toString()}`,
    {
      headers: {
        "x-rapidapi-key": RAPIDAPI_KEY,
        "x-rapidapi-host": RAPIDAPI_HOST,
      },
    }
  );

  if (!response.ok) {
    const body = await response.text();
    console.error("JSearch API error:", response.status, body);
    throw new Error(`JSearch API error: ${response.status} - ${body}`);
  }

  return response.json();
}
