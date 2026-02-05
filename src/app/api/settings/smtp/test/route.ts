import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { testSmtpConnection } from "@/lib/email";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  const result = await testSmtpConnection({
    host: body.host,
    port: body.port || 587,
    secure: body.secure || false,
    username: body.username,
    password: body.password,
  });

  return NextResponse.json(result);
}
