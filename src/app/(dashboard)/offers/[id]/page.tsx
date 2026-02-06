"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  ArrowLeft,
  Save,
  DollarSign,
  Building2,
  MapPin,
  Calendar,
  Briefcase,
  TrendingUp,
  Check,
  X,
  Trash2,
} from "lucide-react";
import Link from "next/link";

interface Offer {
  id: string;
  applicationId: string;
  baseSalary: number | null;
  bonus: number | null;
  bonusType: string | null;
  equity: string | null;
  equityValue: number | null;
  vestingYears: number | null;
  benefits: string | null;
  benefitsValue: number | null;
  pto: number | null;
  remotePolicy: string | null;
  location: string | null;
  startDate: string | null;
  expirationDate: string | null;
  status: string;
  notes: string | null;
  negotiationLog: string | null;
  createdAt: string;
  application: {
    job: {
      id: string;
      title: string;
      company: string;
      location: string | null;
      salaryMin: number | null;
      salaryMax: number | null;
      salaryExpectation: number | null;
    };
  };
}

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "negotiating", label: "Negotiating" },
  { value: "accepted", label: "Accepted" },
  { value: "declined", label: "Declined" },
  { value: "expired", label: "Expired" },
];

const BONUS_TYPES = [
  { value: "signing", label: "Signing Bonus" },
  { value: "annual", label: "Annual Bonus" },
  { value: "performance", label: "Performance Bonus" },
];

const REMOTE_OPTIONS = [
  { value: "full", label: "Fully Remote" },
  { value: "hybrid", label: "Hybrid" },
  { value: "onsite", label: "On-site" },
];

function formatCurrency(amount: number | null): string {
  if (amount === null || amount === undefined) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date: string | null): string {
  if (!date) return "";
  return new Date(date).toISOString().split("T")[0];
}

