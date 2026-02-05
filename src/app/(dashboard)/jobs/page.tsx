"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Search,
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  MapPin,
  Building,
  Loader2,
  Plus,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

interface Job {
  id?: string;
  job_id?: string;
  externalId?: string;
  title?: string;
  job_title?: string;
  company?: string;
  employer_name?: string;
  location?: string;
  job_city?: string;
  job_state?: string;
  description?: string;
  job_description?: string;
  salary?: string;
  job_min_salary?: number;
  job_max_salary?: number;
  job_salary_currency?: string;
  jobType?: string;
  job_employment_type?: string;
  applyUrl?: string;
  job_apply_link?: string;
  companyLogo?: string;
  employer_logo?: string;
  source?: string;
  application?: { status: string } | null;
}

function normalizeJob(job: Job) {
  return {
    id: job.id || job.job_id || "",
    externalId: job.job_id || job.externalId,
    title: job.title || job.job_title || "Untitled",
    company: job.company || job.employer_name || "Unknown",
    location:
      job.location ||
      [job.job_city, job.job_state].filter(Boolean).join(", ") ||
      null,
    description: job.description || job.job_description || "",
    salary:
      job.salary ||
      (job.job_min_salary && job.job_max_salary
        ? `${job.job_salary_currency || "$"}${job.job_min_salary.toLocaleString()} - ${job.job_salary_currency || "$"}${job.job_max_salary.toLocaleString()}`
        : null),
    jobType: job.jobType || job.job_employment_type || null,
    applyUrl: job.applyUrl || job.job_apply_link || null,
    companyLogo: job.companyLogo || job.employer_logo || null,
    source: job.source || "jsearch",
    application: job.application,
  };
}

