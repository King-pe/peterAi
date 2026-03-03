// ============================================
// PeterAi - Whapi.Cloud API Client
// ============================================

import { getSettings, saveSettings } from "./storage"

const WHAPI_BASE = "https://gate.whapi.cloud"

// Get token: first from storage, then from env variable
async function getToken(): Promise<string> {
  const settings = await getSettings()
  if (settings.whapiToken) return settings.whapiToken
  const envToken = process.env.WHAPI_API_TOKEN
  if (envToken) return envToken
  throw new Error("No Whapi token configured. Connect WhatsApp in dashboard.")
}

async function headers(): Promise<Record<string, string>> {
  return {
    Authorization: `Bearer ${await getToken()}`,
    "Content-Type": "application/json",
    accept: "application/json",
  }
}

async function whapiRequest(
  endpoint: string,
  method: string = "GET",
  body?: Record<string, unknown>
): Promise<unknown> {
  const url = `${WHAPI_BASE}${endpoint}`
  const options: RequestInit = {
    method,
    headers: await headers(),
  }
  if (body) {
    options.body = JSON.stringify(body)
  }
  const res = await fetch(url, options)
  if (!res.ok) {
    const text = await res.text()
    console.error(`Whapi API error [${res.status}]: ${text}`)
    throw new Error(`Whapi API error: ${res.status} - ${text}`)
  }
  return res.json()
}

// ---- Login / QR Code Flow ----

// Start login with phone number - returns channel token
export async function loginWithPhone(phone: string): Promise<{
  token?: string
  status?: string
  error?: string
}> {
  const res = await fetch(`${WHAPI_BASE}/users/login/${phone}`, {
    method: "GET",
    headers: {
      accept: "application/json",
      Authorization: `Bearer ${process.env.WHAPI_API_TOKEN || ""}`,
    },
  })
  const data = await res.json() as Record<string, unknown>
  if (data.token) {
    // Save token to settings
    await saveSettings({
      whapiToken: data.token as string,
      whapiPhone: phone,
      botPhoneNumber: phone,
    })
  }
  return data as { token?: string; status?: string; error?: string }
}

// Get QR code as base64 (for currently authenticated channel)
export async function getQRBase64(token?: string): Promise<{
  qr?: string
  status?: string
  error?: string
}> {
  const authToken = token || process.env.WHAPI_API_TOKEN || (await getSettings()).whapiToken
  if (!authToken) {
    return { error: "No token available" }
  }
  const res = await fetch(`${WHAPI_BASE}/users/login`, {
    method: "GET",
    headers: {
      accept: "application/json",
      Authorization: `Bearer ${authToken}`,
    },
  })
  if (!res.ok) {
    const text = await res.text()
    return { error: `Failed to get QR: ${text}` }
  }
  const data = await res.json() as Record<string, unknown>
  return data as { qr?: string; status?: string; error?: string }
}

// Get QR code as image (PNG buffer)
export async function getQRImage(token?: string): Promise<Buffer | null> {
  const authToken = token || process.env.WHAPI_API_TOKEN || (await getSettings()).whapiToken
  if (!authToken) return null
  const res = await fetch(`${WHAPI_BASE}/users/login/image`, {
    method: "GET",
    headers: {
      accept: "image/png",
      Authorization: `Bearer ${authToken}`,
    },
  })
  if (!res.ok) return null
  const buffer = Buffer.from(await res.arrayBuffer())
  return buffer
}

// Check connection status
export async function getConnectionStatus(): Promise<{
  connected: boolean
  phone?: string
  status?: string
  error?: string
}> {
  try {
    const token = await getToken()
    const res = await fetch(`${WHAPI_BASE}/users`, {
      method: "GET",
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
    if (!res.ok) {
      return { connected: false, status: "disconnected" }
    }
    const data = await res.json() as Record<string, unknown>
    const status = (data.status as string) || ""
    const isConnected = status === "done" || status === "connected" || !!(data.phone as string)
    if (isConnected) {
      await saveSettings({
        whapiConnected: true,
        whapiPhone: (data.phone as string) || "",
      })
    }
    return {
      connected: isConnected,
      phone: data.phone as string,
      status,
    }
  } catch {
    return { connected: false, status: "error" }
  }
}

// Disconnect / logout
export async function disconnectWhatsApp(): Promise<boolean> {
  try {
    const token = await getToken()
    await fetch(`${WHAPI_BASE}/users/logout`, {
      method: "POST",
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
    await saveSettings({
      whapiToken: "",
      whapiConnected: false,
      whapiPhone: "",
    })
    return true
  } catch {
    return false
  }
}

// ---- Send Messages ----

export async function sendText(to: string, body: string) {
  return whapiRequest("/messages/text", "POST", {
    to,
    body,
  })
}

export async function replyToMessage(
  to: string,
  quotedMessageId: string,
  body: string
) {
  return whapiRequest("/messages/text", "POST", {
    to,
    body,
    quoted: quotedMessageId,
  })
}

export async function sendImage(
  to: string,
  mediaUrl: string,
  caption?: string
) {
  return whapiRequest("/messages/image", "POST", {
    to,
    media: mediaUrl,
    caption,
  })
}

export async function sendVideo(
  to: string,
  mediaUrl: string,
  caption?: string
) {
  return whapiRequest("/messages/video", "POST", {
    to,
    media: mediaUrl,
    caption,
  })
}

export async function sendAudio(to: string, mediaUrl: string) {
  return whapiRequest("/messages/audio", "POST", {
    to,
    media: mediaUrl,
  })
}

export async function sendDocument(
  to: string,
  mediaUrl: string,
  filename: string,
  caption?: string
) {
  return whapiRequest("/messages/document", "POST", {
    to,
    media: mediaUrl,
    filename,
    caption,
  })
}

// ---- Media ----

export async function getMediaUrl(mediaId: string): Promise<string> {
  const res = (await whapiRequest(`/media/${mediaId}`)) as { link?: string }
  return res.link || ""
}

// ---- Groups ----

export async function createGroup(
  name: string,
  participants: string[]
) {
  return whapiRequest("/groups", "POST", {
    subject: name,
    participants,
  })
}

export async function addParticipant(
  groupId: string,
  participants: string[]
) {
  return whapiRequest(`/groups/${groupId}/participants`, "POST", {
    participants,
  })
}

export async function getGroupInviteLink(
  groupId: string
): Promise<string> {
  const res = (await whapiRequest(
    `/groups/${groupId}/invite`
  )) as { link?: string }
  return res.link || ""
}

// ---- Reactions ----

export async function reactToMessage(messageId: string, emoji: string) {
  return whapiRequest(`/messages/${messageId}/reaction`, "PUT", {
    emoji,
  })
}

// ---- Status / Stories ----

export async function sendStatusText(body: string) {
  return whapiRequest("/messages/text", "POST", {
    to: "status@broadcast",
    body,
  })
}

// ---- Contacts ----

export async function checkNumber(phone: string): Promise<boolean> {
  try {
    const res = (await whapiRequest("/contacts", "POST", {
      blocking: "wait",
      contacts: [phone],
    })) as { contacts?: { wa_id?: string }[] }
    return !!res.contacts?.[0]?.wa_id
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
