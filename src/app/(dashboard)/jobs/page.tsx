"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
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
  Trash2,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  Star,
  Settings2,
  X,
  Check,
} from "lucide-react";
import Link from "next/link";

interface JobSource {
  name: string;
  displayName: string;
  configured: boolean;
}

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

interface Recommendation {
  id: string;
  jobId: string;
  score: number;
  reason: string;
  feedback: string | null;
  job: Job;
}

interface Prefs {
  preferredTitles: string[];
  preferredSkills: string[];
  avoidCompanies: string[];
  locations: string[];
  minSalary: number | null;
  maxSalary: number | null;
  jobType: string;
  workStyle: string;
  experienceLevel: string;
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

// Simple tag input component
function TagInput({
  values,
  onChange,
  placeholder,
}: {
  values: string[];
  onChange: (vals: string[]) => void;
  placeholder: string;
}) {
  const [inputVal, setInputVal] = useState("");

  function addTag() {
    const tag = inputVal.trim();
    if (tag && !values.includes(tag)) {
      onChange([...values, tag]);
    }
    setInputVal("");
  }

  return (
    <div className="space-y-2">
      {values.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {values.map((v) => (
            <Badge key={v} variant="secondary" className="gap-1 pr-1">
              {v}
              <button
                type="button"
                onClick={() => onChange(values.filter((x) => x !== v))}
                className="ml-1 rounded-full hover:text-red-500"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <Input
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              addTag();
            }
          }}
          placeholder={placeholder}
          className="text-sm"
        />
        <Button type="button" variant="outline" size="sm" onClick={addTag} disabled={!inputVal.trim()}>
          Add
        </Button>
      </div>
      <p className="text-xs text-gray-400">Press Enter or comma to add</p>
    </div>
  );
}

// Toggle button group for single-select options
function OptionGroup({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {options.map((opt) => (
        <Button
          key={opt.value}
          type="button"
          size="sm"
          variant={value === opt.value ? "default" : "outline"}
          onClick={() => onChange(opt.value)}
          className="h-8"
        >
          {value === opt.value && <Check className="mr-1 h-3 w-3" />}
          {opt.label}
        </Button>
      ))}
    </div>
  );
}

const WORK_STYLE_OPTIONS = [
  { value: "any", label: "Any" },
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
  { value: "onsite", label: "On-site" },
];

const JOB_TYPE_OPTIONS = [
  { value: "any", label: "Any" },
  { value: "full-time", label: "Full-time" },
  { value: "part-time", label: "Part-time" },
  { value: "contract", label: "Contract" },
];

const EXPERIENCE_OPTIONS = [
  { value: "any", label: "Any level" },
  { value: "entry", label: "Entry" },
  { value: "mid", label: "Mid" },
  { value: "senior", label: "Senior" },
  { value: "principal", label: "Staff/Principal" },
];

const DEFAULT_PREFS: Prefs = {
  preferredTitles: [],
  preferredSkills: [],
  avoidCompanies: [],
  locations: [],
  minSalary: null,
  maxSalary: null,
  jobType: "any",
  workStyle: "any",
  experienceLevel: "any",
};

export default function JobsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "search";

  // Search filter state (pre-loaded from preferences)
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [workStyle, setWorkStyle] = useState("any");
  const [jobType, setJobType] = useState("any");

  const [searchResults, setSearchResults] = useState<Job[]>([]);
  const [savedJobs, setSavedJobs] = useState<Job[]>([]);
  const [searching, setSearching] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [parsing, setParsing] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [sources, setSources] = useState<JobSource[]>([]);
  const [selectedSources, setSelectedSources] = useState<Set<string>>(new Set());
  const [searchErrors, setSearchErrors] = useState<{ source: string; error: string }[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [generatingRecs, setGeneratingRecs] = useState(false);

  // Preferences tab state
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [prefsLoading, setPrefsLoading] = useState(true);
  const [prefsSaving, setPrefsSaving] = useState(false);
  const [prefsSaved, setPrefsSaved] = useState(false);

  function setActiveTab(tab: string) {
    router.push(`/jobs?tab=${tab}`, { scroll: false });
  }

  const loadPreferences = useCallback(async () => {
    setPrefsLoading(true);
    try {
      const res = await fetch("/api/preferences");
      if (res.ok) {
        const data = await res.json();
        setPrefs({
          preferredTitles: data.preferredTitles || [],
          preferredSkills: data.preferredSkills || [],
          avoidCompanies: data.avoidCompanies || [],
          locations: data.locations || [],
          minSalary: data.minSalary || null,
          maxSalary: data.maxSalary || null,
          jobType: data.jobType || "any",
          workStyle: data.workStyle || "any",
          experienceLevel: data.experienceLevel || "any",
        });
        // Pre-fill search filters from preferences
        if (data.locations?.length > 0) setLocation(data.locations[0]);
        if (data.workStyle && data.workStyle !== "any") setWorkStyle(data.workStyle);
        if (data.jobType && data.jobType !== "any") setJobType(data.jobType);
      }
    } finally {
      setPrefsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPreferences();
    fetchSavedJobs();
    fetchSources();
    fetchRecommendations();
  }, [loadPreferences]);

  async function savePreferences() {
    setPrefsSaving(true);
    const res = await fetch("/api/preferences", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(prefs),
    });
    if (res.ok) {
      const data = await res.json();
      setPrefs({
        preferredTitles: data.preferredTitles || [],
        preferredSkills: data.preferredSkills || [],
        avoidCompanies: data.avoidCompanies || [],
        locations: data.locations || [],
        minSalary: data.minSalary || null,
        maxSalary: data.maxSalary || null,
        jobType: data.jobType || "any",
        workStyle: data.workStyle || "any",
        experienceLevel: data.experienceLevel || "any",
      });
      // Sync search filters with new preferences
      if (data.locations?.length > 0) setLocation(data.locations[0]);
      if (data.workStyle) setWorkStyle(data.workStyle);
      if (data.jobType) setJobType(data.jobType);
      setPrefsSaved(true);
      setTimeout(() => setPrefsSaved(false), 2000);
    }
    setPrefsSaving(false);
  }

  async function fetchRecommendations() {
    setLoadingRecs(true);
    try {
      const res = await fetch("/api/recommendations");
      if (res.ok) {
        const data = await res.json();
        setRecommendations(data);
      }
    } finally {
      setLoadingRecs(false);
    }
  }

  async function generateRecommendations() {
    setGeneratingRecs(true);
    try {
      const res = await fetch("/api/recommendations/generate", { method: "POST" });
      if (res.ok) {
        await fetchRecommendations();
      }
    } finally {
      setGeneratingRecs(false);
    }
  }

  async function sendFeedback(recId: string, feedback: "liked" | "disliked") {
    const res = await fetch(`/api/recommendations/${recId}/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ feedback }),
    });
    if (res.ok) {
      setRecommendations((prev) =>
        prev.map((r) => (r.id === recId ? { ...r, feedback } : r))
      );
    }
  }

  async function fetchSources() {
    const res = await fetch("/api/jobs/sources");
    if (res.ok) {
      const data = await res.json();
      setSources(data.sources);
      setSelectedSources(new Set(data.configured));
    }
  }

  function toggleSource(sourceName: string) {
    setSelectedSources((prev) => {
      const next = new Set(Array.from(prev));
      if (next.has(sourceName)) {
        next.delete(sourceName);
      } else {
        next.add(sourceName);
      }
      return next;
    });
  }

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
    if (selectedSources.size === 0) {
      alert("Please select at least one job source");
      return;
    }
    setSearching(true);
    setSearchErrors([]);

    const params = new URLSearchParams({ q: query });
    params.set("sources", Array.from(selectedSources).join(","));
    if (location.trim()) params.set("location", location.trim());
    if (workStyle === "remote") params.set("remote", "true");

    try {
      const res = await fetch(`/api/jobs/search/multi?${params}`);
      const data = await res.json();
      if (data.error) {
        alert(data.error);
      } else {
        setSearchResults(data.jobs || []);
        if (data.errors?.length > 0) {
          setSearchErrors(data.errors);
        }
      }
    } catch {
      alert("Search failed. Check your API configuration.");
    } finally {
      setSearching(false);
    }
  }

  async function saveJob(job: Job) {
    const normalized = normalizeJob(job);
    const jobKey = normalized.externalId || normalized.id;
    setSavingId(jobKey);

    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          externalId: normalized.externalId,
          source: normalized.source,
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
          next.add(jobKey);
          return next;
        });
        fetchSavedJobs();
      } else {
        const error = await res.json();
        alert(`Failed to save job: ${error.error || "Unknown error"}`);
      }
    } catch (err) {
      console.error("Save error:", err);
      alert("Failed to save job. Please try again.");
    } finally {
      setSavingId(null);
    }
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

  async function removeJob(e: React.MouseEvent, jobId: string) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Remove this saved job?")) return;
    setRemovingId(jobId);
    await fetch(`/api/jobs/${jobId}`, { method: "DELETE" });
    fetchSavedJobs();
    setRemovingId(null);
  }

  // Active filter badges shown under search bar
  const activeFilters = [
    location && { label: `📍 ${location}`, clear: () => setLocation("") },
    workStyle !== "any" && { label: `🏠 ${workStyle}`, clear: () => setWorkStyle("any") },
    jobType !== "any" && { label: `💼 ${jobType}`, clear: () => setJobType("any") },
  ].filter(Boolean) as { label: string; clear: () => void }[];

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

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="search">Search</TabsTrigger>
          <TabsTrigger value="saved">Saved ({savedJobs.length})</TabsTrigger>
          <TabsTrigger value="foryou" className="gap-1">
            <Star className="h-3.5 w-3.5" />
            For You
            {recommendations.length > 0 && (
              <span className="ml-1 rounded-full bg-blue-100 px-1.5 py-0.5 text-xs text-blue-700">
                {recommendations.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="preferences" className="gap-1">
            <Settings2 className="h-3.5 w-3.5" />
            Preferences
          </TabsTrigger>
        </TabsList>

        {/* ── SEARCH TAB ── */}
        <TabsContent value="search" className="space-y-4">
          <form onSubmit={handleSearch} className="space-y-3">
            {/* Row 1: query + search button */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  className="pl-10"
                  placeholder="Job title or keywords (e.g., Senior Software Engineer)"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <Button type="submit" disabled={searching}>
                {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
              </Button>
            </div>

            {/* Row 2: location + work style + job type */}
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  className="pl-9 w-48"
                  placeholder="Location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
              <OptionGroup value={workStyle} onChange={setWorkStyle} options={WORK_STYLE_OPTIONS} />
              <OptionGroup value={jobType} onChange={setJobType} options={JOB_TYPE_OPTIONS} />
            </div>

            {/* Row 3: sources */}
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm text-gray-500">Sources:</span>
              {sources.map((source) => (
                <label
                  key={source.name}
                  className={`flex items-center gap-1.5 text-sm ${!source.configured ? "opacity-50" : ""}`}
                >
                  <Checkbox
                    checked={selectedSources.has(source.name)}
                    onCheckedChange={() => toggleSource(source.name)}
                    disabled={!source.configured}
                  />
                  {source.displayName}
                  {!source.configured && (
                    <span className="text-xs text-gray-400">(not configured)</span>
                  )}
                </label>
              ))}
            </div>
          </form>

          {/* Active filter chips */}
          {activeFilters.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-gray-400">Active filters:</span>
              {activeFilters.map((f) => (
                <Badge
                  key={f.label}
                  variant="secondary"
                  className="cursor-pointer gap-1 pr-1"
                  onClick={f.clear}
                >
                  {f.label}
                  <X className="h-3 w-3" />
                </Badge>
              ))}
            </div>
          )}

          {searchErrors.length > 0 && (
            <div className="rounded-md bg-yellow-50 p-3 text-sm text-yellow-800">
              <p className="font-medium">Some sources failed:</p>
              <ul className="mt-1 list-disc pl-5">
                {searchErrors.map((err, i) => (
                  <li key={i}>{err.source}: {err.error}</li>
                ))}
              </ul>
            </div>
          )}

          {searchResults.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2">
              {searchResults.map((job) => {
                const n = normalizeJob(job);
                const jobKey = n.externalId || n.id;
                const isSaved = savedIds.has(jobKey);
                const isSaving = savingId === jobKey;
                return (
                  <Card key={jobKey}>
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
                          onClick={() => !isSaved && !isSaving && saveJob(job)}
                          disabled={isSaved || isSaving}
                        >
                          {isSaved ? (
                            <BookmarkCheck className="h-5 w-5 text-blue-600" />
                          ) : isSaving ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : (
                            <Bookmark className="h-5 w-5" />
                          )}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {n.jobType && <Badge variant="secondary">{n.jobType}</Badge>}
                        {n.salary && <Badge variant="outline">{n.salary}</Badge>}
                        <Badge variant="outline" className="capitalize text-xs">
                          {n.source}
                        </Badge>
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

        {/* ── SAVED TAB ── */}
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
                  <Link key={n.id} href={`/jobs/${n.id}?from=saved`}>
                    <Card className="cursor-pointer transition-shadow hover:shadow-md">
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
                            className="h-8 w-8 shrink-0"
                            onClick={(e) => removeJob(e, n.id)}
                            disabled={removingId === n.id}
                          >
                            {removingId === n.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-500" />
                            )}
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {n.jobType && <Badge variant="secondary">{n.jobType}</Badge>}
                          {n.salary && <Badge variant="outline">{n.salary}</Badge>}
                          {n.application?.status && <Badge>{n.application.status}</Badge>}
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

        {/* ── FOR YOU TAB ── */}
        <TabsContent value="foryou" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              AI-powered job recommendations based on your profile and preferences
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={generateRecommendations}
              disabled={generatingRecs}
            >
              {generatingRecs ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh Recommendations
                </>
              )}
            </Button>
          </div>

          {loadingRecs ? (
            <div className="py-12 text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : recommendations.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              <Star className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-4">No recommendations yet.</p>
              <p className="mt-1 text-sm">
                Save some jobs and set up your CV profile, then click &quot;Refresh
                Recommendations&quot;
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {recommendations.map((rec) => {
                const n = normalizeJob(rec.job);
                return (
                  <Card key={rec.id} className="relative">
                    <div className="absolute right-2 top-2 flex items-center gap-1">
                      <Badge
                        variant="secondary"
                        className="bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700"
                      >
                        {Math.round(rec.score * 100)}% match
                      </Badge>
                    </div>
                    <CardHeader className="pb-3 pt-8">
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
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm italic text-blue-600">&quot;{rec.reason}&quot;</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {n.jobType && <Badge variant="secondary">{n.jobType}</Badge>}
                        {n.salary && <Badge variant="outline">{n.salary}</Badge>}
                      </div>
                      <div className="mt-4 flex items-center justify-between">
                        <Link href={`/jobs/${n.id}`} className="text-sm text-blue-600 hover:underline">
                          View Details
                        </Link>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className={rec.feedback === "liked" ? "text-green-600" : "text-gray-400"}
                            onClick={() => sendFeedback(rec.id, "liked")}
                          >
                            <ThumbsUp className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={rec.feedback === "disliked" ? "text-red-600" : "text-gray-400"}
                            onClick={() => sendFeedback(rec.id, "disliked")}
                          >
                            <ThumbsDown className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ── PREFERENCES TAB ── */}
        <TabsContent value="preferences" className="space-y-6">
          {prefsLoading ? (
            <div className="py-12 text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Search Preferences</h2>
                  <p className="text-sm text-gray-500">
                    These defaults pre-fill your search filters every time you visit.
                  </p>
                </div>
                <Button onClick={savePreferences} disabled={prefsSaving}>
                  {prefsSaved ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Saved!
                    </>
                  ) : prefsSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Preferences"
                  )}
                </Button>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {/* Job titles */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Job Titles</CardTitle>
                    <p className="text-xs text-gray-500">Roles you&apos;re looking for</p>
                  </CardHeader>
                  <CardContent>
                    <TagInput
                      values={prefs.preferredTitles}
                      onChange={(v) => setPrefs({ ...prefs, preferredTitles: v })}
                      placeholder="e.g. Senior Software Engineer"
                    />
                  </CardContent>
                </Card>

                {/* Locations */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Locations</CardTitle>
                    <p className="text-xs text-gray-500">
                      First location pre-fills the search bar
                    </p>
                  </CardHeader>
                  <CardContent>
                    <TagInput
                      values={prefs.locations}
                      onChange={(v) => setPrefs({ ...prefs, locations: v })}
                      placeholder="e.g. San Francisco, CA"
                    />
                  </CardContent>
                </Card>

                {/* Work style + Job type */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Work Style</CardTitle>
                    <p className="text-xs text-gray-500">Pre-selects the filter on search</p>
                  </CardHeader>
                  <CardContent>
                    <OptionGroup
                      value={prefs.workStyle}
                      onChange={(v) => setPrefs({ ...prefs, workStyle: v })}
                      options={WORK_STYLE_OPTIONS}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Employment Type</CardTitle>
                    <p className="text-xs text-gray-500">Full-time, part-time, or contract</p>
                  </CardHeader>
                  <CardContent>
                    <OptionGroup
                      value={prefs.jobType}
                      onChange={(v) => setPrefs({ ...prefs, jobType: v })}
                      options={JOB_TYPE_OPTIONS}
                    />
                  </CardContent>
                </Card>

                {/* Experience level */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Experience Level</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <OptionGroup
                      value={prefs.experienceLevel}
                      onChange={(v) => setPrefs({ ...prefs, experienceLevel: v })}
                      options={EXPERIENCE_OPTIONS}
                    />
                  </CardContent>
                </Card>

                {/* Salary range */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Salary Range</CardTitle>
                    <p className="text-xs text-gray-500">Annual, before tax</p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-xs text-gray-500">Minimum ($)</Label>
                      <Input
                        type="number"
                        placeholder="e.g. 120000"
                        value={prefs.minSalary ?? ""}
                        onChange={(e) =>
                          setPrefs({
                            ...prefs,
                            minSalary: e.target.value ? parseInt(e.target.value) : null,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Maximum ($)</Label>
                      <Input
                        type="number"
                        placeholder="e.g. 200000"
                        value={prefs.maxSalary ?? ""}
                        onChange={(e) =>
                          setPrefs({
                            ...prefs,
                            maxSalary: e.target.value ? parseInt(e.target.value) : null,
                          })
                        }
                      />
                    </div>
                    {prefs.minSalary && prefs.maxSalary && (
                      <p className="text-sm text-gray-500">
                        ${(prefs.minSalary / 1000).toFixed(0)}k –{" "}
                        ${(prefs.maxSalary / 1000).toFixed(0)}k
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Skills */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Required Skills</CardTitle>
                    <p className="text-xs text-gray-500">
                      Used for AI recommendations and CV matching
                    </p>
                  </CardHeader>
                  <CardContent>
                    <TagInput
                      values={prefs.preferredSkills}
                      onChange={(v) => setPrefs({ ...prefs, preferredSkills: v })}
                      placeholder="e.g. TypeScript, React, AWS"
                    />
                  </CardContent>
                </Card>

                {/* Companies to avoid */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Companies to Avoid</CardTitle>
                    <p className="text-xs text-gray-500">
                      Excluded from AI recommendations
                    </p>
                  </CardHeader>
                  <CardContent>
                    <TagInput
                      values={prefs.avoidCompanies}
                      onChange={(v) => setPrefs({ ...prefs, avoidCompanies: v })}
                      placeholder="e.g. Acme Corp"
                    />
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-end">
                <Button onClick={savePreferences} disabled={prefsSaving} size="lg">
                  {prefsSaved ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Preferences Saved!
                    </>
                  ) : prefsSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Preferences"
                  )}
                </Button>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
