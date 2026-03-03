import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { requestPairingCode, getConnectionInfo } from "@/lib/baileys"

export async function POST(request: Request) {
  try {
    await requireAdmin()

    const { phone } = await request.json()
    if (!phone) {
      return NextResponse.json({ error: "Phone number required" }, { status: 400 })
    }

    const info = getConnectionInfo()
    if (info.connected) {
      return NextResponse.json({ connected: true, phone: info.phone })
    }

    // Clean phone number (remove + and non-digits)
    const cleanPhone = phone.replace(/[^0-9]/g, "")

    // Request pairing code via Baileys
    const code = await requestPairingCode(cleanPhone)

    if (code) {
      return NextResponse.json({ code })
    }

    // Check if it connected while we were waiting
    const currentInfo = getConnectionInfo()
    if (currentInfo.connected) {
      return NextResponse.json({ connected: true, phone: currentInfo.phone })
    }

    return NextResponse.json({ error: "Failed to generate pairing code. Try again." })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error"
    if (message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
