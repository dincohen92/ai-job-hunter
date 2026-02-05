import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { sendEmail } from "@/lib/email";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { emailId } = await req.json();
  if (!emailId) {
    return NextResponse.json({ error: "emailId is required" }, { status: 400 });
  }

  const email = await prisma.email.findFirst({
    where: { id: emailId, userId: user.id },
  });

  if (!email) return NextResponse.json({ error: "Email not found" }, { status: 404 });

  const result = await sendEmail({
    userId: user.id,
    to: email.recipientEmail,
    subject: email.subject,
    html: email.body,
  });

  if (result.success) {
    await prisma.email.update({
      where: { id: emailId },
      data: { status: "sent", sentAt: new Date() },
    });
    return NextResponse.json({ success: true, messageId: result.messageId });
  } else {
    await prisma.email.update({
      where: { id: emailId },
      data: { status: "failed", errorMessage: result.error },
    });
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
}
