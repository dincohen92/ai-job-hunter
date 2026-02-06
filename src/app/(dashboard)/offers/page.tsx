"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DollarSign,
  Building2,
  MapPin,
  Calendar,
  TrendingUp,
  Scale,
  Clock,
} from "lucide-react";
import Link from "next/link";

interface Offer {
  id: string;
  baseSalary: number | null;
  bonus: number | null;
  bonusType: string | null;
  equityValue: number | null;
  vestingYears: number | null;
  benefitsValue: number | null;
  pto: number | null;
  remotePolicy: string | null;
  status: string;
  expirationDate: string | null;
  createdAt: string;
  application: {
    job: {
      id: string;
      title: string;
      company: string;
      location: string | null;
    };
  };
}

const STATUS_COLORS: Record<string, string> = {
  pending: "border-yellow-200 bg-yellow-50 text-yellow-700",
  negotiating: "border-blue-200 bg-blue-50 text-blue-700",
  accepted: "border-green-200 bg-green-50 text-green-700",
  declined: "border-red-200 bg-red-50 text-red-700",
  expired: "border-gray-200 bg-gray-50 text-gray-700",
};

function formatCurrency(amount: number | null): string {
  if (amount === null || amount === undefined) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

function calculateTotalComp(offer: Offer): number {
  const base = offer.baseSalary || 0;
  const bonus = offer.bonus || 0;
  const equityPerYear = offer.equityValue && offer.vestingYears
    ? Math.round(offer.equityValue / offer.vestingYears)
    : 0;
  const benefits = offer.benefitsValue || 0;
  return base + bonus + equityPerYear + benefits;
}

export default function OffersPage() {
  const router = useRouter();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOffers, setSelectedOffers] = useState<Set<string>>(new Set());

  const fetchOffers = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/offers");
    if (res.ok) {
      const data = await res.json();
      setOffers(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchOffers();
  }, [fetchOffers]);

  function toggleSelection(offerId: string) {
    setSelectedOffers((prev) => {
      const next = new Set(Array.from(prev));
      if (next.has(offerId)) {
        next.delete(offerId);
      } else {
        next.add(offerId);
      }
      return next;
    });
  }

  function handleCompare() {
    if (selectedOffers.size < 2) return;
    const ids = Array.from(selectedOffers).join(",");
    router.push(`/offers/compare?ids=${ids}`);
  }

  const pendingOffers = offers.filter((o) => o.status === "pending" || o.status === "negotiating");
  const activeOffers = offers.filter((o) => o.status === "accepted");
  const pastOffers = offers.filter((o) => o.status === "declined" || o.status === "expired");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Offers</h1>
        {selectedOffers.size >= 2 && (
          <Button onClick={handleCompare}>
            <Scale className="mr-2 h-4 w-4" />
            Compare ({selectedOffers.size})
          </Button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading offers...</div>
      ) : offers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <DollarSign className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-4 text-lg font-medium">No offers yet</h3>
            <p className="mt-2 text-sm text-gray-500">
              When you receive a job offer, you can track it here to compare compensation packages.
            </p>
            <p className="mt-4 text-sm text-gray-400">
              Add an offer from a job&apos;s application page when you receive one.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {pendingOffers.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-600" />
                Active Offers ({pendingOffers.length})
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {pendingOffers.map((offer) => (
                  <OfferCard
                    key={offer.id}
                    offer={offer}
                    selected={selectedOffers.has(offer.id)}
                    onToggle={() => toggleSelection(offer.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {activeOffers.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Accepted ({activeOffers.length})
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {activeOffers.map((offer) => (
                  <OfferCard
                    key={offer.id}
                    offer={offer}
                    selected={selectedOffers.has(offer.id)}
                    onToggle={() => toggleSelection(offer.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {pastOffers.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4 text-gray-500">
                Past Offers ({pastOffers.length})
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {pastOffers.map((offer) => (
                  <OfferCard
                    key={offer.id}
                    offer={offer}
                    selected={selectedOffers.has(offer.id)}
                    onToggle={() => toggleSelection(offer.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function OfferCard({
  offer,
  selected,
  onToggle,
}: {
  offer: Offer;
  selected: boolean;
  onToggle: () => void;
}) {
  const totalComp = calculateTotalComp(offer);
  const isExpiringSoon = offer.expirationDate &&
    new Date(offer.expirationDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  return (
    <Card className={`transition-colors ${selected ? "ring-2 ring-blue-500" : ""}`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <Checkbox
              checked={selected}
              onCheckedChange={onToggle}
              className="mt-1"
            />
            <div>
              <Link href={`/offers/${offer.id}`}>
                <CardTitle className="text-lg hover:text-blue-600">
                  {offer.application.job.title}
                </CardTitle>
              </Link>
              <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                <Building2 className="h-3 w-3" />
                {offer.application.job.company}
              </p>
            </div>
          </div>
          <Badge variant="outline" className={STATUS_COLORS[offer.status] || ""}>
            {offer.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500">Base Salary</p>
            <p className="text-lg font-semibold">{formatCurrency(offer.baseSalary)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Total Comp</p>
            <p className="text-lg font-semibold text-green-600">{formatCurrency(totalComp)}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 text-sm text-gray-500">
          {offer.application.job.location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {offer.application.job.location}
            </span>
          )}
          {offer.remotePolicy && (
            <Badge variant="secondary" className="text-xs">
              {offer.remotePolicy}
            </Badge>
          )}
          {offer.pto && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {offer.pto} days PTO
            </span>
          )}
        </div>

        {isExpiringSoon && offer.expirationDate && (
          <p className="text-xs text-red-600 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Expires {new Date(offer.expirationDate).toLocaleDateString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
