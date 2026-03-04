// ============================================
// PeterAi - Baileys WhatsApp Socket Manager
// ============================================
// Singleton manager for @whiskeysockets/baileys WebSocket connection.
// Supports QR code and pairing code (phone number) connection methods.
// NOTE: Requires persistent Node.js process - will NOT work on Vercel serverless.
//
// All imports of @whiskeysockets/baileys are done lazily via dynamic import()
// so this module can be safely imported from server code without crashing
// at module-evaluation time in environments where native modules are absent.

import type { WASocket } from "@whiskeysockets/baileys"

// ---- Singleton State ----

let sock: WASocket | null = null
let connectionState: {
  connected: boolean
  phone: string
  qr: string | null
  pairingCode: string | null
  status: "disconnected" | "connecting" | "connected" | "error"
} = {
  connected: false,
  phone: "",
  qr: null,
  pairingCode: null,
  status: "disconnected",
}

// Store raw WAMessage for media download and reactions later
const messageStore = new Map<string, unknown>()

// ---- Lazy loader ----

async function loadBaileys() {
  const mod = await import("@whiskeysockets/baileys")
  return mod
}

// ---- Public API ----

export function getSocket(): WASocket | null {
  return sock
}

export function getConnectionState() {
  return { ...connectionState }
}

/**
 * Start a new Baileys socket connection.
 * @param mode - 'qr' for QR code scan, 'phone' for pairing code
 * @param phoneNumber - Required when mode is 'phone'. Format: country code + number (e.g. "255712345678")
 * @returns For 'qr' mode: resolves with QR string. For 'phone' mode: resolves with 8-digit pairing code.
 */
export async function startSocket(
  mode: "qr" | "phone",
  phoneNumber?: string
): Promise<{ qr?: string; pairingCode?: string }> {
  // If already connected, return current state
  if (sock && connectionState.connected) {
    return {}
  }

  // Close existing socket if any
  if (sock) {
    try {
      sock.end(undefined)
    } catch {
      // ignore
    }
    sock = null
  }

  // Reset state
  connectionState = {
    connected: false,
    phone: phoneNumber || "",
    qr: null,
    pairingCode: null,
    status: "connecting",
  }

  // Dynamic imports - these will only load when startSocket is actually called
  const baileys = await loadBaileys()
  const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, makeCacheableSignalKeyStore } = baileys
  const { Boom } = await import("@hapi/boom")
  const pino = (await import("pino")).default
  const path = await import("path")
  const { saveSettings } = await import("./storage")

  const AUTH_DIR = path.join(process.cwd(), "data", "baileys_auth")
  const logger = pino({ level: "silent" })

  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR)
  const { version } = await fetchLatestBaileysVersion()

  sock = makeWASocket({
    version,
    logger,
    printQRInTerminal: false,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger),
    },
    browser: ["PeterAi", "Chrome", "1.0.0"],
    generateHighQualityLinkPreview: true,
  })

  // ---- Credentials Update ----
  sock.ev.on("creds.update", saveCreds)

  // ---- Connection Update ----
  const result = await new Promise<{ qr?: string; pairingCode?: string }>(
    (resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Connection timeout - no QR or pairing code received within 30s"))
      }, 30000)

      sock!.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect, qr } = update

        // QR code received
        if (qr && mode === "qr") {
          connectionState.qr = qr
          connectionState.status = "connecting"
          clearTimeout(timeout)
          resolve({ qr })
        }

        // Connection opened
        if (connection === "open") {
          clearTimeout(timeout)
          const me = sock?.user
          connectionState.connected = true
          connectionState.phone = me?.id?.split(":")[0] || phoneNumber || ""
          connectionState.qr = null
          connectionState.pairingCode = null
          connectionState.status = "connected"

          // Persist to settings
          await saveSettings({
            baileysConnected: true,
            baileysPhone: connectionState.phone,
          })

          console.log("[PeterAi] WhatsApp connected as:", connectionState.phone)
        }

        // Connection closed
        if (connection === "close") {
          const statusCode = (lastDisconnect?.error as InstanceType<typeof Boom>)?.output?.statusCode
          const shouldReconnect = statusCode !== DisconnectReason.loggedOut

          console.log(
            "[PeterAi] Connection closed. Status:",
            statusCode,
            "Reconnect:",
            shouldReconnect
          )

          connectionState.connected = false
          connectionState.status = "disconnected"

          if (shouldReconnect) {
            // Auto-reconnect after a short delay
            setTimeout(() => {
              console.log("[PeterAi] Attempting auto-reconnect...")
              startSocket(mode, phoneNumber).catch(console.error)
            }, 3000)
          } else {
            // Logged out - clean up
            connectionState.phone = ""
            await saveSettings({
              baileysConnected: false,
              baileysPhone: "",
            })
            sock = null
          }
        }
      })

      // For phone/pairing code mode, request the code after socket initializes
      if (mode === "phone" && phoneNumber) {
        // Wait a moment for the socket to be ready, then request pairing code
        setTimeout(async () => {
          try {
            if (!sock) {
              clearTimeout(timeout)
              reject(new Error("Socket not initialized"))
              return
            }
            // Format phone: remove + and any non-digits
            const cleanPhone = phoneNumber.replace(/[^0-9]/g, "")
            const code = await sock.requestPairingCode(cleanPhone)
            connectionState.pairingCode = code
            connectionState.status = "connecting"
            clearTimeout(timeout)
            resolve({ pairingCode: code })
          } catch (err) {
            clearTimeout(timeout)
            reject(err)
          }
        }, 3000)
      }
    }
  )

  // ---- Messages Listener ----
  setupMessageListener()

  return result
}

