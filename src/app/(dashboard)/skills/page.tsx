"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Target,
  RefreshCw,
  Loader2,
  CheckCircle2,
  BookOpen,
  TrendingUp,
  ExternalLink,
} from "lucide-react";

interface Skill {
  id: string;
  skill: string;
  demandCount: number;
  hasSkill: boolean;
  priority: string;
  status: string;
  resources: string[];
  notes: string | null;
}

export default function SkillsPage() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [filter, setFilter] = useState<"all" | "gaps" | "learning" | "acquired">(
    "all"
  );

  useEffect(() => {
    fetchSkills();
  }, []);

  async function fetchSkills() {
    setLoading(true);
    try {
      const res = await fetch("/api/skills");
      if (res.ok) {
        const data = await res.json();
        setSkills(data);
      }
    } finally {
      setLoading(false);
    }
  }

  async function analyzeSkills() {
    setAnalyzing(true);
    try {
      const res = await fetch("/api/skills/analyze", { method: "POST" });
      if (res.ok) {
        await fetchSkills();
      }
    } finally {
      setAnalyzing(false);
    }
  }

  async function updateSkillStatus(skill: string, status: string) {
    await fetch(`/api/skills/${encodeURIComponent(skill)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    setSkills((prev) =>
      prev.map((s) => (s.skill === skill ? { ...s, status } : s))
    );
  }

  function getPriorityColor(priority: string) {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-700";
      case "medium":
        return "bg-yellow-100 text-yellow-700";
      case "low":
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case "acquired":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "learning":
        return <BookOpen className="h-4 w-4 text-blue-500" />;
      default:
        return <Target className="h-4 w-4 text-gray-400" />;
    }
  }

  const filteredSkills = skills.filter((skill) => {
    if (filter === "all") return true;
    if (filter === "gaps") return skill.status === "gap";
    if (filter === "learning") return skill.status === "learning";
    if (filter === "acquired") return skill.hasSkill || skill.status === "acquired";
    return true;
  });

  const gapSkills = skills.filter((s) => s.status === "gap");
  const learningSkills = skills.filter((s) => s.status === "learning");
  const acquiredSkills = skills.filter(
    (s) => s.hasSkill || s.status === "acquired"
  );

  const totalDemand = skills.reduce((sum, s) => sum + s.demandCount, 0);
  const coveredDemand = skills
    .filter((s) => s.hasSkill || s.status === "acquired")
    .reduce((sum, s) => sum + s.demandCount, 0);
  const coveragePercent =
    totalDemand > 0 ? Math.round((coveredDemand / totalDemand) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Skills Gap Analysis</h1>
          <p className="mt-1 text-gray-500">
            Identify missing skills based on your saved jobs
          </p>
        </div>
        <Button onClick={analyzeSkills} disabled={analyzing}>
          {analyzing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Analyze Jobs
            </>
          )}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Skill Coverage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{coveragePercent}%</div>
            <Progress value={coveragePercent} className="mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Skills You Have
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span className="text-2xl font-bold">{acquiredSkills.length}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Currently Learning
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-500" />
              <span className="text-2xl font-bold">{learningSkills.length}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Skills to Learn
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-orange-500" />
              <span className="text-2xl font-bold">{gapSkills.length}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-500">Filter:</span>
        <Select
          value={filter}
          onValueChange={(v) => setFilter(v as typeof filter)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Skills ({skills.length})</SelectItem>
            <SelectItem value="gaps">Gaps ({gapSkills.length})</SelectItem>
            <SelectItem value="learning">
              Learning ({learningSkills.length})
            </SelectItem>
            <SelectItem value="acquired">
              Acquired ({acquiredSkills.length})
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Skills List */}
      {loading ? (
        <div className="py-12 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : skills.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Target className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-4 text-gray-500">No skills analyzed yet</p>
            <p className="mt-1 text-sm text-gray-400">
              Save some jobs and click &quot;Analyze Jobs&quot; to find skill
              gaps
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredSkills.map((skill) => (
            <Card key={skill.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(skill.status)}
                    <CardTitle className="text-lg capitalize">
                      {skill.skill}
                    </CardTitle>
                  </div>
                  <Badge className={getPriorityColor(skill.priority)}>
                    {skill.priority}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-3 flex items-center gap-2 text-sm text-gray-500">
                  <span>Mentioned in {skill.demandCount} jobs</span>
                </div>

                <div className="mb-3">
                  <Select
                    value={skill.status}
                    onValueChange={(v) => updateSkillStatus(skill.skill, v)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gap">Not Started</SelectItem>
                      <SelectItem value="learning">Learning</SelectItem>
                      <SelectItem value="acquired">Acquired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {skill.resources.length > 0 && skill.status !== "acquired" && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-gray-500">
                      Learning Resources:
                    </p>
                    {skill.resources.slice(0, 2).map((url, i) => {
                      const domain = new URL(url).hostname.replace("www.", "");
                      return (
                        <a
                          key={i}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" />
                          {domain}
                        </a>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
