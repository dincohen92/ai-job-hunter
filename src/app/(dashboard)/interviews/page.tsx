"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Calendar,
  Plus,
  Video,
  Phone,
  MapPin,
  Building,
  Clock,
  Loader2,
  CheckCircle,
  XCircle,
} from "lucide-react";
import Link from "next/link";

interface Application {
  id: string;
  job: {
    id: string;
    title: string;
    company: string;
  };
}

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
  application: Application;
}

const INTERVIEW_TYPES = [
  { value: "phone", label: "Phone Screen", icon: Phone },
  { value: "video", label: "Video Call", icon: Video },
  { value: "onsite", label: "On-site", icon: MapPin },
  { value: "technical", label: "Technical", icon: Video },
  { value: "behavioral", label: "Behavioral", icon: Video },
  { value: "panel", label: "Panel", icon: Video },
];

const STATUS_COLORS: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  rescheduled: "bg-yellow-100 text-yellow-800",
};

export default function InterviewsPage() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("upcoming");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    applicationId: "",
    scheduledAt: "",
    scheduledTime: "10:00",
    duration: "60",
    type: "video",
    location: "",
    prepNotes: "",
  });

  const fetchInterviews = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filter === "upcoming") params.set("upcoming", "true");
    else if (filter !== "all") params.set("status", filter);

    const res = await fetch(`/api/interviews?${params}`);
    if (res.ok) {
      setInterviews(await res.json());
    }
    setLoading(false);
  }, [filter]);

  const fetchApplications = useCallback(async () => {
    const res = await fetch("/api/applications");
    if (res.ok) {
      setApplications(await res.json());
    }
  }, []);

  useEffect(() => {
    fetchInterviews();
    fetchApplications();
  }, [fetchInterviews, fetchApplications]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.applicationId || !formData.scheduledAt) return;

    setSaving(true);

    const scheduledAt = new Date(
      `${formData.scheduledAt}T${formData.scheduledTime}`
    );

    const res = await fetch("/api/interviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        applicationId: formData.applicationId,
        scheduledAt: scheduledAt.toISOString(),
        duration: formData.duration ? parseInt(formData.duration) : null,
        type: formData.type,
        location: formData.location || null,
        prepNotes: formData.prepNotes || null,
      }),
    });

    if (res.ok) {
      setDialogOpen(false);
      setFormData({
        applicationId: "",
        scheduledAt: "",
        scheduledTime: "10:00",
        duration: "60",
        type: "video",
        location: "",
        prepNotes: "",
      });
      fetchInterviews();
    }
    setSaving(false);
  }

  function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }

  function formatTime(dateStr: string) {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function getTypeIcon(type: string) {
    const typeConfig = INTERVIEW_TYPES.find((t) => t.value === type);
    return typeConfig?.icon || Video;
  }

  // Group interviews by date
  const groupedInterviews = interviews.reduce(
    (acc, interview) => {
      const dateKey = new Date(interview.scheduledAt).toDateString();
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(interview);
      return acc;
    },
    {} as Record<string, Interview[]>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Interviews</h1>
          <p className="text-gray-500">Track and prepare for your interviews</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Schedule Interview
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Schedule Interview</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Job Application *</Label>
                <Select
                  value={formData.applicationId}
                  onValueChange={(v) =>
                    setFormData({ ...formData, applicationId: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an application..." />
                  </SelectTrigger>
                  <SelectContent>
                    {applications.map((app) => (
                      <SelectItem key={app.id} value={app.id}>
                        {app.job.title} - {app.job.company}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Date *</Label>
                  <Input
                    type="date"
                    value={formData.scheduledAt}
                    onChange={(e) =>
                      setFormData({ ...formData, scheduledAt: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Time *</Label>
                  <Input
                    type="time"
                    value={formData.scheduledTime}
                    onChange={(e) =>
                      setFormData({ ...formData, scheduledTime: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(v) => setFormData({ ...formData, type: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {INTERVIEW_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Duration (min)</Label>
                  <Input
                    type="number"
                    value={formData.duration}
                    onChange={(e) =>
                      setFormData({ ...formData, duration: e.target.value })
                    }
                    placeholder="60"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Location / Meeting Link</Label>
                <Input
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  placeholder="Zoom link or address"
                />
              </div>

              <div className="space-y-2">
                <Label>Prep Notes</Label>
                <Textarea
                  value={formData.prepNotes}
                  onChange={(e) =>
                    setFormData({ ...formData, prepNotes: e.target.value })
                  }
                  placeholder="Things to remember..."
                  rows={3}
                />
              </div>

              <Button type="submit" className="w-full" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Schedule Interview
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter */}
      <Card>
        <CardContent className="pt-6">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="upcoming">Upcoming</SelectItem>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Interviews List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : interviews.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              No interviews {filter === "upcoming" ? "scheduled" : "found"}
            </h3>
            <p className="mt-2 text-gray-500">
              {filter === "upcoming"
                ? "Schedule your first interview to get started."
                : "Try changing your filter."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedInterviews).map(([dateKey, dayInterviews]) => (
            <div key={dateKey}>
              <h3 className="mb-3 text-sm font-medium text-gray-500">
                {formatDate(dayInterviews[0].scheduledAt)}
              </h3>
              <div className="space-y-3">
                {dayInterviews.map((interview) => {
                  const TypeIcon = getTypeIcon(interview.type);
                  const isPast = new Date(interview.scheduledAt) < new Date();

                  return (
                    <Link key={interview.id} href={`/interviews/${interview.id}`}>
                      <Card
                        className={`transition-shadow hover:shadow-md ${isPast && interview.status === "scheduled" ? "opacity-60" : ""}`}
                      >
                        <CardContent className="flex items-center gap-4 py-4">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                            <TypeIcon className="h-6 w-6 text-gray-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">
                                {interview.application.job.title}
                              </p>
                              <Badge className={STATUS_COLORS[interview.status]}>
                                {interview.status}
                              </Badge>
                            </div>
                            <div className="mt-1 flex items-center gap-4 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <Building className="h-3 w-3" />
                                {interview.application.job.company}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatTime(interview.scheduledAt)}
                                {interview.duration && ` (${interview.duration}m)`}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            {interview.status === "completed" ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : interview.status === "cancelled" ? (
                              <XCircle className="h-5 w-5 text-red-500" />
                            ) : null}
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
