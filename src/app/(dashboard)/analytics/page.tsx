"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Funnel,
  FunnelChart,
  LabelList,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Target,
  Users,
  Briefcase,
  CheckCircle,
} from "lucide-react";

interface AnalyticsData {
  summary: {
    totalApplications: number;
    applied: number;
    interviewing: number;
    offers: number;
    accepted: number;
    rejected: number;
    responseRate: number;
    interviewRate: number;
    offerRate: number;
    acceptRate: number;
  };
  funnel: Record<string, number>;
  activityTrend: { date: string; applications: number; jobs: number }[];
  sourceBreakdown: { source: string; total: number; applied: number; interviewing: number }[];
  jobTypeBreakdown: { type: string; count: number }[];
  topCompanies: { company: string; count: number }[];
  weeklyComparison: {
    thisWeek: number;
    lastWeek: number;
    changePercent: number;
  };
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

const FUNNEL_COLORS = {
  saved: "#94a3b8",
  applied: "#3b82f6",
  interviewing: "#f59e0b",
  offer: "#10b981",
  accepted: "#22c55e",
  rejected: "#ef4444",
};

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics?days=${days}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Analytics</h1>
        <div className="flex items-center justify-center py-20">
          <div className="text-gray-500">Loading analytics...</div>
        </div>
      </div>
    );
  }

  if (!data || data.summary.totalApplications === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Analytics</h1>
        <Card>
          <CardContent className="py-10 text-center">
            <Briefcase className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              No data yet
            </h3>
            <p className="mt-2 text-gray-500">
              Start tracking your applications to see analytics here.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const funnelData = [
    { name: "Saved", value: data.funnel.saved, fill: FUNNEL_COLORS.saved },
    { name: "Applied", value: data.funnel.applied, fill: FUNNEL_COLORS.applied },
    { name: "Interviewing", value: data.funnel.interviewing, fill: FUNNEL_COLORS.interviewing },
    { name: "Offer", value: data.funnel.offer, fill: FUNNEL_COLORS.offer },
    { name: "Accepted", value: data.funnel.accepted, fill: FUNNEL_COLORS.accepted },
  ].filter((d) => d.value > 0);

  const weeklyTrend = data.weeklyComparison.changePercent;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Analytics</h1>
        <select
          value={days}
          onChange={(e) => setDays(parseInt(e.target.value))}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Applications
            </CardTitle>
            <Briefcase className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.totalApplications}</div>
            <div className="flex items-center text-sm">
              {weeklyTrend >= 0 ? (
                <TrendingUp className="mr-1 h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="mr-1 h-4 w-4 text-red-500" />
              )}
              <span className={weeklyTrend >= 0 ? "text-green-600" : "text-red-600"}>
                {weeklyTrend >= 0 ? "+" : ""}{weeklyTrend}%
              </span>
              <span className="ml-1 text-gray-500">vs last week</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Response Rate
            </CardTitle>
            <Target className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.responseRate}%</div>
            <p className="text-sm text-gray-500">
              {data.summary.interviewing} of {data.summary.applied} got responses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Interviews
            </CardTitle>
            <Users className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.interviewing}</div>
            <p className="text-sm text-gray-500">
              {data.summary.interviewRate}% interview rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Offers
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.offers}</div>
            <p className="text-sm text-gray-500">
              {data.summary.offerRate}% offer rate from interviews
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Application Funnel */}
        <Card>
          <CardHeader>
            <CardTitle>Application Funnel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <FunnelChart>
                  <Tooltip />
                  <Funnel
                    dataKey="value"
                    data={funnelData}
                    isAnimationActive
                  >
                    <LabelList
                      position="right"
                      fill="#000"
                      stroke="none"
                      dataKey="name"
                    />
                    <LabelList
                      position="center"
                      fill="#fff"
                      stroke="none"
                      dataKey="value"
                    />
                  </Funnel>
                </FunnelChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Activity Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Activity Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.activityTrend.slice(-14)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(date) => {
                      const d = new Date(date);
                      return `${d.getMonth() + 1}/${d.getDate()}`;
                    }}
                  />
                  <YAxis allowDecimals={false} />
                  <Tooltip
                    labelFormatter={(date) => new Date(date).toLocaleDateString()}
                  />
                  <Line
                    type="monotone"
                    dataKey="applications"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="Applications"
                  />
                  <Line
                    type="monotone"
                    dataKey="jobs"
                    stroke="#10b981"
                    strokeWidth={2}
                    name="Jobs Saved"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Source Breakdown */}
        {data.sourceBreakdown.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Applications by Source</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.sourceBreakdown} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" allowDecimals={false} />
                    <YAxis dataKey="source" type="category" width={80} />
                    <Tooltip />
                    <Bar dataKey="total" fill="#3b82f6" name="Total" />
                    <Bar dataKey="interviewing" fill="#10b981" name="Interviewing" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Job Type Distribution */}
        {data.jobTypeBreakdown.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Job Type Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.jobTypeBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ payload, percent }) => {
                        const typeName = (payload as { type?: string })?.type || "Unknown";
                        const pct = typeof percent === "number" ? percent : 0;
                        return `${typeName} (${(pct * 100).toFixed(0)}%)`;
                      }}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {data.jobTypeBreakdown.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Top Companies */}
      {data.topCompanies.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Companies Applied To</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.topCompanies.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="company"
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    interval={0}
                  />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" name="Applications" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status Summary Table */}
      <Card>
        <CardHeader>
          <CardTitle>Status Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {Object.entries(data.funnel).map(([status, count]) => (
              <div
                key={status}
                className="rounded-lg border p-4 text-center"
                style={{
                  borderLeftWidth: 4,
                  borderLeftColor: FUNNEL_COLORS[status as keyof typeof FUNNEL_COLORS] || "#94a3b8",
                }}
              >
                <p className="text-2xl font-bold">{count}</p>
                <p className="text-sm capitalize text-gray-500">{status}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
