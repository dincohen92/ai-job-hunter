import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const idsParam = searchParams.get("ids");

  if (!idsParam) {
    return NextResponse.json({ error: "Offer IDs required" }, { status: 400 });
  }

  const ids = idsParam.split(",").filter(Boolean);

  if (ids.length < 2) {
    return NextResponse.json({ error: "At least 2 offers required for comparison" }, { status: 400 });
  }

  const offers = await prisma.offer.findMany({
    where: {
      id: { in: ids },
      application: {
        userId: session.user.id,
      },
    },
    include: {
      application: {
        include: {
          job: {
            select: {
              id: true,
              title: true,
              company: true,
              location: true,
            },
          },
        },
      },
    },
  });

  // Calculate total compensation for each offer
  const offersWithTotalComp = offers.map((offer) => {
    const base = offer.baseSalary || 0;
    const bonus = offer.bonus || 0;
    const equityPerYear = offer.equityValue && offer.vestingYears
      ? Math.round(offer.equityValue / offer.vestingYears)
      : 0;
    const benefits = offer.benefitsValue || 0;

    const totalComp = base + bonus + equityPerYear + benefits;
    const cashComp = base + bonus;

    return {
      ...offer,
      calculated: {
        totalComp,
        cashComp,
        equityPerYear,
      },
    };
  });

  // Sort by total comp descending
  offersWithTotalComp.sort((a, b) => b.calculated.totalComp - a.calculated.totalComp);

  return NextResponse.json(offersWithTotalComp);
}
