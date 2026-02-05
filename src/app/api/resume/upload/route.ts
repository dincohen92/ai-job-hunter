import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const name = (formData.get("name") as string) || "My Resume";

  if (!file) {
    return NextResponse.json({ error: "File is required" }, { status: 400 });
  }

  let rawText: string;

  if (file.name.endsWith(".txt") || file.name.endsWith(".md")) {
    rawText = await file.text();
  } else if (file.name.endsWith(".pdf")) {
    // PDF parsing: read file buffer and extract text
    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      const { extractText } = await import("unpdf");
      const { text } = await extractText(new Uint8Array(buffer));
      rawText = Array.isArray(text) ? text.join("\n\n") : text;
    } catch (err) {
      console.error("PDF parse error:", err);
      return NextResponse.json(
        { error: "Failed to parse PDF file" },
        { status: 400 }
      );
    }
  } else {
    return NextResponse.json(
      { error: "Supported formats: .txt, .md, .pdf" },
      { status: 400 }
    );
  }

  if (!rawText.trim()) {
    return NextResponse.json(
      { error: "Could not extract text from file" },
      { status: 400 }
    );
  }

  const resume = await prisma.resume.create({
    data: {
      userId: user.id,
      name,
      fileName: file.name,
      rawText,
    },
  });

  return NextResponse.json(resume);
}
