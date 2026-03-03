import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { disconnectWhatsApp } from "@/lib/baileys"
import { saveSettings } from "@/lib/storage"

export async function POST() {
  try {
    await requireAdmin()
    const success = await disconnectWhatsApp()

    if (success) {
      // Update settings to reflect disconnected state
      await saveSettings({
        whatsappConnected: false,
        whatsappPhone: "",
      })
    }

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
