import { NextResponse } from "next/server"

export async function POST() {
  return NextResponse.json(
    { error: "This feature has been removed. Use the Ember/Lens/Scout agents instead." },
    { status: 410 }
  )
}
