
// ============================================
// PeterAi - Baileys WhatsApp Socket Manager
// ============================================
// Singleton manager for @whiskeysockets/baileys WebSocket connection.
// Supports QR code and pairing code (phone number) connection methods.
// NOTE: Requires persistent Node.js process - will NOT work on Vercel serverless.
//
// ALL heavy native imports (baileys, pino, boom) are loaded LAZILY via
// dynamic import() so that merely importing this file never triggers
// the native module resolver. Pages and layouts can therefore render
// without error even in environments that cannot load these binaries.

import type {
  WASocket,
  BaileysEventMap,
  ConnectionState,
} from "@whiskeysockets/baileys"

import { handleIncomingMessage } from "./bot-handler"
import { saveSettings } from "./storage"
import type { WhapiMessage } from "./types"

// ---- Lazy loaders (called only when actually needed) ----

async function loadBaileys() {
  const mod = await import("@whiskeysockets/baileys")
  return mod
}

async function loadBoom() {
  const mod = await import("@hapi/boom")
  return mod
}

async function loadPino() {
  const mod = await import("pino")
  return mod.default || mod
}

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

  // ---- Lazy-load native deps ----
  const baileys = await loadBaileys()
  const pinoFn = await loadPino()
  const path = await import("path")

  const AUTH_DIR = path.join(process.cwd(), "data", "baileys_auth")
  const logger = pinoFn({ level: "silent" })

  const { state, saveCreds } = await baileys.useMultiFileAuthState(AUTH_DIR)
  const { version } = await baileys.fetchLatestBaileysVersion()

  sock = baileys.default({
    version,
    logger: logger as any,
    printQRInTerminal: false,
    auth: {
      creds: state.creds,
      keys: baileys.makeCacheableSignalKeyStore(state.keys, logger as any),
    },
    browser: ["PeterAi", "Chrome", "119.0.0.0"], // Specify Chrome version for security
    generateHighQualityLinkPreview: true,
  })

  // ---- Credentials Update ----
  sock.ev.on("creds.update", saveCreds)

  let qrRefreshInterval: NodeJS.Timeout | null = null;

  // ---- Connection Update ----
  const result = await new Promise<{ qr?: string; pairingCode?: string }>(
    (resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Connection timeout - no QR or pairing code received within 30s"))
      }, 30000)

      sock!.ev.on("qr", (qr: string) => {
        connectionState.qr = qr;
        connectionState.status = "connecting";
        resolve({ qr });

        // Clear any existing interval before setting a new one
        if (qrRefreshInterval) {
          clearInterval(qrRefreshInterval);
        }
        // Set up QR refresh every 15 seconds
        qrRefreshInterval = setInterval(() => {
          if (sock && connectionState.status === "connecting" && connectionState.qr) {
            // Re-emit QR to trigger frontend refresh
            sock.ev.emit("qr", connectionState.qr);
          } else {
            clearInterval(qrRefreshInterval!); // Clear if connection is no longer connecting or QR is gone
            qrRefreshInterval = null;
          }
        }, 15000);
      });

      sock!.ev.on("connection.update", async (update: Partial<ConnectionState>) => {
        const { connection, lastDisconnect } = update

        // QR code received is now handled by the dedicated 'qr' event listener.
        // This block is no longer needed for initial QR handling.
        // if (qr && mode === "qr") {
        //   connectionState.qr = qr
        //   connectionState.status = "connecting"
        //   clearTimeout(timeout)
        //   resolve({ qr })
        // }

        // Connection opened
        if (connection === "open") {
          clearTimeout(timeout);
          if (qrRefreshInterval) {
            clearInterval(qrRefreshInterval);
            qrRefreshInterval = null;
          }
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
          const boom = await loadBoom()
          const statusCode = (lastDisconnect?.error as InstanceType<typeof boom.Boom>)?.output?.statusCode
          const shouldReconnect = statusCode !== baileys.DisconnectReason.loggedOut

          console.log(
            "[PeterAi] Connection closed. Status:",
            statusCode,
            "Reconnect:",
            shouldReconnect
          )

          connectionState.connected = false
          connectionState.status = "disconnected"
          if (qrRefreshInterval) {
            clearInterval(qrRefreshInterval);
            qrRefreshInterval = null;
          }

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
      // Clear QR refresh interval if switching to phone mode
      if (qrRefreshInterval) {
        clearInterval(qrRefreshInterval);
        qrRefreshInterval = null;
      }
      if (mode === "phone" && phoneNumber) {
        setTimeout(async () => {
          try {
            if (!sock) {
              clearTimeout(timeout)
              reject(new Error("Socket not initialized"))
              return
            }
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

  sock.ev.on("messages.upsert", async (m: BaileysEventMap["messages.upsert"]) => {
    if (m.type !== "notify") return

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

function convertBaileysMessage(msg: BaileysEventMap["messages.upsert"]["messages"][0]): WhapiMessage | null {
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
    messageContent.conversation ||
    messageContent.extendedTextMessage?.text ||
    ""

  // Extract context (quoted message)
  const contextInfo = messageContent.extendedTextMessage?.contextInfo
  const context = contextInfo
    ? {
        id: contextInfo.stanzaId || "",
        from: contextInfo.participant || "",
        body: contextInfo.quotedMessage?.conversation || "",
      }
    : undefined

  // Extract media
  const imageMsg = messageContent.imageMessage
  const videoMsg = messageContent.videoMessage
  const audioMsg = messageContent.audioMessage
  const docMsg = messageContent.documentMessage

  const converted: WhapiMessage = {
    id: key.id || "",
    type: imageMsg ? "image" : videoMsg ? "video" : audioMsg ? "audio" : docMsg ? "document" : "text",
    subtype: "",
    chat_id: chatId,
    from,
    from_name: msg.pushName || "",
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
          mime_type: imageMsg.mimetype || "image/jpeg",
          caption: imageMsg.caption || undefined,
        }
      : undefined,
    video: videoMsg
      ? {
          id: key.id || "",
          mime_type: videoMsg.mimetype || "video/mp4",
          caption: videoMsg.caption || undefined,
        }
      : undefined,
    audio: audioMsg
      ? {
          id: key.id || "",
          mime_type: audioMsg.mimetype || "audio/ogg",
        }
      : undefined,
    document: docMsg
      ? {
          id: key.id || "",
          mime_type: docMsg.mimetype || "application/octet-stream",
          filename: docMsg.fileName || undefined,
        }
      : undefined,
    context,
    from_me: fromMe,
    source: "baileys",
  }

  return converted
}

// ---- Message Store (for reactions & media download) ----

const messageStore = new Map<string, BaileysEventMap["messages.upsert"]["messages"][0]>()

export function storeMessage(msg: BaileysEventMap["messages.upsert"]["messages"][0]) {
  if (msg.key.id) {
    messageStore.set(msg.key.id, msg)
    // Keep only last 1000 messages
    if (messageStore.size > 1000) {
      const firstKey = messageStore.keys().next().value
      if (firstKey) messageStore.delete(firstKey)
    }
  }
}

export function getStoredMessage(id: string) {
  return messageStore.get(id)
}
