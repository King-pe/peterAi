import { NextResponse } from "next/server"
import { disconnectWhatsApp } from "@/lib/whapi"
import { requireAdmin } from "@/lib/auth"

export async function POST() {
  try {
    await requireAdmin()
    const success = await disconnectWhatsApp()
    if (!success) {
      return NextResponse.json({ error: "Failed to disconnect" }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error"
    if (message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
