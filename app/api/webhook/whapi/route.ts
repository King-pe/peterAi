import { NextResponse } from "next/server"
import { getConnectionInfo, startSocket, setMessageHandler, extractPhone } from "@/lib/baileys"
import { handleIncomingMessage } from "@/lib/bot-handler"
import type { BaileysMessage } from "@/lib/types"
import { saveSettings } from "@/lib/storage"

// Initialize the WhatsApp socket and bind message handler
let initialized = false

async function ensureInitialized() {
  if (initialized) return

  setMessageHandler(async ({ messages, type }) => {
    if (type !== "notify") return

    for (const msg of messages) {
      try {
        const chatId = msg.key.remoteJid || ""
        const fromMe = msg.key.fromMe || false
        const msgContent = msg.message

        if (!msgContent) continue

        // Extract text from various message types
        let text = ""
        if (msgContent.conversation) {
          text = msgContent.conversation
        } else if (msgContent.extendedTextMessage?.text) {
          text = msgContent.extendedTextMessage.text
        } else if (msgContent.imageMessage?.caption) {
          text = msgContent.imageMessage.caption
        } else if (msgContent.videoMessage?.caption) {
          text = msgContent.videoMessage.caption
        }

        const pushName = msg.pushName || ""

        const baileysMessage: BaileysMessage = {
          id: msg.key.id || "",
          chatId,
          from: chatId,
          fromName: pushName,
          fromMe,
          text: text || undefined,
          image: msgContent.imageMessage ? { caption: msgContent.imageMessage.caption || undefined } : undefined,
          video: msgContent.videoMessage ? { caption: msgContent.videoMessage.caption || undefined } : undefined,
          audio: msgContent.audioMessage ? {} : undefined,
          document: msgContent.documentMessage
            ? { filename: msgContent.documentMessage.fileName || undefined }
            : undefined,
          quotedMessage: msgContent.extendedTextMessage?.contextInfo?.stanzaId
            ? {
                id: msgContent.extendedTextMessage.contextInfo.stanzaId,
                text: msgContent.extendedTextMessage.contextInfo?.quotedMessage?.conversation || undefined,
              }
            : undefined,
          timestamp: typeof msg.messageTimestamp === "number" ? msg.messageTimestamp : Date.now() / 1000,
        }

        handleIncomingMessage(baileysMessage).catch((err) => {
          console.error("Message handler error:", err)
        })
      } catch (err) {
        console.error("Baileys message processing error:", err)
      }
    }
  })

  // Start socket if not connected
  const info = getConnectionInfo()
  if (!info.connected && !info.connecting) {
    try {
      await startSocket()

      // Update settings when connected
      const checkConnection = setInterval(async () => {
        const currentInfo = getConnectionInfo()
        if (currentInfo.connected) {
          await saveSettings({
            whatsappConnected: true,
            whatsappPhone: currentInfo.phone || "",
            botPhoneNumber: currentInfo.phone || "",
          })
          clearInterval(checkConnection)
        }
      }, 3000)

      // Timeout after 30 seconds
      setTimeout(() => clearInterval(checkConnection), 30000)
    } catch (err) {
      console.error("Failed to start socket:", err)
    }
  }

  initialized = true
}

// This route can be called to check/initialize the bot
export async function GET() {
  await ensureInitialized()
  const info = getConnectionInfo()
  return NextResponse.json({
    status: "ok",
    service: "PeterAi WhatsApp Bot (Baileys)",
    connected: info.connected,
    phone: info.phone,
  })
}

export async function POST() {
  await ensureInitialized()
  return NextResponse.json({ status: "ok" })
}
