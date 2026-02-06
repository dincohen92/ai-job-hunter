"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Loader2,
  Trash2,
  Download,
  FileText,
  Eye,
  Save,
  Check,
} from "lucide-react";
import Link from "next/link";

interface GeneratedResume {
  id: string;
  content: string;
  matchScore: number | null;
  createdAt: string;
  job: { title: string; company: string };
}

export default function SavedResumesPage() {
  const [resumes, setResumes] = useState<GeneratedResume[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<GeneratedResume | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchResumes();
  }, []);

  async function fetchResumes() {
    const res = await fetch("/api/cv/resumes");
    if (res.ok) {
      setResumes(await res.json());
    }
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this generated resume?")) return;
    await fetch(`/api/cv/resumes/${id}`, { method: "DELETE" });
    if (selected?.id === id) setSelected(null);
    fetchResumes();
  }

  async function handleSaveToResumes(resume: GeneratedResume) {
    if (savedIds.has(resume.id)) return;
    setSavingId(resume.id);

    const name = `Resume for ${resume.job.title} at ${resume.job.company}`;
    const res = await fetch("/api/resume", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, rawText: resume.content }),
    });

    if (res.ok) {
      setSavedIds((prev) => new Set([...Array.from(prev), resume.id]));
    }
    setSavingId(null);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
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
          <h1 className="text-2xl font-bold">Generated Resumes</h1>
          <p className="text-sm text-gray-500">
            All resumes generated from your CV profile.
          </p>
        </div>
      </div>

      {resumes.length === 0 ? (
        <Card>
          <CardContent className="py-20 text-center text-gray-500">
            <FileText className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-4">No generated resumes yet.</p>
            <Link href="/cv/generate">
              <Button variant="outline" className="mt-4">
                Generate Your First Resume
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Resume list */}
          <div className="space-y-3">
            {resumes.map((resume) => (
              <Card
                key={resume.id}
                className={`cursor-pointer transition-colors ${
                  selected?.id === resume.id
                    ? "border-blue-500 bg-blue-50"
                    : "hover:bg-gray-50"
                }`}
                onClick={() => setSelected(resume)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-sm">
                        {resume.job.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        {resume.job.company}
                      </p>
                      <p className="mt-1 text-xs text-gray-400">
                        {new Date(resume.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {resume.matchScore !== null && (
                        <Badge
                          variant={
                            resume.matchScore >= 70 ? "default" : "secondary"
                          }
                        >
                          {resume.matchScore}%
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(resume.id);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-gray-400" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Selected resume detail */}
          <div className="lg:col-span-2">
            {selected ? (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>
                      {selected.job.title} - {selected.job.company}
                    </CardTitle>
                    <p className="mt-1 text-sm text-gray-500">
                      Generated{" "}
                      {new Date(selected.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        navigator.clipboard.writeText(selected.content)
                      }
                    >
                      Copy
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        window.open(
                          `/print/resume/${selected.id}`,
                          "_blank"
                        )
                      }
                    >
                      <Download className="mr-2 h-3 w-3" />
                      PDF
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSaveToResumes(selected)}
                      disabled={savingId === selected.id || savedIds.has(selected.id)}
                    >
                      {savingId === selected.id ? (
                        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                      ) : savedIds.has(selected.id) ? (
                        <Check className="mr-2 h-3 w-3 text-green-600" />
                      ) : (
                        <Save className="mr-2 h-3 w-3" />
                      )}
                      {savedIds.has(selected.id) ? "Saved!" : "Save to Resumes"}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <pre className="max-h-[600px] overflow-y-auto whitespace-pre-wrap rounded-md bg-gray-50 p-4 text-sm">
                    {selected.content}
                  </pre>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-20 text-center text-gray-500">
                  <Eye className="mx-auto h-12 w-12 text-gray-300" />
                  <p className="mt-4">Select a resume to preview it.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
