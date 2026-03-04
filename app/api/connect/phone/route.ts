import { NextResponse } from "next/server"
import { startSocket, getConnectionState } from "@/lib/baileys"
import { requireAdmin } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    await requireAdmin()

    const { phone } = await request.json()
    if (!phone) {
      return NextResponse.json({ error: "Phone number required" }, { status: 400 })
    }

    // Check if already connected
    const state = getConnectionState()
    if (state.connected) {
      return NextResponse.json({ status: "already_connected", phone: state.phone })
    }

    // Clean the phone number - remove + and spaces
    const cleanPhone = phone.replace(/[^0-9]/g, "")
    if (cleanPhone.length < 10) {
      return NextResponse.json({ error: "Invalid phone number" }, { status: 400 })
    }

    // Start socket in phone/pairing code mode
    const result = await startSocket("phone", cleanPhone)

    if (result.pairingCode) {
      // Format the code as XXXX-XXXX for display
      const code = result.pairingCode
      const formatted = code.length === 8
        ? `${code.slice(0, 4)}-${code.slice(4)}`
        : code
      return NextResponse.json({ code: formatted })
    }

    return NextResponse.json({ error: "Failed to generate pairing code" }, { status: 500 })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error"
    if (message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("[PeterAi] Phone route error:", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
