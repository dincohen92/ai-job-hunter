"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Loader2, Sparkles, Copy, Save, RefreshCw } from "lucide-react";
import Link from "next/link";

interface SavedJob {
  id: string;
  title: string;
  company: string;
}

type Tone = "professional" | "enthusiastic" | "creative";

export default function GenerateCoverLetterPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const preselectedJobId = searchParams.get("jobId");

  const [jobs, setJobs] = useState<SavedJob[]>([]);
  const [selectedJob, setSelectedJob] = useState(preselectedJobId || "");
  const [tone, setTone] = useState<Tone>("professional");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
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
    setContent("");
    setSaved(false);

    try {
      const res = await fetch("/api/cover-letter/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: selectedJob, tone }),
      });

      if (res.ok) {
        const data = await res.json();
        setContent(data.content);
      } else {
        const data = await res.json();
        setError(data.error || "Generation failed");
      }
    } catch {
      setError("Failed to connect to server");
    }
    setGenerating(false);
  }

  async function handleSave() {
    if (!content || !selectedJob) return;
    setSaving(true);

    try {
      const res = await fetch("/api/cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: selectedJob,
          content,
          tone,
        }),
      });

      if (res.ok) {
        setSaved(true);
        // Optionally redirect to job detail
        const job = jobs.find((j) => j.id === selectedJob);
        if (job) {
          setTimeout(() => {
            router.push(`/jobs/${selectedJob}`);
          }, 1500);
        }
      } else {
        const data = await res.json();
        setError(data.error || "Failed to save");
      }
    } catch {
      setError("Failed to save");
    }
    setSaving(false);
  }

  function handleCopy() {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const selectedJobData = jobs.find((j) => j.id === selectedJob);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={preselectedJobId ? `/jobs/${preselectedJobId}` : "/jobs"}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Generate Cover Letter</h1>
          <p className="text-sm text-gray-500">
            Create an AI-powered cover letter tailored to the job.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Target Job</label>
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
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tone</label>
              <Select value={tone} onValueChange={(v) => setTone(v as Tone)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">
                    Professional - Formal and polished
                  </SelectItem>
                  <SelectItem value="enthusiastic">
                    Enthusiastic - Energetic and passionate
                  </SelectItem>
                  <SelectItem value="creative">
                    Creative - Conversational and memorable
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={!selectedJob || generating}
              className="w-full"
            >
              {generating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : content ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Regenerate
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate
                </>
              )}
            </Button>

            {error && <p className="text-sm text-red-600">{error}</p>}
          </CardContent>
        </Card>

        {/* Cover Letter Content */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Cover Letter</CardTitle>
              {selectedJobData && (
                <p className="text-sm text-gray-500">
                  For {selectedJobData.title} at {selectedJobData.company}
                </p>
              )}
            </div>
            {content && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCopy}>
                  <Copy className="mr-2 h-3 w-3" />
                  {copied ? "Copied!" : "Copy"}
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={saving || saved}
                >
                  {saving ? (
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-3 w-3" />
                  )}
                  {saved ? "Saved!" : "Save"}
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {content ? (
              <Textarea
                value={content}
                onChange={(e) => {
                  setContent(e.target.value);
                  setSaved(false);
                }}
                className="min-h-[500px] font-serif text-base leading-relaxed"
                placeholder="Your cover letter will appear here..."
              />
            ) : (
              <div className="flex min-h-[400px] items-center justify-center rounded-md border border-dashed">
                <div className="text-center text-gray-500">
                  <Sparkles className="mx-auto h-8 w-8 text-gray-400" />
                  <p className="mt-2">Select a job and click Generate</p>
                  <p className="text-sm">
                    Make sure you have a CV Profile set up first
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tips for a Great Cover Letter</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-2 text-sm text-gray-600 sm:grid-cols-2">
            <li className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              Customize the opening for each company
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              Highlight your most relevant achievements
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              Keep it under one page (300-400 words)
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              End with a clear call to action
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500">✗</span>
              Don&apos;t repeat your resume word-for-word
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500">✗</span>
              Avoid generic phrases like &quot;I am writing to apply...&quot;
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
