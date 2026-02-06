import { JobSearchProvider, JobSearchParams, JobSearchResult, NormalizedJob } from "./types";

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = "jsearch.p.rapidapi.com";

interface JSearchJob {
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

function formatLocation(job: JSearchJob): string | null {
  const parts = [job.job_city, job.job_state, job.job_country].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : null;
}

function formatSalary(job: JSearchJob): string | undefined {
  if (job.job_min_salary && job.job_max_salary) {
    const currency = job.job_salary_currency || "USD";
    const period = job.job_salary_period || "year";
    return `${currency} ${job.job_min_salary.toLocaleString()} - ${job.job_max_salary.toLocaleString()} / ${period}`;
  }
  return undefined;
}

function normalizeJob(job: JSearchJob): NormalizedJob {
  return {
    externalId: job.job_id,
    source: "jsearch",
    title: job.job_title,
    company: job.employer_name,
    location: formatLocation(job),
    description: job.job_description,
    salary: formatSalary(job),
    salaryMin: job.job_min_salary || undefined,
    salaryMax: job.job_max_salary || undefined,
    jobType: job.job_employment_type,
    applyUrl: job.job_apply_link,
    companyLogo: job.employer_logo || undefined,
    postedAt: job.job_posted_at_datetime_utc
      ? new Date(job.job_posted_at_datetime_utc)
      : undefined,
    tags: job.job_required_skills || undefined,
  };
}

export class JSearchProvider implements JobSearchProvider {
  name = "jsearch";
  displayName = "JSearch";

  isConfigured(): boolean {
    return !!RAPIDAPI_KEY;
  }

  async search(params: JobSearchParams): Promise<JobSearchResult> {
    if (!RAPIDAPI_KEY) {
      throw new Error("RAPIDAPI_KEY not configured");
    }

    const searchParams = new URLSearchParams({
      query: params.query,
      page: String(params.page || 1),
      num_pages: "1",
    });

    if (params.location) {
      searchParams.set("query", `${params.query} in ${params.location}`);
    }
    if (params.remote) {
      searchParams.set("remote_jobs_only", "true");
    }

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
      throw new Error(`JSearch API error: ${response.status} - ${body}`);
    }

    const data = await response.json();
    const jobs: JSearchJob[] = data.data || [];

    return {
      jobs: jobs.map(normalizeJob),
      page: params.page || 1,
      hasMore: jobs.length >= 10,
      source: this.name,
    };
  }
}
