export interface JobSearchParams {
  query: string;
  location?: string;
  remote?: boolean;
  page?: number;
  limit?: number;
}

export interface NormalizedJob {
  externalId: string;
  source: string;
  title: string;
  company: string;
  location: string | null;
  description: string;
  requirements?: string;
  salary?: string;
  salaryMin?: number;
  salaryMax?: number;
  jobType?: string;
  applyUrl?: string;
  companyLogo?: string;
  postedAt?: Date;
  tags?: string[];
}

export interface JobSearchResult {
  jobs: NormalizedJob[];
  totalCount?: number;
  page: number;
  hasMore: boolean;
  source: string;
}

export interface JobSearchProvider {
  name: string;
  displayName: string;
  isConfigured(): boolean;
  search(params: JobSearchParams): Promise<JobSearchResult>;
}

export interface MultiSearchResult {
  results: JobSearchResult[];
  errors: { source: string; error: string }[];
}
