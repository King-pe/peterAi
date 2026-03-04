import { NextResponse } from "next/server"
import { getConnectionState } from "@/lib/baileys"
import { requireAdmin } from "@/lib/auth"

export async function GET() {
  try {
    await requireAdmin()
    const state = getConnectionState()
    return NextResponse.json({
      connected: state.connected,
      phone: state.phone || undefined,
      status: state.status,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error"
    if (message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
