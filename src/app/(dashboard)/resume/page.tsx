"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Upload, FileText, Loader2, Trash2 } from "lucide-react";

interface Resume {
  id: string;
  name: string;
  fileName: string | null;
  rawText: string;
  isDefault: boolean;
  createdAt: string;
}

export default function ResumePage() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selected, setSelected] = useState<Resume | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadName, setUploadName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchResumes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchResumes() {
    const res = await fetch("/api/resume");
    if (res.ok) {
      const data = await res.json();
      setResumes(data);
      if (data.length > 0 && !selected) {
        setSelected(data[0]);
      }
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("name", uploadName || file.name.replace(/\.[^.]+$/, ""));

    const res = await fetch("/api/resume/upload", {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      setUploadName("");
      await fetchResumes();
      const newResume = await res.json();
      setSelected(newResume);
    } else {
      const data = await res.json();
      alert(data.error || "Upload failed");
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function deleteResume(id: string) {
    if (!confirm("Delete this resume?")) return;
    await fetch(`/api/resume`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (selected?.id === id) {
      setSelected(null);
    }
    fetchResumes();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Resume</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: upload + list */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Upload Resume</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                placeholder="Resume name (optional)"
                value={uploadName}
                onChange={(e) => setUploadName(e.target.value)}
              />
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.md,.pdf"
                className="hidden"
                onChange={handleUpload}
              />
              <Button
                variant="outline"
                className="w-full"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}
                {uploading ? "Uploading..." : "Choose File (.txt, .pdf)"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                My Resumes ({resumes.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {resumes.length === 0 ? (
                <p className="text-sm text-gray-500">
                  Upload your first resume to get started.
                </p>
              ) : (
                <div className="space-y-2">
                  {resumes.map((resume) => (
                    <div
                      key={resume.id}
                      className={`flex cursor-pointer items-center justify-between rounded-md border p-3 transition-colors ${
                        selected?.id === resume.id
                          ? "border-blue-500 bg-blue-50"
                          : "hover:bg-gray-50"
                      }`}
                      onClick={() => setSelected(resume)}
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium">{resume.name}</p>
                          {resume.fileName && (
                            <p className="text-xs text-gray-500">
                              {resume.fileName}
                            </p>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteResume(resume.id);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-gray-400" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: resume text */}
        <div className="lg:col-span-2">
          {selected ? (
            <Card>
              <CardHeader>
                <CardTitle>{selected.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="max-h-[600px] overflow-y-auto whitespace-pre-wrap rounded-md bg-gray-50 p-4 text-sm">
                  {selected.rawText}
                </pre>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-20 text-center text-gray-500">
                <FileText className="mx-auto h-12 w-12 text-gray-300" />
                <p className="mt-4">
                  Upload a resume to see it here, or select one from the list.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
