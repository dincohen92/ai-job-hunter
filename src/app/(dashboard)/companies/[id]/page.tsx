"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  ArrowLeft,
  Globe,
  MapPin,
  Users,
  Building2,
  ExternalLink,
  Briefcase,
  Save,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Link2,
} from "lucide-react";
import Link from "next/link";

interface SavedJob {
  id: string;
  title: string;
  createdAt: string;
}

interface Contact {
  id: string;
  name: string;
  role: string | null;
  email: string | null;
}

interface Company {
  id: string;
  name: string;
  website: string | null;
  industry: string | null;
  size: string | null;
  location: string | null;
  description: string | null;
  culture: string | null;
  techStack: string | null;
  glassdoor: string | null;
  linkedin: string | null;
  notes: string | null;
  pros: string | null;
  cons: string | null;
  salaryRange: string | null;
  interviewProcess: string | null;
  createdAt: string;
  updatedAt: string;
  savedJobs: SavedJob[];
  contacts: Contact[];
}

const COMPANY_SIZES = [
  { value: "startup", label: "Startup (1-50)" },
  { value: "small", label: "Small (51-200)" },
  { value: "medium", label: "Medium (201-1000)" },
  { value: "large", label: "Large (1001-5000)" },
  { value: "enterprise", label: "Enterprise (5000+)" },
];

