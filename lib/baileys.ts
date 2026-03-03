// ============================================
// PeterAi - Baileys WhatsApp Client
// @whiskeysockets/baileys integration
// Powered by Peter Joram
// ============================================

import makeWASocket, {
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  useMultiFileAuthState,
  type WASocket,
  type BaileysEventMap,
  Browsers,
  delay,
} from "@whiskeysockets/baileys"
import { Boom } from "@hapi/boom"
import pino from "pino"
import { usePostgresAuthState, clearAuthState } from "./baileys-auth-store"
import * as QRCode from "qrcode"

const logger = pino({ level: "silent" })

// Singleton socket state
let sock: WASocket | null = null
let qrString: string | null = null
let pairingCode: string | null = null
let connectionState: "disconnected" | "connecting" | "connected" = "disconnected"
let connectedPhone: string | null = null
let pendingPairingPhone: string | null = null
let reconnectAttempts = 0
const MAX_RECONNECT = 5

// Event listeners for connection updates
type ConnectionListener = (state: string, phone?: string) => void
const connectionListeners: ConnectionListener[] = []

export function onConnectionUpdate(listener: ConnectionListener) {
  connectionListeners.push(listener)
  return () => {
    const idx = connectionListeners.indexOf(listener)
    if (idx >= 0) connectionListeners.splice(idx, 1)
  }
}

function notifyListeners(state: string, phone?: string) {
  for (const listener of connectionListeners) {
    try { listener(state, phone) } catch {}
  }
}

export function getSocket(): WASocket | null {
  return sock
}

export function getConnectionInfo() {
  return {
    connected: connectionState === "connected",
    connecting: connectionState === "connecting",
    phone: connectedPhone,
    status: connectionState,
    qr: qrString,
    pairingCode,
  }
}

export async function getQrDataUrl(): Promise<string | null> {
  if (!qrString) return null
  try {
    const dataUrl = await QRCode.toDataURL(qrString, {
      width: 300,
      margin: 2,
      color: { dark: "#000000", light: "#ffffff" },
    })
    return dataUrl
  } catch {
    return null
  }
}

export async function getQrBase64(): Promise<string | null> {
  if (!qrString) return null
  try {
    const dataUrl = await QRCode.toDataURL(qrString, {
      width: 300,
      margin: 2,
      color: { dark: "#000000", light: "#ffffff" },
    })
    // Remove data:image/png;base64, prefix
    return dataUrl.replace(/^data:image\/png;base64,/, "")
  } catch {
    return null
  }
}

// Start the Baileys socket
export async function startSocket(usePairingCode = false, phoneForPairing?: string): Promise<void> {
  if (sock && connectionState === "connected") {
    console.log("Socket already connected")
    return
  }

  connectionState = "connecting"
  qrString = null
  pairingCode = null

  try {
    const { version } = await fetchLatestBaileysVersion()
    const { creds, keys, saveCreds } = await usePostgresAuthState()

    sock = makeWASocket({
      version,
      logger,
      printQRInTerminal: false,
      auth: {
        creds,
        keys: makeCacheableSignalKeyStore(keys, logger),
      },
      browser: Browsers.ubuntu("PeterAi"),
      generateHighQualityLinkPreview: true,
    })

    // If using pairing code, request it
    if (usePairingCode && phoneForPairing && !creds.registered) {
      pendingPairingPhone = phoneForPairing
      // Wait a moment for socket to be ready
      await delay(3000)
      try {
        const code = await sock.requestPairingCode(phoneForPairing)
        pairingCode = code
        console.log("Pairing code generated:", code)
      } catch (err) {
        console.error("Failed to get pairing code:", err)
        pairingCode = null
      }
    }

    // Handle connection events
    sock.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect, qr } = update

      if (qr && !usePairingCode) {
        qrString = qr
        console.log("QR code received")
        notifyListeners("qr")
      }

      if (connection === "close") {
        const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut

        console.log("Connection closed. Status:", statusCode, "Reconnect:", shouldReconnect)

        sock = null
        connectionState = "disconnected"
        qrString = null
        pairingCode = null
        connectedPhone = null

        if (shouldReconnect && reconnectAttempts < MAX_RECONNECT) {
          reconnectAttempts++
          console.log(`Reconnecting... attempt ${reconnectAttempts}`)
          await delay(2000 * reconnectAttempts)
          startSocket().catch(console.error)
        } else if (statusCode === DisconnectReason.loggedOut) {
          console.log("Logged out - clearing auth state")
          await clearAuthState()
          notifyListeners("disconnected")
        }
      } else if (connection === "open") {
        console.log("WhatsApp connected!")
        connectionState = "connected"
        reconnectAttempts = 0
        qrString = null
        pairingCode = null

        // Get connected phone number
        if (sock?.user?.id) {
          connectedPhone = sock.user.id.split(":")[0] || sock.user.id
        }

        notifyListeners("connected", connectedPhone || undefined)
      }
    })

    // Save creds on update
    sock.ev.on("creds.update", saveCreds)

  } catch (err) {
    console.error("Failed to start socket:", err)
    connectionState = "disconnected"
    sock = null
    throw err
  }
}

