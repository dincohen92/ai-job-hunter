"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Building,
  MapPin,
  ExternalLink,
  FileText,
  Send,
  ArrowLeft,
  Loader2,
  Trash2,
} from "lucide-react";
import Link from "next/link";

const STATUS_OPTIONS = [
  { value: "saved", label: "Saved" },
  { value: "applied", label: "Applied" },
  { value: "interviewing", label: "Interviewing" },
  { value: "offer", label: "Offer" },
  { value: "accepted", label: "Accepted" },
  { value: "rejected", label: "Rejected" },
];

interface JobDetail {
  id: string;
  title: string;
  company: string;
  location: string | null;
  description: string;
  requirements: string | null;
  salary: string | null;
  jobType: string | null;
  applyUrl: string | null;
  source: string;
  application: { id: string; status: string } | null;
  tailoredResumes: { id: string; matchScore: number | null; resume: { name: string } }[];
}

export default function JobDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const fetchJob = useCallback(async () => {
    const res = await fetch(`/api/jobs/${id}`);
    if (res.ok) {
      setJob(await res.json());
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchJob();
  }, [fetchJob]);

  async function updateStatus(status: string) {
    if (!job) return;

    if (job.application) {
      await fetch(`/api/applications/${job.application.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
    } else {
      await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: job.id, status }),
      });
    }
    fetchJob();
  }

  async function handleDelete() {
    if (!confirm("Delete this saved job?")) return;
    setDeleting(true);
    await fetch(`/api/jobs/${id}`, { method: "DELETE" });
    router.push("/jobs");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="py-20 text-center text-gray-500">Job not found</div>
    );
  }

  let parsedRequirements: string[] = [];
  if (job.requirements) {
    try {
      parsedRequirements = JSON.parse(job.requirements);
    } catch {
      parsedRequirements = [job.requirements];
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/jobs">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{job.title}</h1>
          <div className="mt-1 flex items-center gap-4 text-gray-500">
            <span className="flex items-center gap-1">
              <Building className="h-4 w-4" />
              {job.company}
            </span>
            {job.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {job.location}
              </span>
            )}
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDelete}
          disabled={deleting}
          className="text-red-500 hover:text-red-700"
        >
          <Trash2 className="h-5 w-5" />
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Job Description</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none whitespace-pre-wrap">
                {job.description}
              </div>
            </CardContent>
          </Card>

          {parsedRequirements.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Requirements</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc space-y-1 pl-5">
                  {parsedRequirements.map((req, i) => (
                    <li key={i} className="text-sm">
                      {req}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {job.jobType && (
                  <Badge variant="secondary">{job.jobType}</Badge>
                )}
                {job.salary && <Badge variant="outline">{job.salary}</Badge>}
                <Badge variant="outline" className="capitalize">
                  {job.source}
                </Badge>
              </div>

              {job.applyUrl && (
                <div className="space-y-2">
                  <a
                    href={job.applyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline" className="w-full">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Apply Directly
                    </Button>
                  </a>
                  <a
                    href={job.applyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block truncate text-xs text-blue-600 hover:underline"
                    title={job.applyUrl}
                  >
                    {job.applyUrl}
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Application Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={job.application?.status || "saved"}
                onValueChange={updateStatus}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href={`/resume/tailor?jobId=${job.id}`}>
                <Button variant="outline" className="w-full">
                  <FileText className="mr-2 h-4 w-4" />
                  Tailor Resume
                </Button>
              </Link>
              <Link href={`/outreach?jobId=${job.id}`}>
                <Button variant="outline" className="w-full">
                  <Send className="mr-2 h-4 w-4" />
                  Generate Outreach Email
                </Button>
              </Link>
            </CardContent>
          </Card>

          {job.tailoredResumes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tailored Resumes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {job.tailoredResumes.map((tr) => (
                    <div
                      key={tr.id}
                      className="flex items-center justify-between rounded-md border p-2 text-sm"
                    >
                      <span>{tr.resume.name}</span>
                      {tr.matchScore !== null && (
                        <Badge
                          variant={
                            tr.matchScore >= 70 ? "default" : "secondary"
                          }
                        >
                          {tr.matchScore}% match
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
