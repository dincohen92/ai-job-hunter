import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const relationshipType = searchParams.get("type");
  const search = searchParams.get("search");

  const where: Record<string, unknown> = { userId: user.id };

  if (relationshipType && relationshipType !== "all") {
    where.relationshipType = relationshipType;
  }

  if (search) {
    where.OR = [
      { name: { contains: search } },
      { company: { contains: search } },
      { email: { contains: search } },
    ];
  }

  const contacts = await prisma.contact.findMany({
    where,
    include: {
      interactions: {
        orderBy: { date: "desc" },
        take: 1,
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(contacts);
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, company, role, email, phone, linkedInUrl, relationshipType, notes, tags } = body;

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const contact = await prisma.contact.create({
    data: {
      userId: user.id,
      name,
      company: company || null,
      role: role || null,
      email: email || null,
      phone: phone || null,
      linkedInUrl: linkedInUrl || null,
      relationshipType: relationshipType || "other",
      notes: notes || null,
      tags: tags ? JSON.stringify(tags) : null,
    },
  });

  return NextResponse.json(contact);
}
