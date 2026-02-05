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
import { Loader2, CheckCircle, XCircle } from "lucide-react";

interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  fromName: string;
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
  }, []);

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
    </div>
  );
}
