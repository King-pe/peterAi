import { NextResponse } from "next/server"
import { startSocket, getConnectionState } from "@/lib/baileys"
import { requireAdmin } from "@/lib/auth"
import QRCode from "qrcode"

export async function GET() {
  try {
    await requireAdmin()

    // Check if already connected
    const state = getConnectionState()
    if (state.connected) {
      return NextResponse.json({ status: "already_connected", phone: state.phone })
    }

    // Start socket in QR mode
    const result = await startSocket("qr")

    if (result.qr) {
      // Convert QR string to base64 PNG image
      const qrBase64 = await QRCode.toDataURL(result.qr, {
        width: 512,
        margin: 2,
        color: { dark: "#000000", light: "#ffffff" },
      })
      // Remove the data:image/png;base64, prefix - frontend adds it back
      const base64Data = qrBase64.replace(/^data:image\/png;base64,/, "")
      return NextResponse.json({ qr: base64Data })
    }

    return NextResponse.json({ error: "No QR code generated" }, { status: 500 })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error"
    if (message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("[PeterAi] QR route error:", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
