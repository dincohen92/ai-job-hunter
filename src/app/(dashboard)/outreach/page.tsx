"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Send,
  Sparkles,
  Loader2,
  Plus,
  Mail,
  Trash2,
} from "lucide-react";

interface EmailRecord {
  id: string;
  recipientEmail: string;
  recipientName: string | null;
  subject: string;
  body: string;
  status: string;
  sentAt: string | null;
  createdAt: string;
  job: { title: string; company: string } | null;
}

interface Job {
  id: string;
  title: string;
  company: string;
}

interface Resume {
  id: string;
  name: string;
}

export default function OutreachPage() {
  const searchParams = useSearchParams();
  const preselectedJobId = searchParams.get("jobId");

  const [emails, setEmails] = useState<EmailRecord[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [composeOpen, setComposeOpen] = useState(!!preselectedJobId);

  // Compose form
  const [selectedJob, setSelectedJob] = useState(preselectedJobId || "");
  const [selectedResume, setSelectedResume] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [tone, setTone] = useState("professional");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState<string | null>(null);
  const [generatedEmailId, setGeneratedEmailId] = useState<string | null>(null);

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    const [emailsRes, jobsRes, resumesRes] = await Promise.all([
      fetch("/api/outreach"),
      fetch("/api/jobs"),
      fetch("/api/resume"),
    ]);
    if (emailsRes.ok) setEmails(await emailsRes.json());
    if (jobsRes.ok) setJobs(await jobsRes.json());
    if (resumesRes.ok) {
      const r = await resumesRes.json();
      setResumes(r);
      if (r.length > 0) setSelectedResume(r[0].id);
    }
  }

  async function handleGenerate() {
    if (!selectedJob || !recipientEmail) return;
    setGenerating(true);

    try {
      const res = await fetch("/api/outreach/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: selectedJob,
          resumeId: selectedResume || undefined,
          recipientName: recipientName || undefined,
          recipientEmail,
          tone,
        }),
      });

      if (!res.ok) throw new Error("Generation failed");
      const data = await res.json();
      setSubject(data.subject);
      setBody(data.plainText || data.body);
      setGeneratedEmailId(data.id);
      fetchAll();
    } catch {
      alert("Failed to generate email. Check your Anthropic API key.");
    } finally {
      setGenerating(false);
    }
  }

  async function handleSend(emailId: string) {
    if (!confirm("Send this email?")) return;
    setSending(emailId);

    const res = await fetch("/api/outreach/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emailId }),
    });

    if (res.ok) {
      fetchAll();
    } else {
      const data = await res.json();
      alert(data.error || "Failed to send. Check your SMTP settings.");
    }
    setSending(null);
  }

  async function handleSaveDraft() {
    if (!subject || !body || !recipientEmail) return;

    if (generatedEmailId) {
      await fetch(`/api/outreach/${generatedEmailId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, body, recipientEmail, recipientName }),
      });
    } else {
      await fetch("/api/outreach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: selectedJob || undefined,
          recipientEmail,
          recipientName,
          subject,
          body,
        }),
      });
    }

    fetchAll();
    resetForm();
    setComposeOpen(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this email?")) return;
    await fetch(`/api/outreach/${id}`, { method: "DELETE" });
    fetchAll();
  }

  function resetForm() {
    setSelectedJob("");
    setRecipientName("");
    setRecipientEmail("");
    setSubject("");
    setBody("");
    setGeneratedEmailId(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Outreach</h1>
        <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Compose
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Compose Outreach Email</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Target Job</Label>
                  <Select value={selectedJob} onValueChange={setSelectedJob}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a job" />
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
                <div>
                  <Label>Your Resume</Label>
                  <Select
                    value={selectedResume}
                    onValueChange={setSelectedResume}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select resume" />
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
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Recipient Name</Label>
                  <Input
                    placeholder="Jane Smith"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Recipient Email *</Label>
                  <Input
                    type="email"
                    placeholder="recruiter@company.com"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <Label>Tone</Label>
                <Select value={tone} onValueChange={setTone}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={generating || !selectedJob || !recipientEmail}
                variant="outline"
                className="w-full"
              >
                {generating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate with AI
                  </>
                )}
              </Button>

              <div>
                <Label>Subject</Label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Email subject"
                />
              </div>

              <div>
                <Label>Body</Label>
                <Textarea
                  className="min-h-[200px]"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Email body"
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSaveDraft} variant="outline" className="flex-1">
                  Save as Draft
                </Button>
                {generatedEmailId && (
                  <Button
                    onClick={() => handleSend(generatedEmailId)}
                    className="flex-1"
                    disabled={sending === generatedEmailId}
                  >
                    {sending === generatedEmailId ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="mr-2 h-4 w-4" />
                    )}
                    Send Now
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Email History</CardTitle>
        </CardHeader>
        <CardContent>
          {emails.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              <Mail className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-4">No emails yet. Compose your first outreach.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Job</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {emails.map((email) => (
                  <TableRow key={email.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {email.recipientName || email.recipientEmail}
                        </p>
                        {email.recipientName && (
                          <p className="text-xs text-gray-500">
                            {email.recipientEmail}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {email.subject}
                    </TableCell>
                    <TableCell>
                      {email.job
                        ? `${email.job.title} @ ${email.job.company}`
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          email.status === "sent"
                            ? "default"
                            : email.status === "failed"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {email.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {new Date(email.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {email.status === "draft" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleSend(email.id)}
                            disabled={sending === email.id}
                          >
                            {sending === email.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Send className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500"
                          onClick={() => handleDelete(email.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
