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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Building,
  Video,
  Phone,
  MapPin,
  ExternalLink,
  Loader2,
  Trash2,
  Save,
  Calendar,
} from "lucide-react";
import Link from "next/link";

interface Interview {
  id: string;
  scheduledAt: string;
  duration: number | null;
  type: string;
  location: string | null;
  interviewers: string | null;
  status: string;
  prepNotes: string | null;
  postNotes: string | null;
  application: {
    id: string;
    job: {
      id: string;
      title: string;
      company: string;
      description: string;
    };
  };
}

const TYPE_ICONS: Record<string, typeof Video> = {
  phone: Phone,
  video: Video,
  onsite: MapPin,
  technical: Video,
  behavioral: Video,
  panel: Video,
};

const STATUS_OPTIONS = [
  { value: "scheduled", label: "Scheduled" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "rescheduled", label: "Rescheduled" },
];

export default function InterviewDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [interview, setInterview] = useState<Interview | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [prepNotes, setPrepNotes] = useState("");
  const [postNotes, setPostNotes] = useState("");
  const [status, setStatus] = useState("scheduled");

  const fetchInterview = useCallback(async () => {
    const res = await fetch(`/api/interviews/${id}`);
    if (res.ok) {
      const data = await res.json();
      setInterview(data);
      setPrepNotes(data.prepNotes || "");
      setPostNotes(data.postNotes || "");
      setStatus(data.status);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchInterview();
  }, [fetchInterview]);

  async function handleSave() {
    setSaving(true);
    await fetch(`/api/interviews/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prepNotes, postNotes, status }),
    });
    setSaving(false);
    fetchInterview();
  }

  async function handleDelete() {
    if (!confirm("Delete this interview?")) return;
    setDeleting(true);
    await fetch(`/api/interviews/${id}`, { method: "DELETE" });
    router.push("/interviews");
  }

  function formatDateTime(dateStr: string) {
    const date = new Date(dateStr);
    return date.toLocaleString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function isUpcoming() {
    if (!interview) return false;
    return new Date(interview.scheduledAt) > new Date();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="py-20 text-center text-gray-500">Interview not found</div>
    );
  }

  const TypeIcon = TYPE_ICONS[interview.type] || Video;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/interviews">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">
            {interview.application.job.title}
          </h1>
          <div className="mt-1 flex items-center gap-4 text-gray-500">
            <span className="flex items-center gap-1">
              <Building className="h-4 w-4" />
              {interview.application.job.company}
            </span>
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
        {/* Interview Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Interview Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-gray-400" />
              <div>
                <p className="font-medium">
                  {formatDateTime(interview.scheduledAt)}
                </p>
                {interview.duration && (
                  <p className="text-sm text-gray-500">
                    {interview.duration} minutes
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <TypeIcon className="h-5 w-5 text-gray-400" />
              <div>
                <p className="font-medium capitalize">{interview.type}</p>
                <p className="text-sm text-gray-500">Interview Type</p>
              </div>
            </div>

            {interview.location && (
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5 text-gray-400" />
                <div>
                  {interview.location.startsWith("http") ? (
                    <a
                      href={interview.location}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-blue-600 hover:underline"
                    >
                      Join Meeting
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <p className="font-medium">{interview.location}</p>
                  )}
                  <p className="text-sm text-gray-500">Location</p>
                </div>
              </div>
            )}

            <div className="border-t pt-4">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="mt-2">
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
            </div>

            <Link href={`/jobs/${interview.application.job.id}`}>
              <Button variant="outline" className="w-full">
                <Building className="mr-2 h-4 w-4" />
                View Job Details
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Notes Section */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Interview Notes</CardTitle>
            <Button onClick={handleSave} disabled={saving} size="sm">
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Notes
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Prep Notes */}
            <div className="space-y-2">
              <Label htmlFor="prepNotes">
                Preparation Notes
                {isUpcoming() && (
                  <Badge variant="secondary" className="ml-2">
                    Before Interview
                  </Badge>
                )}
              </Label>
              <Textarea
                id="prepNotes"
                value={prepNotes}
                onChange={(e) => setPrepNotes(e.target.value)}
                placeholder="Things to remember, questions to ask, topics to discuss..."
                rows={6}
              />
            </div>

            {/* Post Notes */}
            <div className="space-y-2">
              <Label htmlFor="postNotes">
                Post-Interview Reflection
                {!isUpcoming() && (
                  <Badge variant="secondary" className="ml-2">
                    After Interview
                  </Badge>
                )}
              </Label>
              <Textarea
                id="postNotes"
                value={postNotes}
                onChange={(e) => setPostNotes(e.target.value)}
                placeholder="How did it go? What questions were asked? What could you improve?"
                rows={6}
                disabled={isUpcoming()}
                className={isUpcoming() ? "opacity-50" : ""}
              />
              {isUpcoming() && (
                <p className="text-xs text-gray-500">
                  Available after the interview date
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Prep Tips */}
      {isUpcoming() && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Prep Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-2 text-sm text-gray-600 sm:grid-cols-2">
              <li className="flex items-start gap-2">
                <span className="text-blue-500">1.</span>
                Research the company and recent news
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500">2.</span>
                Review the job description requirements
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500">3.</span>
                Prepare STAR stories for behavioral questions
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500">4.</span>
                Have 3-5 thoughtful questions ready
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500">5.</span>
                Test your tech setup 15 min before
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500">6.</span>
                Have your resume and notes accessible
              </li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
