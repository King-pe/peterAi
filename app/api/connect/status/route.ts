import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { getConnectionInfo } from "@/lib/baileys"

export async function GET() {
  try {
    await requireAdmin()
    const info = getConnectionInfo()
    return NextResponse.json({
      connected: info.connected,
      phone: info.phone,
      status: info.status,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error"
    if (message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
