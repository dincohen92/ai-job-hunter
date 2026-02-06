import { NextResponse } from "next/server";
import { getAllProviders } from "@/lib/job-providers";

export async function GET() {
  const providers = getAllProviders();

  return NextResponse.json({
    sources: providers,
    configured: providers.filter((p) => p.configured).map((p) => p.name),
  });
}
