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
import { Send, Loader2, Plus, Mail, Trash2 } from "lucide-react";

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

export default function OutreachPage() {
  const searchParams = useSearchParams();
  const preselectedJobId = searchParams.get("jobId");

  const [emails, setEmails] = useState<EmailRecord[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [composeOpen, setComposeOpen] = useState(!!preselectedJobId);

  // Compose form
  const [selectedJob, setSelectedJob] = useState(preselectedJobId || "");
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState<string | null>(null);
  const [savedEmailId, setSavedEmailId] = useState<string | null>(null);

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    const [emailsRes, jobsRes] = await Promise.all([
      fetch("/api/outreach"),
      fetch("/api/jobs"),
    ]);
    if (emailsRes.ok) setEmails(await emailsRes.json());
    if (jobsRes.ok) setJobs(await jobsRes.json());
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

    if (savedEmailId) {
      await fetch(`/api/outreach/${savedEmailId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, body, recipientEmail, recipientName }),
      });
    } else {
      const res = await fetch("/api/outreach", {
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
      if (res.ok) {
        const data = await res.json();
        setSavedEmailId(data.id);
      }
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
    setSavedEmailId(null);
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
              <div>
                <Label>Target Job</Label>
                <Select value={selectedJob} onValueChange={setSelectedJob}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a job (optional)" />
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
                  placeholder="Paste your outreach email here (drafted by Ember)"
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSaveDraft} variant="outline" className="flex-1">
                  Save as Draft
                </Button>
                {savedEmailId && (
                  <Button
                    onClick={() => handleSend(savedEmailId)}
                    className="flex-1"
                    disabled={sending === savedEmailId}
                  >
                    {sending === savedEmailId ? (
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
