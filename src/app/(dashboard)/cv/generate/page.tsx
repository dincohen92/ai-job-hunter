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
import { ArrowLeft, Loader2, Sparkles, Copy, Download, Save, Check } from "lucide-react";
import Link from "next/link";

interface SavedJob {
  id: string;
  title: string;
  company: string;
}

interface GenerateResult {
  id: string;
  resume: string;
  resumeHtml: string;
  matchScore: number;
  changes: string[];
  missingSkills: string[];
  suggestions: string[];
}

export default function GenerateResumePage() {
  const searchParams = useSearchParams();
  const preselectedJobId = searchParams.get("jobId");

  const [jobs, setJobs] = useState<SavedJob[]>([]);
  const [selectedJob, setSelectedJob] = useState(preselectedJobId || "");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, []);

  async function fetchJobs() {
    const res = await fetch("/api/jobs");
    if (res.ok) {
      const data = await res.json();
      setJobs(data);
    }
  }

  async function handleGenerate() {
    if (!selectedJob) return;
    setGenerating(true);
    setError("");
    setResult(null);

    const res = await fetch("/api/cv/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId: selectedJob }),
    });

    if (res.ok) {
      const data = await res.json();
      setResult(data);
    } else {
      const data = await res.json();
      setError(data.error || "Generation failed");
    }
    setGenerating(false);
  }

  function handleCopy() {
    if (result) {
      navigator.clipboard.writeText(result.resume);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function handleDownload() {
    if (result) {
      window.open(`/print/resume/${result.id}`, "_blank");
    }
  }

  async function handleSaveToResumes() {
    if (!result || saved) return;
    setSaving(true);

    const job = jobs.find((j) => j.id === selectedJob);
    const name = job
      ? `Resume for ${job.title} at ${job.company}`
      : "Generated Resume";

    const res = await fetch("/api/resume", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, rawText: result.resume }),
    });

    if (res.ok) {
      setSaved(true);
    }
    setSaving(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/cv">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Generate Tailored Resume</h1>
          <p className="text-sm text-gray-500">
            Select a job and generate a resume tailored from your CV profile.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Target Job</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={selectedJob} onValueChange={setSelectedJob}>
            <SelectTrigger>
              <SelectValue placeholder="Select a saved job..." />
            </SelectTrigger>
            <SelectContent>
              {jobs.map((job) => (
                <SelectItem key={job.id} value={job.id}>
                  {job.title} - {job.company}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={handleGenerate}
            disabled={!selectedJob || generating}
            className="w-full"
          >
            {generating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating resume...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Resume
              </>
            )}
          </Button>
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
        </CardContent>
      </Card>

      {result && (
        <>
          {/* Match Score + Actions */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="flex items-center gap-3 pt-6">
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-full text-lg font-bold text-white ${
                    result.matchScore >= 70
                      ? "bg-green-500"
                      : result.matchScore >= 50
                        ? "bg-yellow-500"
                        : "bg-red-500"
                  }`}
                >
                  {result.matchScore}
                </div>
                <div>
                  <p className="text-sm font-medium">Match Score</p>
                  <p className="text-xs text-gray-500">
                    {result.matchScore >= 70
                      ? "Strong match"
                      : result.matchScore >= 50
                        ? "Moderate match"
                        : "Needs improvement"}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm font-medium text-green-600">
                  Changes Made
                </p>
                <ul className="mt-1 space-y-1">
                  {result.changes.map((c, i) => (
                    <li key={i} className="text-xs text-gray-600">
                      {c}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm font-medium text-orange-600">
                  Missing Skills
                </p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {result.missingSkills.map((s, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {s}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Suggestions */}
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

          {/* Generated Resume */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Generated Resume</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCopy}>
                  <Copy className="mr-2 h-3 w-3" />
                  {copied ? "Copied!" : "Copy"}
                </Button>
                <Button variant="outline" size="sm" onClick={handleDownload}>
                  <Download className="mr-2 h-3 w-3" />
                  Download PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSaveToResumes}
                  disabled={saving || saved}
                >
                  {saving ? (
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  ) : saved ? (
                    <Check className="mr-2 h-3 w-3 text-green-600" />
                  ) : (
                    <Save className="mr-2 h-3 w-3" />
                  )}
                  {saved ? "Saved!" : "Save to Resumes"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <pre className="max-h-[600px] overflow-y-auto whitespace-pre-wrap rounded-md bg-gray-50 p-4 text-sm">
                {result.resume}
              </pre>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
