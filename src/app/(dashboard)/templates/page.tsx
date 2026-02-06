"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Plus,
  Copy,
  Trash2,
  Loader2,
  Edit2,
  FileText,
  Check,
} from "lucide-react";

interface Template {
  id: string;
  category: string;
  question: string;
  answer: string;
  tags: string | null;
  charCount: number;
  usageCount: number;
}

const CATEGORIES = [
  { value: "authorization", label: "Work Authorization" },
  { value: "salary", label: "Salary Expectations" },
  { value: "availability", label: "Availability" },
  { value: "about_me", label: "About Me" },
  { value: "why_here", label: "Why This Company" },
  { value: "custom", label: "Custom" },
];

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [saving, setSaving] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form state
  const [category, setCategory] = useState("custom");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");

  useEffect(() => {
    fetchTemplates();
  }, []);

  async function fetchTemplates() {
    setLoading(true);
    try {
      const res = await fetch("/api/templates");
      if (res.ok) {
        const data = await res.json();
        setTemplates(data);
      }
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setCategory("custom");
    setQuestion("");
    setAnswer("");
    setEditingTemplate(null);
  }

  async function saveTemplate() {
    if (!question.trim() || !answer.trim()) return;
    setSaving(true);

    try {
      const url = editingTemplate
        ? `/api/templates/${editingTemplate.id}`
        : "/api/templates";
      const method = editingTemplate ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, question, answer }),
      });

      if (res.ok) {
        setDialogOpen(false);
        resetForm();
        fetchTemplates();
      }
    } finally {
      setSaving(false);
    }
  }

  async function copyTemplate(template: Template) {
    await navigator.clipboard.writeText(template.answer);
    await fetch(`/api/templates/${template.id}/copy`, { method: "POST" });
    setCopiedId(template.id);
    setTimeout(() => setCopiedId(null), 2000);

    // Update local state
    setTemplates((prev) =>
      prev.map((t) =>
        t.id === template.id ? { ...t, usageCount: t.usageCount + 1 } : t
      )
    );
  }

  async function deleteTemplate(id: string) {
    if (!confirm("Delete this template?")) return;
    setDeletingId(id);

    await fetch(`/api/templates/${id}`, { method: "DELETE" });
    setTemplates((prev) => prev.filter((t) => t.id !== id));
    setDeletingId(null);
  }

  function openEditDialog(template: Template) {
    setEditingTemplate(template);
    setCategory(template.category);
    setQuestion(template.question);
    setAnswer(template.answer);
    setDialogOpen(true);
  }

  function getCategoryLabel(cat: string) {
    return CATEGORIES.find((c) => c.value === cat)?.label || cat;
  }

  const filteredTemplates =
    activeCategory === "all"
      ? templates
      : templates.filter((t) => t.category === activeCategory);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Application Templates</h1>
          <p className="mt-1 text-gray-500">
            Save common answers to speed up job applications
          </p>
        </div>
        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? "Edit Template" : "Create Template"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="question">Question</Label>
                <Input
                  id="question"
                  placeholder="e.g., What are your salary expectations?"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="answer">Answer</Label>
                  <span className="text-xs text-gray-400">
                    {answer.length} characters
                  </span>
                </div>
                <Textarea
                  id="answer"
                  placeholder="Your template answer..."
                  className="min-h-[200px]"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                />
              </div>
              <Button
                onClick={saveTemplate}
                disabled={saving || !question.trim() || !answer.trim()}
                className="w-full"
              >
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <FileText className="mr-2 h-4 w-4" />
                )}
                {editingTemplate ? "Update Template" : "Save Template"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          {CATEGORIES.map((cat) => (
            <TabsTrigger key={cat.value} value={cat.value}>
              {cat.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeCategory} className="mt-4">
          {loading ? (
            <div className="py-12 text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : filteredTemplates.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="mx-auto h-12 w-12 text-gray-300" />
                <p className="mt-4 text-gray-500">No templates yet</p>
                <p className="mt-1 text-sm text-gray-400">
                  Create templates for common application questions
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {filteredTemplates.map((template) => (
                <Card key={template.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <Badge variant="outline" className="mb-2">
                          {getCategoryLabel(template.category)}
                        </Badge>
                        <CardTitle className="text-base">
                          {template.question}
                        </CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="line-clamp-4 text-sm text-gray-600">
                      {template.answer}
                    </p>
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <span>{template.charCount} chars</span>
                        <span>•</span>
                        <span>Used {template.usageCount}x</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyTemplate(template)}
                        >
                          {copiedId === template.id ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(template)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteTemplate(template.id)}
                          disabled={deletingId === template.id}
                        >
                          {deletingId === template.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-500" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
