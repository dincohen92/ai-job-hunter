"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
  Sparkles,
  Star,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";

interface InterviewQuestion {
  id: string;
  question: string;
  type: string;
  answer: string | null;
  starAnswer: string | null;
  notes: string | null;
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
  wentWell: string | null;
  toImprove: string | null;
  questionsAsked: string | null;
  myQuestions: string | null;
  overallRating: number | null;
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

const QUESTION_TYPES = [
  { value: "behavioral", label: "Behavioral", color: "bg-blue-100 text-blue-800" },
  { value: "technical", label: "Technical", color: "bg-purple-100 text-purple-800" },
  { value: "situational", label: "Situational", color: "bg-green-100 text-green-800" },
  { value: "company", label: "Company", color: "bg-orange-100 text-orange-800" },
];

export default function InterviewDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [interview, setInterview] = useState<Interview | null>(null);
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Form states
  const [prepNotes, setPrepNotes] = useState("");
  const [status, setStatus] = useState("scheduled");
  const [wentWell, setWentWell] = useState("");
  const [toImprove, setToImprove] = useState("");
  const [overallRating, setOverallRating] = useState<number | null>(null);

  // Prep tips from AI
  const [companyTips, setCompanyTips] = useState<string[]>([]);
  const [prepChecklist, setPrepChecklist] = useState<string[]>([
    "Review the job description requirements",
    "Research the company and recent news",
    "Prepare STAR stories for behavioral questions",
    "Have 3-5 thoughtful questions ready",
    "Test your tech setup 15 min before",
    "Have your resume and notes accessible",
  ]);
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());

  const fetchInterview = useCallback(async () => {
    const res = await fetch(`/api/interviews/${id}`);
    if (res.ok) {
      const data = await res.json();
      setInterview(data);
      setPrepNotes(data.prepNotes || "");
      setStatus(data.status);
      setWentWell(data.wentWell || "");
      setToImprove(data.toImprove || "");
      setOverallRating(data.overallRating);
    }
    setLoading(false);
  }, [id]);

  const fetchQuestions = useCallback(async () => {
    const res = await fetch(`/api/interviews/${id}/questions`);
    if (res.ok) {
      setQuestions(await res.json());
    }
  }, [id]);

  useEffect(() => {
    fetchInterview();
    fetchQuestions();
  }, [fetchInterview, fetchQuestions]);

  async function handleSave() {
    setSaving(true);
    await fetch(`/api/interviews/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prepNotes,
        status,
        wentWell,
        toImprove,
        overallRating,
      }),
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

  async function handleGenerateQuestions() {
    setGenerating(true);
    try {
      const res = await fetch(`/api/interviews/${id}/generate-questions`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        setQuestions(data.questions);
        if (data.companyResearchTips?.length) {
          setCompanyTips(data.companyResearchTips);
        }
        if (data.prepChecklist?.length) {
          setPrepChecklist(data.prepChecklist);
        }
      } else {
        const data = await res.json();
        alert(data.error || "Failed to generate questions");
      }
    } catch {
      alert("Failed to generate questions");
    }
    setGenerating(false);
  }

  async function updateQuestionAnswer(qId: string, answer: string) {
    await fetch(`/api/interviews/${id}/questions/${qId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answer }),
    });
  }

  async function deleteQuestion(qId: string) {
    await fetch(`/api/interviews/${id}/questions/${qId}`, {
      method: "DELETE",
    });
    setQuestions(questions.filter((q) => q.id !== qId));
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

  function toggleChecked(index: number) {
    const newChecked = new Set(Array.from(checkedItems));
    if (newChecked.has(index)) {
      newChecked.delete(index);
    } else {
      newChecked.add(index);
    }
    setCheckedItems(newChecked);
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
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {formatDateTime(interview.scheduledAt)}
            </span>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save
        </Button>
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

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Interview Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <TypeIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="font-medium capitalize">{interview.type}</p>
                  <p className="text-sm text-gray-500">
                    {interview.duration ? `${interview.duration} min` : "Interview"}
                  </p>
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
                      <p className="text-sm">{interview.location}</p>
                    )}
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

              <Link href={`/jobs/${interview.application.job.id}?from=interview`}>
                <Button variant="outline" className="w-full">
                  <Building className="mr-2 h-4 w-4" />
                  View Job Details
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Prep Checklist */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-base">
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Prep Checklist
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {prepChecklist.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <button
                      onClick={() => toggleChecked(i)}
                      className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border text-xs ${
                        checkedItems.has(i)
                          ? "border-green-500 bg-green-500 text-white"
                          : "border-gray-300"
                      }`}
                    >
                      {checkedItems.has(i) && "✓"}
                    </button>
                    <span
                      className={`text-sm ${
                        checkedItems.has(i) ? "text-gray-400 line-through" : ""
                      }`}
                    >
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <Tabs defaultValue={isUpcoming() ? "questions" : "reflection"}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="questions">
                Practice Questions ({questions.length})
              </TabsTrigger>
              <TabsTrigger value="notes">Prep Notes</TabsTrigger>
              <TabsTrigger value="reflection">
                Reflection
                {!isUpcoming() && <Badge className="ml-2" variant="secondary">New</Badge>}
              </TabsTrigger>
            </TabsList>

            {/* Practice Questions Tab */}
            <TabsContent value="questions" className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Practice answering these questions before your interview.
                </p>
                <Button
                  onClick={handleGenerateQuestions}
                  disabled={generating}
                  size="sm"
                >
                  {generating ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 h-4 w-4" />
                  )}
                  {questions.length > 0 ? "Regenerate" : "Generate Questions"}
                </Button>
              </div>

              {/* STAR Method Guide */}
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="py-4">
                  <p className="mb-2 font-medium text-blue-900">
                    STAR Method for Behavioral Questions
                  </p>
                  <div className="grid gap-2 text-sm text-blue-800 sm:grid-cols-4">
                    <div>
                      <span className="font-semibold">S</span>ituation - Set the context
                    </div>
                    <div>
                      <span className="font-semibold">T</span>ask - Your responsibility
                    </div>
                    <div>
                      <span className="font-semibold">A</span>ction - What you did
                    </div>
                    <div>
                      <span className="font-semibold">R</span>esult - The outcome
                    </div>
                  </div>
                </CardContent>
              </Card>

              {questions.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-gray-500">
                    <Sparkles className="mx-auto h-12 w-12 text-gray-300" />
                    <p className="mt-4">No practice questions yet.</p>
                    <p className="text-sm">
                      Click &quot;Generate Questions&quot; to create AI-powered practice questions.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <Accordion type="single" collapsible className="space-y-2">
                  {questions.map((q, i) => {
                    const typeInfo = QUESTION_TYPES.find((t) => t.value === q.type);
                    return (
                      <AccordionItem
                        key={q.id}
                        value={q.id}
                        className="rounded-lg border bg-white px-4"
                      >
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-start gap-3 text-left">
                            <span className="mt-0.5 text-gray-400">{i + 1}.</span>
                            <div className="flex-1">
                              <p className="font-medium">{q.question}</p>
                              <div className="mt-1 flex items-center gap-2">
                                <Badge
                                  variant="secondary"
                                  className={typeInfo?.color}
                                >
                                  {typeInfo?.label || q.type}
                                </Badge>
                                {q.notes && (
                                  <span className="text-xs text-gray-500">
                                    Hint: {q.notes}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pb-4">
                          <div className="space-y-4 pt-2">
                            {q.type === "behavioral" && q.starAnswer && (
                              <div className="rounded-md bg-gray-50 p-3">
                                <p className="mb-2 text-sm font-medium text-gray-700">
                                  STAR Framework Guide:
                                </p>
                                {(() => {
                                  try {
                                    const star = JSON.parse(q.starAnswer);
                                    return (
                                      <ul className="space-y-1 text-sm text-gray-600">
                                        <li>
                                          <strong>S:</strong> {star.situation}
                                        </li>
                                        <li>
                                          <strong>T:</strong> {star.task}
                                        </li>
                                        <li>
                                          <strong>A:</strong> {star.action}
                                        </li>
                                        <li>
                                          <strong>R:</strong> {star.result}
                                        </li>
                                      </ul>
                                    );
                                  } catch {
                                    return null;
                                  }
                                })()}
                              </div>
                            )}
                            <div>
                              <Label htmlFor={`answer-${q.id}`}>Your Answer</Label>
                              <Textarea
                                id={`answer-${q.id}`}
                                defaultValue={q.answer || ""}
                                onBlur={(e) =>
                                  updateQuestionAnswer(q.id, e.target.value)
                                }
                                placeholder="Write your prepared answer here..."
                                rows={4}
                                className="mt-2"
                              />
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500"
                              onClick={() => deleteQuestion(q.id)}
                            >
                              <Trash2 className="mr-2 h-3 w-3" />
                              Remove Question
                            </Button>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              )}

              {/* Company Research Tips */}
              {companyTips.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Company Research Tips</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc space-y-1 pl-5 text-sm">
                      {companyTips.map((tip, i) => (
                        <li key={i}>{tip}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Prep Notes Tab */}
            <TabsContent value="notes">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Preparation Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={prepNotes}
                    onChange={(e) => setPrepNotes(e.target.value)}
                    placeholder="Things to remember, questions to ask, key points to highlight..."
                    rows={12}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Reflection Tab */}
            <TabsContent value="reflection" className="space-y-4">
              {isUpcoming() ? (
                <Card>
                  <CardContent className="py-12 text-center text-gray-500">
                    <Calendar className="mx-auto h-12 w-12 text-gray-300" />
                    <p className="mt-4">
                      Complete this after your interview on{" "}
                      {formatDateTime(interview.scheduledAt)}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">How did it go?</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Label>Overall Rating:</Label>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((rating) => (
                            <button
                              key={rating}
                              onClick={() => setOverallRating(rating)}
                              className="p-1"
                            >
                              <Star
                                className={`h-6 w-6 ${
                                  overallRating && rating <= overallRating
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-gray-300"
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base text-green-700">
                          What Went Well
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Textarea
                          value={wentWell}
                          onChange={(e) => setWentWell(e.target.value)}
                          placeholder="What did you do well? What felt natural?"
                          rows={5}
                        />
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base text-orange-700">
                          Areas to Improve
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Textarea
                          value={toImprove}
                          onChange={(e) => setToImprove(e.target.value)}
                          placeholder="What could you have done better? What to practice?"
                          rows={5}
                        />
                      </CardContent>
                    </Card>
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
