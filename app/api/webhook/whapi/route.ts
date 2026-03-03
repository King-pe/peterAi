import { NextResponse } from "next/server"
import type { WhapiWebhookPayload } from "@/lib/types"
import { handleIncomingMessage } from "@/lib/bot-handler"

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as WhapiWebhookPayload

    if (payload.messages && payload.messages.length > 0) {
      // Process messages in background (don't await all of them to avoid timeout)
      for (const message of payload.messages) {
        // Fire and forget - process each message
        handleIncomingMessage(message).catch((err) => {
          console.error("Webhook message handler error:", err)
        })
      }
    }

    // Always respond 200 quickly to Whapi
    return NextResponse.json({ status: "ok" })
  } catch (err) {
    console.error("Webhook error:", err)
    return NextResponse.json({ status: "error" }, { status: 200 })
  }
}

// Whapi may send GET to verify webhook
export async function GET() {
  return NextResponse.json({ status: "ok", service: "PeterAi WhatsApp Bot" })
}
