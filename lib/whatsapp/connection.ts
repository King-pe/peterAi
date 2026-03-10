import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  WASocket,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
} from '@whiskeysockets/baileys'
import { Boom } from '@hapi/boom'
import * as QRCode from 'qrcode'
import pino from 'pino'
import path from 'path'
import fs from 'fs'
import { setupMessageHandler } from './message-handler'

const logger = pino({ level: 'silent' })

// Store connection state
let socket: WASocket | null = null
let qrCode: string | null = null
let connectionStatus = {
  connected: false,
  phoneNumber: null as string | null,
}

const AUTH_FOLDER = path.join(process.cwd(), 'auth_info')

// Ensure auth folder exists
if (!fs.existsSync(AUTH_FOLDER)) {
  fs.mkdirSync(AUTH_FOLDER, { recursive: true })
}

export async function initializeConnection(): Promise<WASocket | null> {
  if (socket && connectionStatus.connected) {
    return socket
  }

  try {
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER)
    const { version } = await fetchLatestBaileysVersion()

    socket = makeWASocket({
      version,
      logger,
      printQRInTerminal: false,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, logger),
      },
      generateHighQualityLinkPreview: true,
    })

    // Handle connection updates
    socket.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update

      if (qr) {
        // Generate QR code as data URL
        qrCode = await QRCode.toDataURL(qr, {
          width: 256,
          margin: 2,
        })
      }

      if (connection === 'close') {
        const shouldReconnect =
          (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut

        connectionStatus.connected = false

        if (shouldReconnect) {
          // Retry connection
          setTimeout(() => initializeConnection(), 5000)
        } else {
          // Clear auth data if logged out
          qrCode = null
          connectionStatus.phoneNumber = null
        }
      } else if (connection === 'open') {
        connectionStatus.connected = true
        connectionStatus.phoneNumber = socket?.user?.id?.split(':')[0] || null
        qrCode = null
        
        // Setup message handler when connected
        if (socket) {
          setupMessageHandler(socket)
        }
      }
    })

    // Save credentials on update
    socket.ev.on('creds.update', saveCreds)

    return socket
  } catch (error) {
    console.error('Error initializing WhatsApp connection:', error)
    return null
  }
}

export async function getQRCode(): Promise<string | null> {
  return qrCode
}

export async function getConnectionStatus() {
  return connectionStatus
}

export async function requestPairingCode(phoneNumber: string): Promise<string | null> {
  try {
    if (!socket) {
      await initializeConnection()
    }

    if (socket && !connectionStatus.connected) {
      const code = await socket.requestPairingCode(phoneNumber)
      return code
    }

    return null
  } catch (error) {
    console.error('Error requesting pairing code:', error)
    return null
  }
}

export async function disconnectWhatsApp(): Promise<boolean> {
  try {
    if (socket) {
      await socket.logout()
      socket = null
      connectionStatus.connected = false
      connectionStatus.phoneNumber = null
      qrCode = null

      // Clear auth folder
      if (fs.existsSync(AUTH_FOLDER)) {
        fs.rmSync(AUTH_FOLDER, { recursive: true, force: true })
        fs.mkdirSync(AUTH_FOLDER, { recursive: true })
      }

      return true
    }
    return false
  } catch (error) {
    console.error('Error disconnecting WhatsApp:', error)
    return false
  }
}

export async function sendMessage(to: string, message: string): Promise<boolean> {
  try {
    if (!socket || !connectionStatus.connected) {
      return false
    }

    const jid = to.includes('@s.whatsapp.net') ? to : `${to}@s.whatsapp.net`
    await socket.sendMessage(jid, { text: message })
    return true
  } catch (error) {
    console.error('Error sending message:', error)
    return false
  }
}

export function getSocket(): WASocket | null {
  return socket
}
