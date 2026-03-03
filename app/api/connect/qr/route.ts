import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { startQrMode, getQrBase64, getConnectionInfo } from "@/lib/baileys"

export async function GET() {
  try {
    await requireAdmin()

    const info = getConnectionInfo()

    // Already connected
    if (info.connected) {
      return NextResponse.json({ connected: true, phone: info.phone })
    }

    // Start QR mode if not already
    await startQrMode()

    // Get the QR as base64 image
    const qrBase64 = await getQrBase64()

    if (qrBase64) {
      return NextResponse.json({ qr: qrBase64 })
    }

    return NextResponse.json({ error: "QR code not available yet. Try again." })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error"
    if (message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
