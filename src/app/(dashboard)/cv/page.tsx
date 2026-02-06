"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Upload,
  Save,
  Loader2,
  Plus,
  Trash2,
  X,
  FileText,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import type {
  CvProfileData,
  WorkExperience,
  Education,
  Project,
  Certification,
} from "@/types/cv";

function generateId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

const emptyCv: CvProfileData = {
  fullName: "",
  email: "",
  phone: "",
  location: "",
  linkedin: "",
  website: "",
  summary: "",
  experience: [],
  education: [],
  skills: [],
  projects: [],
  certifications: [],
};

export default function CvPage() {
  const [cv, setCv] = useState<CvProfileData>(emptyCv);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [skillInput, setSkillInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchCv();
  }, []);

  async function fetchCv() {
    const res = await fetch("/api/cv");
    if (res.ok) {
      const data = await res.json();
      if (data) setCv(data);
    }
    setLoading(false);
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    const res = await fetch("/api/cv", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cv),
    });
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/cv/upload", {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      const parsed = await res.json();
      setCv({
        fullName: parsed.fullName || "",
        email: parsed.email || "",
        phone: parsed.phone || "",
        location: parsed.location || "",
        linkedin: parsed.linkedin || "",
        website: parsed.website || "",
        summary: parsed.summary || "",
        experience: parsed.experience || [],
        education: parsed.education || [],
        skills: parsed.skills || [],
        projects: parsed.projects || [],
        certifications: parsed.certifications || [],
      });
    } else {
      const data = await res.json();
      alert(data.error || "Upload failed");
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  // Experience helpers
  function addExperience() {
    const entry: WorkExperience = {
      id: generateId("exp"),
      title: "",
      company: "",
      location: "",
      startDate: "",
      endDate: "",
      current: false,
      description: "",
      highlights: [],
    };
    setCv({ ...cv, experience: [...cv.experience, entry] });
  }

  function updateExperience(index: number, field: string, value: unknown) {
    const updated = [...cv.experience];
    updated[index] = { ...updated[index], [field]: value };
    setCv({ ...cv, experience: updated });
  }

  function removeExperience(index: number) {
    setCv({ ...cv, experience: cv.experience.filter((_, i) => i !== index) });
  }

  function addExpHighlight(expIndex: number) {
    const updated = [...cv.experience];
    updated[expIndex] = {
      ...updated[expIndex],
      highlights: [...updated[expIndex].highlights, ""],
    };
    setCv({ ...cv, experience: updated });
  }

  function updateExpHighlight(expIndex: number, hIndex: number, value: string) {
    const updated = [...cv.experience];
    const highlights = [...updated[expIndex].highlights];
    highlights[hIndex] = value;
    updated[expIndex] = { ...updated[expIndex], highlights };
    setCv({ ...cv, experience: updated });
  }

  function removeExpHighlight(expIndex: number, hIndex: number) {
    const updated = [...cv.experience];
    updated[expIndex] = {
      ...updated[expIndex],
      highlights: updated[expIndex].highlights.filter((_, i) => i !== hIndex),
    };
    setCv({ ...cv, experience: updated });
  }

  // Education helpers
  function addEducation() {
    const entry: Education = {
      id: generateId("edu"),
      degree: "",
      field: "",
      institution: "",
      location: "",
      startDate: "",
      endDate: "",
      gpa: "",
      highlights: [],
    };
    setCv({ ...cv, education: [...cv.education, entry] });
  }

  function updateEducation(index: number, field: string, value: unknown) {
    const updated = [...cv.education];
    updated[index] = { ...updated[index], [field]: value };
    setCv({ ...cv, education: updated });
  }

  function removeEducation(index: number) {
    setCv({ ...cv, education: cv.education.filter((_, i) => i !== index) });
  }

  // Skills helpers
  function addSkill(skill: string) {
    const trimmed = skill.trim();
    if (trimmed && !cv.skills.includes(trimmed)) {
      setCv({ ...cv, skills: [...cv.skills, trimmed] });
    }
    setSkillInput("");
  }

  function removeSkill(index: number) {
    setCv({ ...cv, skills: cv.skills.filter((_, i) => i !== index) });
  }

  // Projects helpers
  function addProject() {
    const entry: Project = {
      id: generateId("proj"),
      name: "",
      description: "",
      url: "",
      technologies: [],
      highlights: [],
    };
    setCv({ ...cv, projects: [...cv.projects, entry] });
  }

  function updateProject(index: number, field: string, value: unknown) {
    const updated = [...cv.projects];
    updated[index] = { ...updated[index], [field]: value };
    setCv({ ...cv, projects: updated });
  }

  function removeProject(index: number) {
    setCv({ ...cv, projects: cv.projects.filter((_, i) => i !== index) });
  }

  // Certifications helpers
  function addCertification() {
    const entry: Certification = {
      id: generateId("cert"),
      name: "",
      issuer: "",
      date: "",
      url: "",
    };
    setCv({ ...cv, certifications: [...cv.certifications, entry] });
  }

  function updateCertification(index: number, field: string, value: string) {
    const updated = [...cv.certifications];
    updated[index] = { ...updated[index], [field]: value };
    setCv({ ...cv, certifications: updated });
  }

  function removeCertification(index: number) {
    setCv({
      ...cv,
      certifications: cv.certifications.filter((_, i) => i !== index),
    });
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">CV Profile</h1>
          <p className="mt-1 text-sm text-gray-500">
            Your master profile with all experience, skills, and education.
            Used to generate tailored resumes for each job.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/cv/generate">
            <Button variant="outline">
              <Sparkles className="mr-2 h-4 w-4" />
              Generate Resume
            </Button>
          </Link>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.md,.pdf"
            className="hidden"
            onChange={handleUpload}
          />
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            {uploading ? "Parsing..." : "Upload CV"}
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {saved ? "Saved!" : saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="personal">Personal</TabsTrigger>
          <TabsTrigger value="experience">
            Experience ({cv.experience.length})
          </TabsTrigger>
          <TabsTrigger value="education">
            Education ({cv.education.length})
          </TabsTrigger>
          <TabsTrigger value="skills">
            Skills ({cv.skills.length})
          </TabsTrigger>
          <TabsTrigger value="projects">
            Projects ({cv.projects.length})
          </TabsTrigger>
          <TabsTrigger value="certifications">
            Certs ({cv.certifications.length})
          </TabsTrigger>
        </TabsList>

        {/* Personal Info */}
        <TabsContent value="personal">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input
                    value={cv.fullName}
                    onChange={(e) =>
                      setCv({ ...cv, fullName: e.target.value })
                    }
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={cv.email}
                    onChange={(e) =>
                      setCv({ ...cv, email: e.target.value })
                    }
                    placeholder="john@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    value={cv.phone || ""}
                    onChange={(e) =>
                      setCv({ ...cv, phone: e.target.value })
                    }
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input
                    value={cv.location || ""}
                    onChange={(e) =>
                      setCv({ ...cv, location: e.target.value })
                    }
                    placeholder="San Francisco, CA"
                  />
                </div>
                <div className="space-y-2">
                  <Label>LinkedIn</Label>
                  <Input
                    value={cv.linkedin || ""}
                    onChange={(e) =>
                      setCv({ ...cv, linkedin: e.target.value })
                    }
                    placeholder="linkedin.com/in/johndoe"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Website</Label>
                  <Input
                    value={cv.website || ""}
                    onChange={(e) =>
                      setCv({ ...cv, website: e.target.value })
                    }
                    placeholder="johndoe.com"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Professional Summary</Label>
                <Textarea
                  value={cv.summary || ""}
                  onChange={(e) =>
                    setCv({ ...cv, summary: e.target.value })
                  }
                  placeholder="A brief summary of your professional background and career objectives..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Experience */}
        <TabsContent value="experience">
          <div className="space-y-4">
            {cv.experience.map((exp, i) => (
              <Card key={exp.id}>
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <CardTitle className="text-base">
                    {exp.title || exp.company
                      ? `${exp.title}${exp.company ? ` at ${exp.company}` : ""}`
                      : `Experience ${i + 1}`}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeExperience(i)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Job Title</Label>
                      <Input
                        value={exp.title}
                        onChange={(e) =>
                          updateExperience(i, "title", e.target.value)
                        }
                        placeholder="Software Engineer"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Company</Label>
                      <Input
                        value={exp.company}
                        onChange={(e) =>
                          updateExperience(i, "company", e.target.value)
                        }
                        placeholder="Acme Inc."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Location</Label>
                      <Input
                        value={exp.location || ""}
                        onChange={(e) =>
                          updateExperience(i, "location", e.target.value)
                        }
                        placeholder="San Francisco, CA"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-2">
                        <Label>Start Date</Label>
                        <Input
                          type="month"
                          value={exp.startDate}
                          onChange={(e) =>
                            updateExperience(i, "startDate", e.target.value)
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>End Date</Label>
                        <Input
                          type="month"
                          value={exp.current ? "" : exp.endDate || ""}
                          onChange={(e) =>
                            updateExperience(i, "endDate", e.target.value)
                          }
                          disabled={exp.current}
                          placeholder={exp.current ? "Present" : ""}
                        />
                      </div>
                    </div>
                  </div>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={exp.current}
                      onChange={(e) =>
                        updateExperience(i, "current", e.target.checked)
                      }
                      className="rounded border-gray-300"
                    />
                    I currently work here
                  </label>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={exp.description}
                      onChange={(e) =>
                        updateExperience(i, "description", e.target.value)
                      }
                      placeholder="Brief description of your role and responsibilities..."
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Key Achievements</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => addExpHighlight(i)}
                      >
                        <Plus className="mr-1 h-3 w-3" /> Add
                      </Button>
                    </div>
                    {exp.highlights.map((h, j) => (
                      <div key={j} className="flex items-center gap-2">
                        <Input
                          value={h}
                          onChange={(e) =>
                            updateExpHighlight(i, j, e.target.value)
                          }
                          placeholder="Achieved X resulting in Y% improvement..."
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={() => removeExpHighlight(i, j)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
            <Button variant="outline" className="w-full" onClick={addExperience}>
              <Plus className="mr-2 h-4 w-4" /> Add Experience
            </Button>
          </div>
        </TabsContent>

        {/* Education */}
        <TabsContent value="education">
          <div className="space-y-4">
            {cv.education.map((edu, i) => (
              <Card key={edu.id}>
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <CardTitle className="text-base">
                    {edu.degree || edu.institution
                      ? `${edu.degree}${edu.institution ? ` - ${edu.institution}` : ""}`
                      : `Education ${i + 1}`}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeEducation(i)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Degree</Label>
                      <Input
                        value={edu.degree}
                        onChange={(e) =>
                          updateEducation(i, "degree", e.target.value)
                        }
                        placeholder="Bachelor of Science"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Field of Study</Label>
                      <Input
                        value={edu.field || ""}
                        onChange={(e) =>
                          updateEducation(i, "field", e.target.value)
                        }
                        placeholder="Computer Science"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Institution</Label>
                      <Input
                        value={edu.institution}
                        onChange={(e) =>
                          updateEducation(i, "institution", e.target.value)
                        }
                        placeholder="MIT"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Location</Label>
                      <Input
                        value={edu.location || ""}
                        onChange={(e) =>
                          updateEducation(i, "location", e.target.value)
                        }
                        placeholder="Cambridge, MA"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-2">
                        <Label>Start Date</Label>
                        <Input
                          type="month"
                          value={edu.startDate || ""}
                          onChange={(e) =>
                            updateEducation(i, "startDate", e.target.value)
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>End Date</Label>
                        <Input
                          type="month"
                          value={edu.endDate || ""}
                          onChange={(e) =>
                            updateEducation(i, "endDate", e.target.value)
                          }
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>GPA (optional)</Label>
                      <Input
                        value={edu.gpa || ""}
                        onChange={(e) =>
                          updateEducation(i, "gpa", e.target.value)
                        }
                        placeholder="3.8/4.0"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            <Button variant="outline" className="w-full" onClick={addEducation}>
              <Plus className="mr-2 h-4 w-4" /> Add Education
            </Button>
          </div>
        </TabsContent>

        {/* Skills */}
        <TabsContent value="skills">
          <Card>
            <CardHeader>
              <CardTitle>Skills</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addSkill(skillInput);
                    }
                  }}
                  placeholder="Type a skill and press Enter..."
                />
                <Button
                  variant="outline"
                  onClick={() => addSkill(skillInput)}
                  disabled={!skillInput.trim()}
                >
                  Add
                </Button>
              </div>
              {cv.skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {cv.skills.map((skill, i) => (
                    <Badge
                      key={i}
                      variant="secondary"
                      className="cursor-pointer gap-1 py-1.5 pl-3 pr-2 text-sm"
                      onClick={() => removeSkill(i)}
                    >
                      {skill}
                      <X className="h-3 w-3" />
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  No skills added yet. Type a skill above and press Enter.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Projects */}
        <TabsContent value="projects">
          <div className="space-y-4">
            {cv.projects.map((proj, i) => (
              <Card key={proj.id}>
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <CardTitle className="text-base">
                    {proj.name || `Project ${i + 1}`}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeProject(i)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Project Name</Label>
                      <Input
                        value={proj.name}
                        onChange={(e) =>
                          updateProject(i, "name", e.target.value)
                        }
                        placeholder="My Awesome Project"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>URL (optional)</Label>
                      <Input
                        value={proj.url || ""}
                        onChange={(e) =>
                          updateProject(i, "url", e.target.value)
                        }
                        placeholder="github.com/user/project"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={proj.description}
                      onChange={(e) =>
                        updateProject(i, "description", e.target.value)
                      }
                      placeholder="What does this project do?"
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Technologies</Label>
                    <Input
                      value={proj.technologies.join(", ")}
                      onChange={(e) =>
                        updateProject(
                          i,
                          "technologies",
                          e.target.value
                            .split(",")
                            .map((t) => t.trim())
                            .filter(Boolean)
                        )
                      }
                      placeholder="React, Node.js, PostgreSQL (comma-separated)"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Highlights</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const updated = [...cv.projects];
                          updated[i] = {
                            ...updated[i],
                            highlights: [...updated[i].highlights, ""],
                          };
                          setCv({ ...cv, projects: updated });
                        }}
                      >
                        <Plus className="mr-1 h-3 w-3" /> Add
                      </Button>
                    </div>
                    {proj.highlights.map((h, j) => (
                      <div key={j} className="flex items-center gap-2">
                        <Input
                          value={h}
                          onChange={(e) => {
                            const updated = [...cv.projects];
                            const highlights = [...updated[i].highlights];
                            highlights[j] = e.target.value;
                            updated[i] = { ...updated[i], highlights };
                            setCv({ ...cv, projects: updated });
                          }}
                          placeholder="Key achievement or feature..."
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={() => {
                            const updated = [...cv.projects];
                            updated[i] = {
                              ...updated[i],
                              highlights: updated[i].highlights.filter(
                                (_, idx) => idx !== j
                              ),
                            };
                            setCv({ ...cv, projects: updated });
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
            <Button variant="outline" className="w-full" onClick={addProject}>
              <Plus className="mr-2 h-4 w-4" /> Add Project
            </Button>
          </div>
        </TabsContent>

        {/* Certifications */}
        <TabsContent value="certifications">
          <div className="space-y-4">
            {cv.certifications.map((cert, i) => (
              <Card key={cert.id}>
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <CardTitle className="text-base">
                    {cert.name || `Certification ${i + 1}`}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeCertification(i)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Certification Name</Label>
                      <Input
                        value={cert.name}
                        onChange={(e) =>
                          updateCertification(i, "name", e.target.value)
                        }
                        placeholder="AWS Solutions Architect"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Issuing Organization</Label>
                      <Input
                        value={cert.issuer}
                        onChange={(e) =>
                          updateCertification(i, "issuer", e.target.value)
                        }
                        placeholder="Amazon Web Services"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Date</Label>
                      <Input
                        type="month"
                        value={cert.date || ""}
                        onChange={(e) =>
                          updateCertification(i, "date", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>URL (optional)</Label>
                      <Input
                        value={cert.url || ""}
                        onChange={(e) =>
                          updateCertification(i, "url", e.target.value)
                        }
                        placeholder="credential verification URL"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            <Button
              variant="outline"
              className="w-full"
              onClick={addCertification}
            >
              <Plus className="mr-2 h-4 w-4" /> Add Certification
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* Empty state hint */}
      {!cv.fullName && cv.experience.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-10 text-center">
            <FileText className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-4 text-gray-500">
              Start by uploading an existing resume or filling in your
              information manually.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload Resume to Auto-Fill
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
