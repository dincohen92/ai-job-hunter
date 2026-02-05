import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const emails = await prisma.email.findMany({
    where: { userId: user.id },
    include: { job: { select: { title: true, company: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(emails);
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  const email = await prisma.email.create({
    data: {
      userId: user.id,
      jobId: body.jobId || null,
      recipientEmail: body.recipientEmail,
      recipientName: body.recipientName || null,
      subject: body.subject,
      body: body.body,
      status: "draft",
    },
  });

  return NextResponse.json(email);
}
