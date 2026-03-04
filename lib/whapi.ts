// ============================================
// PeterAi - WhatsApp API Adapter (Baileys Backend)
// ============================================
// Thin wrapper that delegates to the Baileys socket.
// Maintains the same export API as the old Whapi.cloud version
// so all existing consumers (bot-handler, commands) work unchanged.
//
// All imports of baileys are lazy so this module can be safely imported
// without crashing in environments where native modules can't load.

import {
  getSocket,
  getConnectionState,
  disconnectSocket,
  getStoredMessage,
} from "./baileys"

function requireSocket() {
  const sock = getSocket()
  if (!sock) {
    throw new Error("WhatsApp not connected. Connect via dashboard first.")
  }
  return sock
}

// ---- Connection ----

export async function getConnectionStatus(): Promise<{
  connected: boolean
  phone?: string
  status?: string
  error?: string
}> {
  const state = getConnectionState()
  return {
    connected: state.connected,
    phone: state.phone || undefined,
    status: state.status,
  }
}

export async function disconnectWhatsApp(): Promise<boolean> {
  return disconnectSocket()
}

// ---- Typing Presence ----

export async function sendTypingPresence(chatId: string): Promise<void> {
  try {
    const sock = getSocket()
    if (!sock) return
    await sock.sendPresenceUpdate("composing", chatId)
  } catch (err) {
    console.error("Failed to send typing presence:", err)
  }
}

// ---- Send Messages ----

export async function sendText(to: string, body: string) {
  const sock = requireSocket()
  return sock.sendMessage(to, { text: body })
}

export async function replyToMessage(
  to: string,
  quotedMessageId: string,
  body: string
) {
  const sock = requireSocket()
  const storedMsg = getStoredMessage(quotedMessageId)
  if (storedMsg) {
    return sock.sendMessage(to, { text: body }, { quoted: storedMsg as never })
  }
  return sock.sendMessage(to, { text: body })
}

export async function sendImage(
  to: string,
  mediaUrl: string,
  caption?: string
) {
  const sock = requireSocket()
  return sock.sendMessage(to, {
    image: { url: mediaUrl },
    caption: caption || undefined,
  })
}

export async function sendVideo(
  to: string,
  mediaUrl: string,
  caption?: string
) {
  const sock = requireSocket()
  return sock.sendMessage(to, {
    video: { url: mediaUrl },
    caption: caption || undefined,
  })
}

export async function sendAudio(to: string, mediaUrl: string) {
  const sock = requireSocket()
  return sock.sendMessage(to, {
    audio: { url: mediaUrl },
    mimetype: "audio/mp4",
    ptt: false,
  })
}

export async function sendDocument(
  to: string,
  mediaUrl: string,
  filename: string,
  caption?: string
) {
  const sock = requireSocket()
  return sock.sendMessage(to, {
    document: { url: mediaUrl },
    fileName: filename,
    caption: caption || undefined,
    mimetype: "application/octet-stream",
  })
}

// ---- Media ----

export async function getMediaUrl(mediaId: string): Promise<string> {
  const storedMsg = getStoredMessage(mediaId)
  if (!storedMsg) {
    throw new Error("Message not found in store - cannot download media")
  }

  try {
    const { downloadMediaMessage } = await import("@whiskeysockets/baileys")
    const buffer = await downloadMediaMessage(
      storedMsg as never,
      "buffer",
      {}
    )
    const base64 = Buffer.from(buffer as Buffer).toString("base64")
    const msg = storedMsg as Record<string, Record<string, Record<string, unknown>>>
    const mimeType =
      msg?.message?.imageMessage?.mimetype as string ||
      msg?.message?.videoMessage?.mimetype as string ||
      msg?.message?.audioMessage?.mimetype as string ||
      msg?.message?.documentMessage?.mimetype as string ||
      "application/octet-stream"
    return `data:${mimeType};base64,${base64}`
  } catch (err) {
    console.error("Failed to download media:", err)
    throw err
  }
}

// ---- Groups ----

export async function createGroup(
  name: string,
  participants: string[]
) {
  const sock = requireSocket()
  return sock.groupCreate(name, participants)
}

export async function addParticipant(
  groupId: string,
  participants: string[]
) {
  const sock = requireSocket()
  return sock.groupParticipantsUpdate(groupId, participants, "add")
}

export async function getGroupInviteLink(
  groupId: string
): Promise<string> {
  const sock = requireSocket()
  const code = await sock.groupInviteCode(groupId)
  return `https://chat.whatsapp.com/${code}`
}

// ---- Reactions ----

export async function reactToMessage(messageId: string, emoji: string, chatId?: string) {
  const sock = requireSocket()
  const storedMsg = getStoredMessage(messageId) as { key?: { remoteJid?: string; id?: string; fromMe?: boolean } } | undefined
  if (storedMsg && storedMsg.key) {
    return sock.sendMessage(storedMsg.key.remoteJid!, {
      react: { text: emoji, key: storedMsg.key as never },
    })
  }
  if (chatId) {
    const key = { remoteJid: chatId, id: messageId, fromMe: false }
    return sock.sendMessage(chatId, {
      react: { text: emoji, key: key as never },
    })
  }
  throw new Error("Cannot react - message not found and no chatId provided")
}

// ---- Status / Stories ----

export async function sendStatusText(body: string) {
  const sock = requireSocket()
  return sock.sendMessage("status@broadcast", { text: body })
}

// ---- Contacts ----

export async function checkNumber(phone: string): Promise<boolean> {
  try {
    const sock = requireSocket()
    const [result] = await sock.onWhatsApp(phone)
    return result?.exists || false
  } catch {
    return false
  }
}

// ---- Helper: Format phone for chat_id ----
export function formatChatId(phone: string): string {
  const cleaned = phone.replace(/[^0-9]/g, "")
  if (cleaned.includes("@")) return cleaned
  return `${cleaned}@s.whatsapp.net`
}

export function extractPhone(chatId: string): string {
  return chatId.replace("@s.whatsapp.net", "").replace("@g.us", "")
}