export default function CompanyDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const router = useRouter();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<Company>>({});

  useEffect(() => {
    async function fetchCompany() {
      const res = await fetch(`/api/companies/${id}`);
      if (res.ok) {
        const data = await res.json();
        setCompany(data);
        setFormData(data);
      } else if (res.status === 404) {
        router.push("/companies");
      }
      setLoading(false);
    }
    fetchCompany();
  }, [id, router]);

  async function handleSave() {
    if (!company) return;
    setSaving(true);

    const res = await fetch(`/api/companies/${company.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    if (res.ok) {
      const updated = await res.json();
      setCompany({ ...company, ...updated });
    } else {
      const data = await res.json();
      alert(data.error || "Failed to save changes");
    }
    setSaving(false);
  }

  function getSizeLabel(size: string | null) {
    if (!size) return "Not specified";
    const found = COMPANY_SIZES.find((s) => s.value === size);
    return found ? found.label : size;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading company...</div>
      </div>
    );
  }

  if (!company) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/companies")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{company.name}</h1>
            {company.industry && (
              <Badge variant="secondary" className="mt-1">
                {company.industry}
              </Badge>
            )}
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
        {company.location && (
          <span className="flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            {company.location}
          </span>
        )}
        {company.size && (
          <span className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            {getSizeLabel(company.size)}
          </span>
        )}
        {company.website && (
          <a
            href={company.website.startsWith("http") ? company.website : `https://${company.website}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-blue-600 hover:underline"
          >
            <Globe className="h-4 w-4" />
            Website
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
        {company.linkedin && (
          <a
            href={company.linkedin.startsWith("http") ? company.linkedin : `https://${company.linkedin}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-blue-600 hover:underline"
          >
            <Link2 className="h-4 w-4" />
            LinkedIn
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
        {company.glassdoor && (
          <a
            href={company.glassdoor.startsWith("http") ? company.glassdoor : `https://${company.glassdoor}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-blue-600 hover:underline"
          >
            <Building2 className="h-4 w-4" />
            Glassdoor
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="research">Research Notes</TabsTrigger>
          <TabsTrigger value="jobs">Jobs ({company.savedJobs.length})</TabsTrigger>
          <TabsTrigger value="contacts">Contacts ({company.contacts.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Company Name</Label>
                  <Input
                    id="name"
                    value={formData.name || ""}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={formData.website || ""}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="industry">Industry</Label>
                    <Input
                      id="industry"
                      value={formData.industry || ""}
                      onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="size">Company Size</Label>
                    <Select
                      value={formData.size || ""}
                      onValueChange={(value) => setFormData({ ...formData, size: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select size" />
                      </SelectTrigger>
                      <SelectContent>
                        {COMPANY_SIZES.map((size) => (
                          <SelectItem key={size.value} value={size.value}>
                            {size.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={formData.location || ""}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description || ""}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    placeholder="What does this company do?"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Links & Resources</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="linkedin">LinkedIn Company Page</Label>
                  <Input
                    id="linkedin"
                    value={formData.linkedin || ""}
                    onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                    placeholder="https://linkedin.com/company/..."
                  />
                </div>
                <div>
                  <Label htmlFor="glassdoor">Glassdoor Page</Label>
                  <Input
                    id="glassdoor"
                    value={formData.glassdoor || ""}
                    onChange={(e) => setFormData({ ...formData, glassdoor: e.target.value })}
                    placeholder="https://glassdoor.com/..."
                  />
                </div>
                <div>
                  <Label htmlFor="salaryRange">Typical Salary Range</Label>
                  <Input
                    id="salaryRange"
                    value={formData.salaryRange || ""}
                    onChange={(e) => setFormData({ ...formData, salaryRange: e.target.value })}
                    placeholder="e.g., $120k-$180k for senior roles"
                  />
                </div>
                <div>
                  <Label htmlFor="techStack">Tech Stack</Label>
                  <Input
                    id="techStack"
                    value={formData.techStack || ""}
                    onChange={(e) => setFormData({ ...formData, techStack: e.target.value })}
                    placeholder="e.g., React, Node.js, AWS, PostgreSQL"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="research" className="space-y-6 mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ThumbsUp className="h-5 w-5 text-green-600" />
                  Pros
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={formData.pros || ""}
                  onChange={(e) => setFormData({ ...formData, pros: e.target.value })}
                  rows={6}
                  placeholder="What's great about this company? Good reviews, benefits, growth opportunities..."
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ThumbsDown className="h-5 w-5 text-red-600" />
                  Cons / Red Flags
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={formData.cons || ""}
                  onChange={(e) => setFormData({ ...formData, cons: e.target.value })}
                  rows={6}
                  placeholder="Any concerns? Negative reviews, high turnover, outdated tech..."
                />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5" />
                Company Culture
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.culture || ""}
                onChange={(e) => setFormData({ ...formData, culture: e.target.value })}
                rows={4}
                placeholder="Notes about work environment, values, remote policy, work-life balance..."
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MessageSquare className="h-5 w-5" />
                Interview Process
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.interviewProcess || ""}
                onChange={(e) => setFormData({ ...formData, interviewProcess: e.target.value })}
                rows={4}
                placeholder="What to expect: number of rounds, types of interviews, common questions, timeline..."
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">General Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.notes || ""}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={6}
                placeholder="Any other research notes, articles, news, connections..."
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="jobs" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Jobs at {company.name}</CardTitle>
            </CardHeader>
            <CardContent>
              {company.savedJobs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Briefcase className="mx-auto h-10 w-10 text-gray-300" />
                  <p className="mt-2">No saved jobs linked to this company yet.</p>
                  <p className="text-sm mt-1">
                    Jobs will appear here when you save jobs from this company.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {company.savedJobs.map((job) => (
                    <Link
                      key={job.id}
                      href={`/jobs/${job.id}`}
                      className="flex items-center justify-between rounded-md border p-3 hover:bg-gray-50"
                    >
                      <span className="font-medium">{job.title}</span>
                      <span className="text-sm text-gray-500">
                        {new Date(job.createdAt).toLocaleDateString()}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contacts" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Contacts at {company.name}</CardTitle>
            </CardHeader>
            <CardContent>
              {company.contacts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="mx-auto h-10 w-10 text-gray-300" />
                  <p className="mt-2">No contacts linked to this company yet.</p>
                  <p className="text-sm mt-1">
                    Link contacts to this company from the Contacts page.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {company.contacts.map((contact) => (
                    <Link
                      key={contact.id}
                      href={`/contacts/${contact.id}`}
                      className="flex items-center justify-between rounded-md border p-3 hover:bg-gray-50"
                    >
                      <div>
                        <span className="font-medium">{contact.name}</span>
                        {contact.role && (
                          <span className="ml-2 text-sm text-gray-500">{contact.role}</span>
                        )}
                      </div>
                      {contact.email && (
                        <span className="text-sm text-gray-500">{contact.email}</span>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
