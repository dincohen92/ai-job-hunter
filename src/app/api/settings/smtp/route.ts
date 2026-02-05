import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const config = await prisma.smtpConfig.findUnique({
    where: { userId: user.id },
  });

  if (!config) return NextResponse.json(null);

  return NextResponse.json({
    ...config,
    password: "••••••••", // mask password
  });
}

export async function PUT(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  const config = await prisma.smtpConfig.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      host: body.host,
      port: body.port || 587,
      secure: body.secure || false,
      username: body.username,
      password: body.password,
      fromName: body.fromName || null,
    },
    update: {
      host: body.host,
      port: body.port || 587,
      secure: body.secure || false,
      username: body.username,
      ...(body.password !== "••••••••" ? { password: body.password } : {}),
      fromName: body.fromName || null,
    },
  });

  return NextResponse.json({ ...config, password: "••••••••" });
}
