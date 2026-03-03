import { NextResponse } from "next/server"
import { getSettings, saveSettings } from "@/lib/storage"
import { requireAdmin } from "@/lib/auth"

export async function GET() {
  try {
    await requireAdmin()
    const settings = await getSettings()
    return NextResponse.json(settings)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error"
    if (message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    await requireAdmin()
    const updates = await request.json()
    // Don't allow overwriting sensitive fields from client
    // Don't allow overwriting sensitive fields from client
    const settings = await saveSettings(updates)
    return NextResponse.json(settings)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error"
    if (message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