export default function OfferDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const router = useRouter();
  const [offer, setOffer] = useState<Offer | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<Offer>>({});

  useEffect(() => {
    async function fetchOffer() {
      const res = await fetch(`/api/offers/${id}`);
      if (res.ok) {
        const data = await res.json();
        setOffer(data);
        setFormData(data);
      } else if (res.status === 404) {
        router.push("/offers");
      }
      setLoading(false);
    }
    fetchOffer();
  }, [id, router]);

  async function handleSave() {
    if (!offer) return;
    setSaving(true);

    const res = await fetch(`/api/offers/${offer.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    if (res.ok) {
      const updated = await res.json();
      setOffer({ ...offer, ...updated });
    } else {
      alert("Failed to save changes");
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!offer) return;
    if (!confirm("Delete this offer? This action cannot be undone.")) return;

    const res = await fetch(`/api/offers/${offer.id}`, {
      method: "DELETE",
    });

    if (res.ok) {
      router.push("/offers");
    }
  }

  async function handleStatusChange(status: string) {
    setFormData({ ...formData, status });

    if (!offer) return;

    const res = await fetch(`/api/offers/${offer.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...formData, status }),
    });

    if (res.ok) {
      const updated = await res.json();
      setOffer({ ...offer, ...updated });
    }
  }

  // Calculate total compensation
  const totalComp = {
    base: Number(formData.baseSalary) || 0,
    bonus: Number(formData.bonus) || 0,
    equityPerYear: formData.equityValue && formData.vestingYears
      ? Math.round(Number(formData.equityValue) / Number(formData.vestingYears))
      : 0,
    benefits: Number(formData.benefitsValue) || 0,
  };
  const cashComp = totalComp.base + totalComp.bonus;
  const totalCompValue = totalComp.base + totalComp.bonus + totalComp.equityPerYear + totalComp.benefits;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading offer...</div>
      </div>
    );
  }

  if (!offer) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/offers")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{offer.application.job.title}</h1>
            <p className="text-gray-500 flex items-center gap-2 mt-1">
              <Building2 className="h-4 w-4" />
              {offer.application.job.company}
              {offer.application.job.location && (
                <>
                  <span className="text-gray-300">•</span>
                  <MapPin className="h-4 w-4" />
                  {offer.application.job.location}
                </>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2">
        <Badge
          variant={formData.status === "pending" ? "default" : "outline"}
          className="cursor-pointer"
          onClick={() => handleStatusChange("pending")}
        >
          Pending
        </Badge>
        <Badge
          variant={formData.status === "negotiating" ? "default" : "outline"}
          className="cursor-pointer"
          onClick={() => handleStatusChange("negotiating")}
        >
          Negotiating
        </Badge>
        <Button
          size="sm"
          variant="outline"
          className="text-green-600 hover:bg-green-50"
          onClick={() => handleStatusChange("accepted")}
        >
          <Check className="mr-1 h-4 w-4" />
          Accept
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="text-red-600 hover:bg-red-50"
          onClick={() => handleStatusChange("declined")}
        >
          <X className="mr-1 h-4 w-4" />
          Decline
        </Button>
      </div>

      {/* Total Compensation Summary */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Total Compensation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <p className="text-xs text-gray-500">Base Salary</p>
              <p className="text-xl font-bold">{formatCurrency(totalComp.base)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Bonus</p>
              <p className="text-xl font-bold">{formatCurrency(totalComp.bonus)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Equity/Year</p>
              <p className="text-xl font-bold">{formatCurrency(totalComp.equityPerYear)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Benefits</p>
              <p className="text-xl font-bold">{formatCurrency(totalComp.benefits)}</p>
            </div>
            <div className="border-l-2 border-green-500 pl-4">
              <p className="text-xs text-gray-500">Total/Year</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(totalCompValue)}</p>
              <p className="text-xs text-gray-400">Cash: {formatCurrency(cashComp)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Compensation Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Compensation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="baseSalary">Base Salary</Label>
              <Input
                id="baseSalary"
                type="number"
                value={formData.baseSalary || ""}
                onChange={(e) => setFormData({ ...formData, baseSalary: e.target.value ? parseInt(e.target.value) : null })}
                placeholder="e.g., 150000"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bonus">Bonus</Label>
                <Input
                  id="bonus"
                  type="number"
                  value={formData.bonus || ""}
                  onChange={(e) => setFormData({ ...formData, bonus: e.target.value ? parseInt(e.target.value) : null })}
                  placeholder="e.g., 20000"
                />
              </div>
              <div>
                <Label htmlFor="bonusType">Bonus Type</Label>
                <Select
                  value={formData.bonusType || ""}
                  onValueChange={(value) => setFormData({ ...formData, bonusType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {BONUS_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="equity">Equity Package</Label>
              <Input
                id="equity"
                value={formData.equity || ""}
                onChange={(e) => setFormData({ ...formData, equity: e.target.value })}
                placeholder="e.g., 10,000 RSUs"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="equityValue">Equity Value ($)</Label>
                <Input
                  id="equityValue"
                  type="number"
                  value={formData.equityValue || ""}
                  onChange={(e) => setFormData({ ...formData, equityValue: e.target.value ? parseInt(e.target.value) : null })}
                  placeholder="Total value"
                />
              </div>
              <div>
                <Label htmlFor="vestingYears">Vesting Years</Label>
                <Input
                  id="vestingYears"
                  type="number"
                  value={formData.vestingYears || 4}
                  onChange={(e) => setFormData({ ...formData, vestingYears: e.target.value ? parseInt(e.target.value) : null })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Benefits & Perks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Benefits & Perks
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="benefits">Benefits Description</Label>
              <Textarea
                id="benefits"
                value={formData.benefits || ""}
                onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
                placeholder="Health, dental, 401k match, etc..."
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="benefitsValue">Estimated Benefits Value/Year</Label>
              <Input
                id="benefitsValue"
                type="number"
                value={formData.benefitsValue || ""}
                onChange={(e) => setFormData({ ...formData, benefitsValue: e.target.value ? parseInt(e.target.value) : null })}
                placeholder="e.g., 15000"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="pto">PTO (days/year)</Label>
                <Input
                  id="pto"
                  type="number"
                  value={formData.pto || ""}
                  onChange={(e) => setFormData({ ...formData, pto: e.target.value ? parseInt(e.target.value) : null })}
                  placeholder="e.g., 20"
                />
              </div>
              <div>
                <Label htmlFor="remotePolicy">Remote Policy</Label>
                <Select
                  value={formData.remotePolicy || ""}
                  onValueChange={(value) => setFormData({ ...formData, remotePolicy: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select policy" />
                  </SelectTrigger>
                  <SelectContent>
                    {REMOTE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="location">Work Location</Label>
              <Input
                id="location"
                value={formData.location || ""}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g., San Francisco, CA"
              />
            </div>
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Timeline
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status || "pending"}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
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
            <div>
              <Label htmlFor="startDate">Proposed Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={formatDate(formData.startDate as string | null)}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value || null })}
              />
            </div>
            <div>
              <Label htmlFor="expirationDate">Offer Expiration</Label>
              <Input
                id="expirationDate"
                type="date"
                value={formatDate(formData.expirationDate as string | null)}
                onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value || null })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Notes & Negotiation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="notes">General Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes || ""}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any notes about this offer..."
                rows={4}
              />
            </div>
            <div>
              <Label htmlFor="negotiationLog">Negotiation Log</Label>
              <Textarea
                id="negotiationLog"
                value={formData.negotiationLog || ""}
                onChange={(e) => setFormData({ ...formData, negotiationLog: e.target.value })}
                placeholder="Track negotiation rounds and responses..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Job Details Reference */}
      {(offer.application.job.salaryMin || offer.application.job.salaryExpectation) && (
        <Card>
          <CardHeader>
            <CardTitle>Reference: Original Job Details</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-6 text-sm text-gray-600">
            {offer.application.job.salaryMin && (
              <div>
                <span className="font-medium">Posted Range:</span>{" "}
                {formatCurrency(offer.application.job.salaryMin)} - {formatCurrency(offer.application.job.salaryMax)}
              </div>
            )}
            {offer.application.job.salaryExpectation && (
              <div>
                <span className="font-medium">Your Expectation:</span>{" "}
                {formatCurrency(offer.application.job.salaryExpectation)}
              </div>
            )}
            <Link
              href={`/jobs/${offer.application.job.id}`}
              className="text-blue-600 hover:underline"
            >
              View Job →
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
