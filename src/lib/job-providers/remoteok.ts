import { JobSearchProvider, JobSearchParams, JobSearchResult, NormalizedJob } from "./types";

interface RemoteOKJob {
  id: string;
  epoch: number;
  date: string;
  company: string;
  company_logo: string;
  position: string;
  tags: string[];
  description: string;
  location: string;
  salary_min?: number;
  salary_max?: number;
  url: string;
}

function normalizeJob(job: RemoteOKJob): NormalizedJob {
  const salary =
    job.salary_min && job.salary_max
      ? `$${job.salary_min.toLocaleString()} - $${job.salary_max.toLocaleString()}`
      : undefined;

  return {
    externalId: `remoteok_${job.id}`,
    source: "remoteok",
    title: job.position,
    company: job.company,
    location: job.location || "Remote",
    description: job.description,
    salary,
    salaryMin: job.salary_min,
    salaryMax: job.salary_max,
    jobType: "Remote",
    applyUrl: job.url,
    companyLogo: job.company_logo || undefined,
    postedAt: new Date(job.epoch * 1000),
    tags: job.tags,
  };
}

export class RemoteOKProvider implements JobSearchProvider {
  name = "remoteok";
  displayName = "RemoteOK";

  isConfigured(): boolean {
    return true; // No API key needed
  }

  async search(params: JobSearchParams): Promise<JobSearchResult> {
    // RemoteOK API doesn't support pagination, but we can filter client-side
    const response = await fetch("https://remoteok.com/api", {
      headers: {
        "User-Agent": "AI Job Hunter App",
      },
    });

    if (!response.ok) {
      throw new Error(`RemoteOK API error: ${response.status}`);
    }

    const data = await response.json();
    // First item is legal notice, skip it
    const allJobs: RemoteOKJob[] = Array.isArray(data) ? data.slice(1) : [];

    // Filter by query
    const queryLower = params.query.toLowerCase();
    const filteredJobs = allJobs.filter((job) => {
      const searchText = `${job.position} ${job.company} ${job.description} ${job.tags?.join(" ")}`.toLowerCase();
      return searchText.includes(queryLower);
    });

    // Paginate
    const page = params.page || 1;
    const limit = params.limit || 10;
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedJobs = filteredJobs.slice(start, end);

    return {
      jobs: paginatedJobs.map(normalizeJob),
      totalCount: filteredJobs.length,
      page,
      hasMore: end < filteredJobs.length,
      source: this.name,
    };
  }
}
