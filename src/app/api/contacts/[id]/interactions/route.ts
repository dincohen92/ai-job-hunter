import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: contactId } = await params;

  // Verify contact belongs to user
  const contact = await prisma.contact.findFirst({
    where: { id: contactId, userId: user.id },
  });

  if (!contact) {
    return NextResponse.json({ error: "Contact not found" }, { status: 404 });
  }

  const interactions = await prisma.contactInteraction.findMany({
    where: { contactId },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(interactions);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: contactId } = await params;
  const body = await req.json();
  const { type, date, notes, nextAction } = body;

  // Verify contact belongs to user
  const contact = await prisma.contact.findFirst({
    where: { id: contactId, userId: user.id },
  });

  if (!contact) {
    return NextResponse.json({ error: "Contact not found" }, { status: 404 });
  }

  if (!type || !date) {
    return NextResponse.json(
      { error: "Type and date are required" },
      { status: 400 }
    );
  }

  const interaction = await prisma.contactInteraction.create({
    data: {
      contactId,
      type,
      date: new Date(date),
      notes: notes || null,
      nextAction: nextAction || null,
    },
  });

  // Update contact's updatedAt
  await prisma.contact.update({
    where: { id: contactId },
    data: { updatedAt: new Date() },
  });

  return NextResponse.json(interaction);
}
