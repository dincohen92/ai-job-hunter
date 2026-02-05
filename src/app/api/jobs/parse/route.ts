import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { callClaude } from "@/lib/claude";
import { buildJobParsingPrompt } from "@/lib/prompts";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { text } = await req.json();
  if (!text) {
    return NextResponse.json(
      { error: "Job description text is required" },
      { status: 400 }
    );
  }

  try {
    const prompt = buildJobParsingPrompt(text);
    const result = await callClaude(prompt.system, prompt.user);
    const parsed = JSON.parse(result.text);
    return NextResponse.json(parsed);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to parse job description" },
      { status: 500 }
    );
  }
}
