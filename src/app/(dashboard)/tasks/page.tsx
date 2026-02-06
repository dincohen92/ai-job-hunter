"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Plus,
  Loader2,
  CheckCircle2,
  Circle,
  Trash2,
  Building,
  User,
  Calendar,
} from "lucide-react";

interface Task {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  priority: string;
  status: string;
  type: string | null;
  completedAt: string | null;
  application: { job: { title: string; company: string } } | null;
  contact: { name: string; company: string | null } | null;
  job: { title: string; company: string } | null;
}

const PRIORITY_COLORS: Record<string, string> = {
  high: "bg-red-100 text-red-800 border-red-200",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
  low: "bg-green-100 text-green-800 border-green-200",
};

const TYPE_LABELS: Record<string, string> = {
  follow_up: "Follow Up",
  thank_you: "Thank You",
  check_in: "Check In",
  apply: "Apply",
  custom: "Custom",
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState("medium");
  const [type, setType] = useState("custom");

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    let url = "/api/tasks";
    if (activeTab === "pending") {
      url += "?status=pending";
    } else if (activeTab === "completed") {
      url += "?status=completed";
    } else if (activeTab === "overdue") {
      url += "?due=overdue";
    } else if (activeTab === "today") {
      url += "?due=today";
    }

    const res = await fetch(url);
    if (res.ok) {
      setTasks(await res.json());
    }
    setLoading(false);
  }, [activeTab]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  async function handleCreate() {
    if (!title.trim()) return;
    setSaving(true);

    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description: description || null,
        dueDate: dueDate || null,
        priority,
        type,
      }),
    });

    setTitle("");
    setDescription("");
    setDueDate("");
    setPriority("medium");
    setType("custom");
    setDialogOpen(false);
    setSaving(false);
    fetchTasks();
  }

  async function toggleComplete(task: Task) {
    const newStatus = task.status === "completed" ? "pending" : "completed";
    await fetch(`/api/tasks/${task.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchTasks();
  }

  async function deleteTask(id: string) {
    if (!confirm("Delete this task?")) return;
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    fetchTasks();
  }

  function formatDueDate(dateStr: string) {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const isToday = date.toDateString() === today.toDateString();
    const isTomorrow = date.toDateString() === tomorrow.toDateString();
    const isOverdue = date < today && !isToday;

    if (isToday) return { text: "Today", className: "text-blue-600" };
    if (isTomorrow) return { text: "Tomorrow", className: "text-gray-600" };
    if (isOverdue) return { text: date.toLocaleDateString(), className: "text-red-600" };
    return { text: date.toLocaleDateString(), className: "text-gray-500" };
  }

  function getLinkedContext(task: Task) {
    if (task.application) {
      return `${task.application.job.title} at ${task.application.job.company}`;
    }
    if (task.contact) {
      return task.contact.company
        ? `${task.contact.name} (${task.contact.company})`
        : task.contact.name;
    }
    if (task.job) {
      return `${task.job.title} at ${task.job.company}`;
    }
    return null;
  }

  const pendingCount = tasks.filter((t) => t.status === "pending").length;
  const overdueCount = tasks.filter(
    (t) => t.status === "pending" && t.dueDate && new Date(t.dueDate) < new Date()
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tasks</h1>
          <p className="text-sm text-gray-500">
            {pendingCount} pending{overdueCount > 0 && `, ${overdueCount} overdue`}
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="What do you need to do?"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add details..."
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Task Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="follow_up">Follow Up</SelectItem>
                    <SelectItem value="thank_you">Thank You</SelectItem>
                    <SelectItem value="check_in">Check In</SelectItem>
                    <SelectItem value="apply">Apply</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreate} disabled={saving || !title.trim()} className="w-full">
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                Create Task
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="today">Due Today</TabsTrigger>
          <TabsTrigger value="overdue" className="text-red-600">
            Overdue {overdueCount > 0 && `(${overdueCount})`}
          </TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : tasks.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                <CheckCircle2 className="mx-auto h-12 w-12 text-gray-300" />
                <p className="mt-4">No tasks found</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setDialogOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create your first task
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {tasks.map((task) => {
                const dueInfo = task.dueDate ? formatDueDate(task.dueDate) : null;
                const context = getLinkedContext(task);
                const isCompleted = task.status === "completed";

                return (
                  <Card
                    key={task.id}
                    className={`transition-colors ${isCompleted ? "bg-gray-50" : ""}`}
                  >
                    <CardContent className="flex items-start gap-3 py-4">
                      <button
                        onClick={() => toggleComplete(task)}
                        className="mt-0.5 shrink-0"
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : (
                          <Circle className="h-5 w-5 text-gray-300 hover:text-gray-400" />
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p
                              className={`font-medium ${
                                isCompleted ? "text-gray-400 line-through" : ""
                              }`}
                            >
                              {task.title}
                            </p>
                            {task.description && (
                              <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                                {task.description}
                              </p>
                            )}
                          </div>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0"
                            onClick={() => deleteTask(task.id)}
                          >
                            <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-500" />
                          </Button>
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <Badge
                            variant="outline"
                            className={PRIORITY_COLORS[task.priority]}
                          >
                            {task.priority}
                          </Badge>

                          {task.type && (
                            <Badge variant="secondary">
                              {TYPE_LABELS[task.type] || task.type}
                            </Badge>
                          )}

                          {dueInfo && (
                            <span className={`flex items-center gap-1 text-xs ${dueInfo.className}`}>
                              <Calendar className="h-3 w-3" />
                              {dueInfo.text}
                            </span>
                          )}

                          {context && (
                            <span className="flex items-center gap-1 text-xs text-gray-500">
                              {task.contact ? (
                                <User className="h-3 w-3" />
                              ) : (
                                <Building className="h-3 w-3" />
                              )}
                              {context}
                            </span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