// Request a pairing code (phone number based connection)
export async function requestPairingCode(phone: string): Promise<string | null> {
  // Clean phone number
  const cleaned = phone.replace(/[^0-9]/g, "")
  
  // Start socket with pairing code mode
  await startSocket(true, cleaned)
  
  // Wait for pairing code to be generated (max 10 seconds)
  for (let i = 0; i < 20; i++) {
    if (pairingCode) return pairingCode
    if (connectionState === "connected") return null // Already connected
    await delay(500)
  }

  return pairingCode
}

// Start QR code mode
export async function startQrMode(): Promise<string | null> {
  await startSocket(false)
  
  // Wait for QR code (max 10 seconds)
  for (let i = 0; i < 20; i++) {
    if (qrString) return qrString
    if (connectionState === "connected") return null
    await delay(500)
  }

  return qrString
}

// Disconnect WhatsApp
export async function disconnectWhatsApp(): Promise<boolean> {
  try {
    if (sock) {
      await sock.logout()
      sock = null
    }
    connectionState = "disconnected"
    connectedPhone = null
    qrString = null
    pairingCode = null
    await clearAuthState()
    notifyListeners("disconnected")
    return true
  } catch (err) {
    console.error("Disconnect error:", err)
    // Force cleanup
    sock = null
    connectionState = "disconnected"
    connectedPhone = null
    await clearAuthState()
    return true
  }
}

// ---- Send Messages ----

export async function sendText(to: string, body: string) {
  if (!sock) throw new Error("WhatsApp not connected")
  const jid = formatJid(to)
  return sock.sendMessage(jid, { text: body })
}

export async function replyToMessage(to: string, quotedMessageId: string, body: string) {
  if (!sock) throw new Error("WhatsApp not connected")
  const jid = formatJid(to)
  return sock.sendMessage(jid, { text: body }, { quoted: { key: { remoteJid: jid, id: quotedMessageId }, message: {} } as any })
}

export async function sendImage(to: string, imageUrl: string, caption?: string) {
  if (!sock) throw new Error("WhatsApp not connected")
  const jid = formatJid(to)
  return sock.sendMessage(jid, { image: { url: imageUrl }, caption })
}

export async function sendVideo(to: string, videoUrl: string, caption?: string) {
  if (!sock) throw new Error("WhatsApp not connected")
  const jid = formatJid(to)
  return sock.sendMessage(jid, { video: { url: videoUrl }, caption })
}

export async function sendAudio(to: string, audioUrl: string) {
  if (!sock) throw new Error("WhatsApp not connected")
  const jid = formatJid(to)
  return sock.sendMessage(jid, { audio: { url: audioUrl }, mimetype: "audio/mp4" })
}

export async function sendDocument(to: string, docUrl: string, filename: string, caption?: string) {
  if (!sock) throw new Error("WhatsApp not connected")
  const jid = formatJid(to)
  return sock.sendMessage(jid, {
    document: { url: docUrl },
    fileName: filename,
    caption,
  })
}

// ---- Typing Presence ----

export async function sendTypingPresence(chatId: string): Promise<void> {
  try {
    if (!sock) return
    const jid = formatJid(chatId)
    await sock.presenceSubscribe(jid)
    await sock.sendPresenceUpdate("composing", jid)
  } catch (err) {
    console.error("Failed to send typing presence:", err)
  }
}

// ---- Reactions ----

export async function reactToMessage(chatId: string, messageId: string, emoji: string) {
  if (!sock) return
  const jid = formatJid(chatId)
  return sock.sendMessage(jid, {
    react: { text: emoji, key: { remoteJid: jid, id: messageId } },
  })
}

// ---- Groups ----

export async function createGroup(name: string, participants: string[]) {
  if (!sock) throw new Error("WhatsApp not connected")
  return sock.groupCreate(name, participants.map(formatJid))
}

export async function addParticipant(groupId: string, participants: string[]) {
  if (!sock) throw new Error("WhatsApp not connected")
  return sock.groupParticipantsUpdate(groupId, participants.map(formatJid), "add")
}

export async function getGroupInviteLink(groupId: string): Promise<string> {
  if (!sock) throw new Error("WhatsApp not connected")
  const code = await sock.groupInviteCode(groupId)
  return `https://chat.whatsapp.com/${code}`
}

// ---- Status / Stories ----

export async function sendStatusText(body: string) {
  return sendText("status@broadcast", body)
}

// ---- Contacts ----

export async function checkNumber(phone: string): Promise<boolean> {
  if (!sock) return false
  try {
    const [result] = await sock.onWhatsApp(formatJid(phone))
    return !!result?.exists
  } catch {
    return false
  }
}

// ---- Helper: Format JID ----

export function formatJid(phone: string): string {
  if (phone.includes("@")) return phone
  const cleaned = phone.replace(/[^0-9]/g, "")
  return `${cleaned}@s.whatsapp.net`
}

export function formatChatId(phone: string): string {
  return formatJid(phone)
}

export function extractPhone(jid: string): string {
  return jid.replace("@s.whatsapp.net", "").replace("@g.us", "").split(":")[0]
}

// ---- Message handler registration ----
type MessageHandler = (messages: BaileysEventMap["messages.upsert"]) => void
let messageHandler: MessageHandler | null = null

export function setMessageHandler(handler: MessageHandler) {
  messageHandler = handler
  
  // If socket exists, bind the handler
  if (sock) {
    sock.ev.on("messages.upsert", handler)
  }
}

// Re-bind handler when socket reconnects
export function bindMessageHandler() {
  if (sock && messageHandler) {
    sock.ev.on("messages.upsert", messageHandler)
  }
}