export default function JobsPage() {
  const [query, setQuery] = useState("");
  const [datePosted, setDatePosted] = useState("all");
  const [remote, setRemote] = useState(false);
  const [employmentType, setEmploymentType] = useState("all");
  const [experience, setExperience] = useState("all");
  const [searchResults, setSearchResults] = useState<Job[]>([]);
  const [savedJobs, setSavedJobs] = useState<Job[]>([]);
  const [searching, setSearching] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [parsing, setParsing] = useState(false);

  useEffect(() => {
    fetchSavedJobs();
  }, []);

  async function fetchSavedJobs() {
    const res = await fetch("/api/jobs");
    if (res.ok) {
      const jobs = await res.json();
      setSavedJobs(jobs);
      setSavedIds(new Set(jobs.map((j: Job) => j.externalId).filter(Boolean)));
    }
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);

    const params = new URLSearchParams({ q: query });
    if (datePosted !== "all") params.set("datePosted", datePosted);
    if (remote) params.set("remote", "true");
    if (employmentType !== "all") params.set("type", employmentType);
    if (experience !== "all") params.set("experience", experience);

    try {
      const res = await fetch(`/api/jobs/search?${params}`);
      const data = await res.json();
      if (data.error) {
        alert(data.error);
      } else {
        setSearchResults(data.data || []);
      }
    } catch {
      alert("Search failed. Check your API key.");
    } finally {
      setSearching(false);
    }
  }

  async function saveJob(job: Job) {
    const normalized = normalizeJob(job);
    setSavingId(normalized.externalId || normalized.id);

    const res = await fetch("/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        externalId: normalized.externalId,
        source: "jsearch",
        title: normalized.title,
        company: normalized.company,
        location: normalized.location,
        description: normalized.description,
        salary: normalized.salary,
        jobType: normalized.jobType,
        applyUrl: normalized.applyUrl,
        companyLogo: normalized.companyLogo,
      }),
    });

    if (res.ok) {
      setSavedIds((prev) => {
        const next = new Set(Array.from(prev));
        next.add(normalized.externalId || "");
        return next;
      });
      fetchSavedJobs();
    }
    setSavingId(null);
  }

  async function handlePaste() {
    if (!pasteText.trim()) return;
    setParsing(true);

    try {
      const res = await fetch("/api/jobs/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: pasteText }),
      });

      if (!res.ok) throw new Error("Parse failed");
      const parsed = await res.json();

      const saveRes = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "manual",
          title: parsed.title || "Untitled Position",
          company: parsed.company || "Unknown Company",
          location: parsed.location,
          description: parsed.description || pasteText,
          requirements: JSON.stringify(parsed.requirements),
          salary: parsed.salary,
          jobType: parsed.jobType,
        }),
      });

      if (saveRes.ok) {
        fetchSavedJobs();
        setPasteOpen(false);
        setPasteText("");
      }
    } catch {
      alert("Failed to parse job description. Make sure your Anthropic API key is set.");
    } finally {
      setParsing(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Jobs</h1>
        <Dialog open={pasteOpen} onOpenChange={setPasteOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Paste Job Description
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Paste Job Description</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Textarea
                placeholder="Paste the full job description here..."
                className="min-h-[300px]"
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
              />
              <Button
                onClick={handlePaste}
                disabled={parsing || !pasteText.trim()}
                className="w-full"
              >
                {parsing ? (
                  <>
                    <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                    AI is parsing...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Parse & Save with AI
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="search">
        <TabsList>
          <TabsTrigger value="search">Search</TabsTrigger>
          <TabsTrigger value="saved">Saved ({savedJobs.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="space-y-4">
          <form onSubmit={handleSearch} className="space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  className="pl-10"
                  placeholder="Search jobs (e.g., Software Engineer in San Francisco)"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <Button type="submit" disabled={searching}>
                {searching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Search"
                )}
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={datePosted} onValueChange={setDatePosted}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Date Posted" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="3days">3 days</SelectItem>
                  <SelectItem value="week">This week</SelectItem>
                  <SelectItem value="month">This month</SelectItem>
                </SelectContent>
              </Select>
              <Select value={employmentType} onValueChange={setEmploymentType}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Job Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="FULLTIME">Full-time</SelectItem>
                  <SelectItem value="PARTTIME">Part-time</SelectItem>
                  <SelectItem value="CONTRACTOR">Contract</SelectItem>
                  <SelectItem value="INTERN">Internship</SelectItem>
                </SelectContent>
              </Select>
              <Select value={experience} onValueChange={setExperience}>
                <SelectTrigger className="w-[170px]">
                  <SelectValue placeholder="Experience" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any experience</SelectItem>
                  <SelectItem value="no_experience">No experience</SelectItem>
                  <SelectItem value="under_3_years_experience">Under 3 years</SelectItem>
                  <SelectItem value="more_than_3_years_experience">3+ years</SelectItem>
                  <SelectItem value="no_degree">No degree</SelectItem>
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant={remote ? "default" : "outline"}
                onClick={() => setRemote(!remote)}
              >
                Remote
              </Button>
            </div>
          </form>

          {searchResults.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2">
              {searchResults.map((job) => {
                const n = normalizeJob(job);
                const isSaved = savedIds.has(n.externalId || "");
                return (
                  <Card key={n.externalId || n.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-lg">{n.title}</CardTitle>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Building className="h-3.5 w-3.5" />
                            {n.company}
                          </div>
                          {n.location && (
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <MapPin className="h-3.5 w-3.5" />
                              {n.location}
                            </div>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => !isSaved && saveJob(job)}
                          disabled={isSaved || savingId === n.externalId}
                        >
                          {isSaved ? (
                            <BookmarkCheck className="h-5 w-5 text-blue-600" />
                          ) : savingId === n.externalId ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : (
                            <Bookmark className="h-5 w-5" />
                          )}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {n.jobType && (
                          <Badge variant="secondary">{n.jobType}</Badge>
                        )}
                        {n.salary && (
                          <Badge variant="outline">{n.salary}</Badge>
                        )}
                      </div>
                      <p className="mt-3 line-clamp-3 text-sm text-gray-600">
                        {n.description.replace(/<[^>]*>/g, "").slice(0, 200)}...
                      </p>
                      {n.applyUrl && (
                        <a
                          href={n.applyUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                        >
                          Apply <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {searchResults.length === 0 && !searching && (
            <div className="py-12 text-center text-gray-500">
              Search for jobs to get started. You need a RapidAPI key for JSearch.
            </div>
          )}
        </TabsContent>

        <TabsContent value="saved" className="space-y-4">
          {savedJobs.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              No saved jobs yet. Search and save jobs, or paste a job description.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {savedJobs.map((job) => {
                const n = normalizeJob(job);
                return (
                  <Link key={n.id} href={`/jobs/${n.id}`}>
                    <Card className="cursor-pointer transition-shadow hover:shadow-md">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">{n.title}</CardTitle>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Building className="h-3.5 w-3.5" />
                          {n.company}
                        </div>
                        {n.location && (
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <MapPin className="h-3.5 w-3.5" />
                            {n.location}
                          </div>
                        )}
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {n.jobType && (
                            <Badge variant="secondary">{n.jobType}</Badge>
                          )}
                          {n.salary && (
                            <Badge variant="outline">{n.salary}</Badge>
                          )}
                          {n.application?.status && (
                            <Badge>{n.application.status}</Badge>
                          )}
                          <Badge variant="outline" className="capitalize">
                            {n.source}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
