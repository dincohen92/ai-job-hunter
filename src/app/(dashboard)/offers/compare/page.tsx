"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  DollarSign,
  Building2,
  MapPin,
  Calendar,
  TrendingUp,
  Crown,
} from "lucide-react";

interface OfferWithCalc {
  id: string;
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
  status: string;
  application: {
    job: {
      id: string;
      title: string;
      company: string;
      location: string | null;
    };
  };
  calculated: {
    totalComp: number;
    cashComp: number;
    equityPerYear: number;
  };
}

function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

function CompareContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [offers, setOffers] = useState<OfferWithCalc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ids = searchParams.get("ids");
    if (!ids) {
      router.push("/offers");
      return;
    }

    async function fetchComparison() {
      const res = await fetch(`/api/offers/compare?ids=${ids}`);
      if (res.ok) {
        const data = await res.json();
        setOffers(data);
      } else {
        router.push("/offers");
      }
      setLoading(false);
    }

    fetchComparison();
  }, [searchParams, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading comparison...</div>
      </div>
    );
  }

  if (offers.length < 2) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Need at least 2 offers to compare.</p>
        <Button className="mt-4" onClick={() => router.push("/offers")}>
          Back to Offers
        </Button>
      </div>
    );
  }

  const maxTotalComp = Math.max(...offers.map((o) => o.calculated.totalComp));
  const maxBase = Math.max(...offers.map((o) => o.baseSalary || 0));
  const maxPto = Math.max(...offers.map((o) => o.pto || 0));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/offers")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">Compare Offers</h1>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${offers.length}, 1fr)` }}>
        {offers.map((offer, index) => (
          <Card
            key={offer.id}
            className={index === 0 ? "ring-2 ring-green-500" : ""}
          >
            <CardHeader className="pb-2">
              {index === 0 && (
                <Badge className="w-fit mb-2 bg-green-600">
                  <Crown className="mr-1 h-3 w-3" />
                  Best Total Comp
                </Badge>
              )}
              <CardTitle className="text-lg">{offer.application.job.title}</CardTitle>
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                {offer.application.job.company}
              </p>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4">
                <p className="text-xs text-gray-500">Total Compensation</p>
                <p className="text-3xl font-bold text-green-600">
                  {formatCurrency(offer.calculated.totalComp)}
                </p>
                <p className="text-xs text-gray-400">
                  Cash: {formatCurrency(offer.calculated.cashComp)}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detailed Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Detailed Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Category</th>
                  {offers.map((offer) => (
                    <th key={offer.id} className="text-right py-3 px-4 font-medium">
                      {offer.application.job.company}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                <ComparisonRow
                  label="Base Salary"
                  icon={<DollarSign className="h-4 w-4" />}
                  values={offers.map((o) => o.baseSalary)}
                  maxValue={maxBase}
                  format={(v) => formatCurrency(v as number | null)}
                />
                <ComparisonRow
                  label="Bonus"
                  values={offers.map((o) => o.bonus)}
                  format={(v) => formatCurrency(v as number | null)}
                  subtext={offers.map((o) => o.bonusType || "")}
                />
                <ComparisonRow
                  label="Equity/Year"
                  values={offers.map((o) => o.calculated.equityPerYear)}
                  format={(v) => formatCurrency(v as number | null)}
                  subtext={offers.map((o) => o.equity || "")}
                />
                <ComparisonRow
                  label="Benefits Value"
                  values={offers.map((o) => o.benefitsValue)}
                  format={(v) => formatCurrency(v as number | null)}
                />
                <ComparisonRow
                  label="Total Compensation"
                  icon={<TrendingUp className="h-4 w-4 text-green-600" />}
                  values={offers.map((o) => o.calculated.totalComp)}
                  maxValue={maxTotalComp}
                  format={(v) => formatCurrency(v as number | null)}
                  highlight
                />
                <ComparisonRow
                  label="PTO (days)"
                  icon={<Calendar className="h-4 w-4" />}
                  values={offers.map((o) => o.pto)}
                  maxValue={maxPto}
                  format={(v) => v?.toString() || "—"}
                />
                <ComparisonRow
                  label="Remote Policy"
                  values={offers.map((o) => o.remotePolicy)}
                  format={(v) => v || "—"}
                />
                <ComparisonRow
                  label="Location"
                  icon={<MapPin className="h-4 w-4" />}
                  values={offers.map((o) => o.location || o.application.job.location)}
                  format={(v) => v || "—"}
                />
                <ComparisonRow
                  label="Status"
                  values={offers.map((o) => o.status)}
                  format={(v) => (
                    <Badge variant="outline" className="capitalize">
                      {v}
                    </Badge>
                  )}
                />
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Benefits Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Benefits Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${offers.length}, 1fr)` }}>
            {offers.map((offer) => (
              <div key={offer.id} className="space-y-2">
                <p className="font-medium text-sm">{offer.application.job.company}</p>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">
                  {offer.benefits || "No benefits details provided"}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ComparisonRow({
  label,
  icon,
  values,
  maxValue,
  format,
  subtext,
  highlight,
}: {
  label: string;
  icon?: React.ReactNode;
  values: (number | string | null | undefined)[];
  maxValue?: number;
  format: (v: number | string | null | undefined) => React.ReactNode;
  subtext?: string[];
  highlight?: boolean;
}) {
  return (
    <tr className={highlight ? "bg-green-50" : ""}>
      <td className="py-3 px-4 font-medium text-gray-700">
        <div className="flex items-center gap-2">
          {icon}
          {label}
        </div>
      </td>
      {values.map((value, index) => {
        const isMax = maxValue !== undefined && typeof value === "number" && value === maxValue && value > 0;
        return (
          <td key={index} className="py-3 px-4 text-right">
            <div className={`${highlight ? "font-bold text-green-600" : ""} ${isMax ? "text-green-600 font-semibold" : ""}`}>
              {format(value)}
            </div>
            {subtext && subtext[index] && (
              <div className="text-xs text-gray-400">{subtext[index]}</div>
            )}
          </td>
        );
      })}
    </tr>
  );
}

export default function OfferComparePage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-gray-500">Loading...</div>}>
      <CompareContent />
    </Suspense>
  );
}
