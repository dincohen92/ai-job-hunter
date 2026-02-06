"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  CheckCircle,
  XCircle,
  Upload,
  RotateCcw,
  Database,
  FileJson,
  FileSpreadsheet,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  fromName: string;
}

interface Backup {
  id: string;
  name: string;
  size: number;
  createdAt: string;
}

export default function SettingsPage() {
  const { data: session } = useSession();

  const [smtp, setSmtp] = useState<SmtpConfig>({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    username: "",
    password: "",
    fromName: "",
  });
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    error?: string;
  } | null>(null);

  // Data management state
  const [backups, setBackups] = useState<Backup[]>([]);
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [exportTypes, setExportTypes] = useState({
    cvProfile: true,
    savedJobs: true,
    applications: true,
    contacts: true,
    companies: true,
    templates: true,
  });

  useEffect(() => {
    fetch("/api/settings/smtp")
      .then((r) => r.json())
      .then((data) => {
        if (data) {
          setSmtp({
            host: data.host,
            port: data.port,
            secure: data.secure,
            username: data.username,
            password: data.password,
            fromName: data.fromName || "",
          });
        }
      });
    fetchBackups();
  }, []);

  async function fetchBackups() {
    const res = await fetch("/api/backups");
    if (res.ok) {
      const data = await res.json();
      setBackups(data);
    }
  }

  async function createBackup() {
    setCreatingBackup(true);
    const res = await fetch("/api/backups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    if (res.ok) {
      fetchBackups();
    }
    setCreatingBackup(false);
  }

  async function restoreBackup(id: string) {
    if (!confirm("This will replace all your current data. Are you sure?")) {
      return;
    }
    setRestoringId(id);
    await fetch(`/api/backups/${id}/restore`, { method: "POST" });
    setRestoringId(null);
    alert("Restore complete! Please refresh the page.");
  }

  async function handleExport(format: "json" | "csv") {
    setExporting(true);
    const types = Object.entries(exportTypes)
      .filter(([, v]) => v)
      .map(([k]) => k)
      .join(",");

    window.location.href = `/api/export?format=${format}&types=${types}`;
    setTimeout(() => setExporting(false), 1000);
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      const res = await fetch("/api/import?mode=merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        const result = await res.json();
        alert(`Import complete! ${JSON.stringify(result.stats)}`);
      } else {
        alert("Import failed");
      }
    } catch {
      alert("Invalid JSON file");
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  }

  function formatBytes(bytes: number) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }

  async function handleSave() {
    setSaving(true);
    const res = await fetch("/api/settings/smtp", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(smtp),
    });

    if (res.ok) {
      setTestResult({ success: true });
      setTimeout(() => setTestResult(null), 3000);
    }
    setSaving(false);
  }

  async function handleTest() {
    setTesting(true);
    setTestResult(null);

    const res = await fetch("/api/settings/smtp/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(smtp),
    });

    const data = await res.json();
    setTestResult(data);
    setTesting(false);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div>
            <Label className="text-gray-500">Name</Label>
            <p className="font-medium">{session?.user?.name || "Not set"}</p>
          </div>
          <div>
            <Label className="text-gray-500">Email</Label>
            <p className="font-medium">{session?.user?.email}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>SMTP Configuration</CardTitle>
          <CardDescription>
            Configure your email account to send outreach emails directly.
            For Gmail, use an App Password (not your regular password).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Email Provider</Label>
              <Select
                value={smtp.host}
                onValueChange={(v) => {
                  const presets: Record<string, { host: string; port: number }> = {
                    "smtp.gmail.com": { host: "smtp.gmail.com", port: 587 },
                    "smtp.office365.com": { host: "smtp.office365.com", port: 587 },
                    custom: { host: "", port: 587 },
                  };
                  const preset = presets[v] || presets.custom;
                  setSmtp((s) => ({ ...s, host: preset.host, port: preset.port }));
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="smtp.gmail.com">Gmail</SelectItem>
                  <SelectItem value="smtp.office365.com">
                    Outlook / Office 365
                  </SelectItem>
                  <SelectItem value="custom">Custom SMTP</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Port</Label>
              <Input
                type="number"
                value={smtp.port}
                onChange={(e) =>
                  setSmtp((s) => ({ ...s, port: Number(e.target.value) }))
                }
              />
            </div>
          </div>

          {smtp.host !== "smtp.gmail.com" &&
            smtp.host !== "smtp.office365.com" && (
              <div>
                <Label>SMTP Host</Label>
                <Input
                  value={smtp.host}
                  onChange={(e) =>
                    setSmtp((s) => ({ ...s, host: e.target.value }))
                  }
                  placeholder="smtp.example.com"
                />
              </div>
            )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Email Address</Label>
              <Input
                type="email"
                value={smtp.username}
                onChange={(e) =>
                  setSmtp((s) => ({ ...s, username: e.target.value }))
                }
                placeholder="your@email.com"
              />
            </div>
            <div>
              <Label>Password / App Password</Label>
              <Input
                type="password"
                value={smtp.password}
                onChange={(e) =>
                  setSmtp((s) => ({ ...s, password: e.target.value }))
                }
                placeholder="App password"
              />
            </div>
          </div>

          <div>
            <Label>Display Name (From name)</Label>
            <Input
              value={smtp.fromName}
              onChange={(e) =>
                setSmtp((s) => ({ ...s, fromName: e.target.value }))
              }
              placeholder="Your Name"
            />
          </div>

          {testResult && (
            <div
              className={`flex items-center gap-2 rounded-md p-3 ${
                testResult.success
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {testResult.success ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Connection successful!
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4" />
                  {testResult.error || "Connection failed"}
                </>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleTest}
              disabled={testing || !smtp.host || !smtp.username || !smtp.password}
            >
              {testing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Test Connection
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Save Settings
            </Button>
          </div>

          <div className="rounded-md bg-blue-50 p-4 text-sm text-blue-700">
            <p className="font-medium">Gmail App Password Setup:</p>
            <ol className="mt-2 list-decimal space-y-1 pl-5">
              <li>Go to Google Account &gt; Security</li>
              <li>Enable 2-Step Verification if not already on</li>
              <li>Go to &quot;App passwords&quot; (search in Google Account settings)</li>
              <li>Generate a password for &quot;Mail&quot;</li>
              <li>Use the 16-character password above</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>API Configuration</CardTitle>
          <CardDescription>
            API keys are configured via environment variables on the server.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Anthropic (Claude AI)</p>
              <p className="text-sm text-gray-500">
                Used for resume analysis, tailoring, and email generation
              </p>
            </div>
            <Badge variant="outline">Server-side</Badge>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">RapidAPI (JSearch)</p>
              <p className="text-sm text-gray-500">
                Used for searching job listings
              </p>
            </div>
            <Badge variant="outline">Server-side</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
          <CardDescription>
            Export your data, import from other tools, or create backups.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Export Section */}
          <div>
            <h3 className="mb-3 font-medium">Export Data</h3>
            <div className="mb-3 flex flex-wrap gap-4">
              {Object.entries(exportTypes).map(([key, value]) => (
                <label key={key} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={value}
                    onCheckedChange={(checked) =>
                      setExportTypes((prev) => ({
                        ...prev,
                        [key]: checked === true,
                      }))
                    }
                  />
                  <span className="capitalize">{key.replace(/([A-Z])/g, " $1")}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => handleExport("json")}
                disabled={exporting}
              >
                <FileJson className="mr-2 h-4 w-4" />
                Export JSON
              </Button>
              <Button
                variant="outline"
                onClick={() => handleExport("csv")}
                disabled={exporting}
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>

          {/* Import Section */}
          <div>
            <h3 className="mb-3 font-medium">Import Data</h3>
            <p className="mb-2 text-sm text-gray-500">
              Import from a JSON file (exported from this app or compatible format)
            </p>
            <div className="flex items-center gap-2">
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
                id="import-file"
                disabled={importing}
              />
              <Button
                variant="outline"
                onClick={() => document.getElementById("import-file")?.click()}
                disabled={importing}
              >
                {importing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}
                Import JSON
              </Button>
            </div>
          </div>

          {/* Backups Section */}
          <div>
            <h3 className="mb-3 font-medium">Backups</h3>
            <div className="mb-3">
              <Button onClick={createBackup} disabled={creatingBackup}>
                {creatingBackup ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Database className="mr-2 h-4 w-4" />
                )}
                Create Backup
              </Button>
            </div>

            {backups.length === 0 ? (
              <p className="text-sm text-gray-500">No backups yet</p>
            ) : (
              <div className="space-y-2">
                {backups.map((backup) => (
                  <div
                    key={backup.id}
                    className="flex items-center justify-between rounded-md border p-3"
                  >
                    <div>
                      <p className="font-medium">{backup.name}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(backup.createdAt).toLocaleString()} •{" "}
                        {formatBytes(backup.size)}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => restoreBackup(backup.id)}
                      disabled={restoringId === backup.id}
                    >
                      {restoringId === backup.id ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <RotateCcw className="mr-2 h-4 w-4" />
                      )}
                      Restore
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
