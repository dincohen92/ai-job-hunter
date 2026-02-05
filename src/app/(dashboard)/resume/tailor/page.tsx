"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
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
import { Sparkles, Loader2, ArrowLeft, CheckCircle, AlertTriangle } from "lucide-react";
import Link from "next/link";

interface Job {
  id: string;
  title: string;
  company: string;
}

interface Resume {
  id: string;
  name: string;
}

interface TailorResult {
  tailoredResume: string;
  matchScore: number;
  changes: string[];
  missingSkills: string[];
  suggestions: string[];
}

export default function TailorPage() {
  const searchParams = useSearchParams();
  const preselectedJobId = searchParams.get("jobId");

  const [jobs, setJobs] = useState<Job[]>([]);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedJob, setSelectedJob] = useState(preselectedJobId || "");
  const [selectedResume, setSelectedResume] = useState("");
  const [tailoring, setTailoring] = useState(false);
  const [result, setResult] = useState<TailorResult | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/jobs").then((r) => r.json()),
      fetch("/api/resume").then((r) => r.json()),
    ]).then(([jobsData, resumesData]) => {
      setJobs(jobsData);
      setResumes(resumesData);
      if (resumesData.length > 0) setSelectedResume(resumesData[0].id);
    });
  }, []);

  async function handleTailor() {
    if (!selectedJob || !selectedResume) return;
    setTailoring(true);
    setResult(null);

    try {
      const res = await fetch("/api/resume/tailor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeId: selectedResume,
          jobId: selectedJob,
        }),
      });

      if (!res.ok) throw new Error("Tailoring failed");
      const data = await res.json();
      setResult(data);
    } catch {
      alert("Tailoring failed. Check your Anthropic API key.");
    } finally {
      setTailoring(false);
    }
  }

  const selectedJobData = jobs.find((j) => j.id === selectedJob);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/resume">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Tailor Resume</h1>
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-end gap-4 pt-6">
          <div className="min-w-[200px] flex-1">
            <label className="mb-1 block text-sm font-medium">Resume</label>
            <Select value={selectedResume} onValueChange={setSelectedResume}>
              <SelectTrigger>
                <SelectValue placeholder="Select a resume" />
              </SelectTrigger>
              <SelectContent>
                {resumes.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="min-w-[200px] flex-1">
            <label className="mb-1 block text-sm font-medium">
              Target Job
            </label>
            <Select value={selectedJob} onValueChange={setSelectedJob}>
              <SelectTrigger>
                <SelectValue placeholder="Select a saved job" />
              </SelectTrigger>
              <SelectContent>
                {jobs.map((j) => (
                  <SelectItem key={j.id} value={j.id}>
                    {j.title} - {j.company}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={handleTailor}
            disabled={tailoring || !selectedJob || !selectedResume}
          >
            {tailoring ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Tailoring...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Tailor Resume
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="pt-6 text-center">
                <p
                  className={`text-4xl font-bold ${
                    result.matchScore >= 70
                      ? "text-green-600"
                      : result.matchScore >= 50
                        ? "text-yellow-600"
                        : "text-red-600"
                  }`}
                >
                  {result.matchScore}%
                </p>
                <p className="text-sm text-gray-500">Match Score</p>
                {selectedJobData && (
                  <p className="mt-1 text-xs text-gray-400">
                    for {selectedJobData.title} at {selectedJobData.company}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  Changes Made
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1">
                  {result.changes.map((change, i) => (
                    <li key={i} className="text-sm">
                      {change}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base text-orange-600">
                  <AlertTriangle className="h-4 w-4" />
                  Missing Skills
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1">
                  {result.missingSkills.map((skill, i) => (
                    <Badge key={i} variant="outline" className="text-orange-600">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {result.suggestions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Suggestions</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc space-y-1 pl-5">
                  {result.suggestions.map((s, i) => (
                    <li key={i} className="text-sm">
                      {s}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Tailored Resume</CardTitle>
              <Button
                variant="outline"
                onClick={() =>
                  navigator.clipboard.writeText(result.tailoredResume)
                }
              >
                Copy to Clipboard
              </Button>
            </CardHeader>
            <CardContent>
              <pre className="max-h-[600px] overflow-y-auto whitespace-pre-wrap rounded-md bg-gray-50 p-4 text-sm">
                {result.tailoredResume}
              </pre>
            </CardContent>
          </Card>
        </div>
      )}

      {!result && !tailoring && (
        <Card>
          <CardContent className="py-20 text-center text-gray-500">
            <Sparkles className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-4">
              Select a resume and a target job, then click &quot;Tailor
              Resume&quot; to generate an optimized version.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