/**
 * Disconnect and logout the current session.
 */
export async function disconnectSocket(): Promise<boolean> {
  try {
    if (sock) {
      await sock.logout()
      sock.end(undefined)
      sock = null
    }
    connectionState = {
      connected: false,
      phone: "",
      qr: null,
      pairingCode: null,
      status: "disconnected",
    }

    const { saveSettings } = await import("./storage")
    await saveSettings({
      baileysConnected: false,
      baileysPhone: "",
    })

    // Clean up auth files
    const fs = await import("fs/promises")
    const path = await import("path")
    const AUTH_DIR = path.join(process.cwd(), "data", "baileys_auth")
    try {
      await fs.rm(AUTH_DIR, { recursive: true, force: true })
    } catch {
      // ignore
    }

    return true
  } catch (err) {
    console.error("[PeterAi] Disconnect error:", err)
    return false
  }
}

// ---- Private: Message Listener ----

function setupMessageListener() {
  if (!sock) return

  sock.ev.on("messages.upsert", async (m) => {
    if (m.type !== "notify") return

    // Lazy import handleIncomingMessage only when messages actually arrive
    const { handleIncomingMessage } = await import("./bot-handler")

    for (const msg of m.messages) {
      try {
        // Store raw message for reactions and media download
        storeMessage(msg)

        // Skip status broadcasts
        if (msg.key.remoteJid === "status@broadcast") continue

        // Convert Baileys WAMessage to our internal WhapiMessage format
        const converted = convertBaileysMessage(msg)
        if (!converted) continue

        await handleIncomingMessage(converted)
      } catch (err) {
        console.error("[PeterAi] Error handling message:", err)
      }
    }
  })
}

// ---- Message Converter ----

import type { WhapiMessage } from "./types"

/**
 * Convert Baileys WAMessage to the app's internal WhapiMessage format.
 * This lets bot-handler.ts and all command files work without changes.
 */
function convertBaileysMessage(msg: { key: { remoteJid?: string | null; fromMe?: boolean | null; id?: string | null; participant?: string | null }; message?: Record<string, unknown> | null; pushName?: string | null; messageTimestamp?: number | Long | null }): WhapiMessage | null {
  const key = msg.key
  const messageContent = msg.message

  if (!key.remoteJid || !messageContent) return null

  const chatId = key.remoteJid
  const fromMe = key.fromMe || false
  const from = fromMe
    ? (sock?.user?.id || "")
    : (key.participant || key.remoteJid)

  // Extract text
  const textBody =
    (messageContent as Record<string, unknown>).conversation as string ||
    ((messageContent as Record<string, Record<string, unknown>>).extendedTextMessage as Record<string, unknown>)?.text as string ||
    ""

  // Extract context (quoted message)
  const extendedText = (messageContent as Record<string, Record<string, unknown>>).extendedTextMessage as Record<string, unknown> | undefined
  const contextInfo = extendedText?.contextInfo as Record<string, unknown> | undefined
  const context = contextInfo
    ? {
        id: (contextInfo.stanzaId as string) || "",
        from: (contextInfo.participant as string) || "",
        body: ((contextInfo.quotedMessage as Record<string, unknown>)?.conversation as string) || "",
      }
    : undefined

  // Extract media
  const imageMsg = (messageContent as Record<string, Record<string, unknown>>).imageMessage as Record<string, unknown> | undefined
  const videoMsg = (messageContent as Record<string, Record<string, unknown>>).videoMessage as Record<string, unknown> | undefined
  const audioMsg = (messageContent as Record<string, Record<string, unknown>>).audioMessage as Record<string, unknown> | undefined
  const docMsg = (messageContent as Record<string, Record<string, unknown>>).documentMessage as Record<string, unknown> | undefined

  const converted: WhapiMessage = {
    id: key.id || "",
    type: imageMsg ? "image" : videoMsg ? "video" : audioMsg ? "audio" : docMsg ? "document" : "text",
    subtype: "",
    chat_id: chatId,
    from,
    from_name: (msg.pushName as string) || "",
    to: chatId,
    timestamp: msg.messageTimestamp
      ? typeof msg.messageTimestamp === "number"
        ? msg.messageTimestamp
        : Number(msg.messageTimestamp)
      : Math.floor(Date.now() / 1000),
    text: textBody ? { body: textBody } : undefined,
    image: imageMsg
      ? {
          id: key.id || "",
          mime_type: (imageMsg.mimetype as string) || "image/jpeg",
          caption: (imageMsg.caption as string) || undefined,
        }
      : undefined,
    video: videoMsg
      ? {
          id: key.id || "",
          mime_type: (videoMsg.mimetype as string) || "video/mp4",
          caption: (videoMsg.caption as string) || undefined,
        }
      : undefined,
    audio: audioMsg
      ? {
          id: key.id || "",
          mime_type: (audioMsg.mimetype as string) || "audio/ogg",
        }
      : undefined,
    document: docMsg
      ? {
          id: key.id || "",
          mime_type: (docMsg.mimetype as string) || "application/octet-stream",
          filename: (docMsg.fileName as string) || undefined,
        }
      : undefined,
    context,
    from_me: fromMe,
    source: "baileys",
  }

  return converted
}

// ---- Message Store ----

export function storeMessage(msg: unknown) {
  const m = msg as { key?: { id?: string } }
  if (m.key?.id) {
    messageStore.set(m.key.id, msg)
    // Keep only last 1000 messages
    if (messageStore.size > 1000) {
      const firstKey = messageStore.keys().next().value
      if (firstKey) messageStore.delete(firstKey as string)
    }
  }
}

export function getStoredMessage(id: string) {
  return messageStore.get(id)
}
