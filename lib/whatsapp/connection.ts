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
let pairingCodeRequested = false
let connectionStatus = {
  connected: false,
  phoneNumber: null as string | null,
}

const AUTH_FOLDER = path.join(process.cwd(), 'auth_info')

// Ensure auth folder exists
if (!fs.existsSync(AUTH_FOLDER)) {
  fs.mkdirSync(AUTH_FOLDER, { recursive: true })
}

export async function initializeConnection(usePairingCode = false): Promise<WASocket | null> {
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
      // Browser identification
      browser: ['PeterAi Bot', 'Chrome', '120.0.0'],
    })

    // Handle connection updates
    socket.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update

      if (qr && !usePairingCode && !pairingCodeRequested) {
        // Generate QR code as data URL
        try {
          qrCode = await QRCode.toDataURL(qr, {
            width: 256,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#ffffff',
            },
          })
          console.log('[v0] QR Code generated successfully')
        } catch (err) {
          console.error('[v0] Error generating QR code:', err)
        }
      }

      if (connection === 'close') {
        const shouldReconnect =
          (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut

        connectionStatus.connected = false
        console.log('[v0] Connection closed, shouldReconnect:', shouldReconnect)

        if (shouldReconnect) {
          // Retry connection after delay
          setTimeout(() => initializeConnection(), 5000)
        } else {
          // Clear auth data if logged out
          qrCode = null
          connectionStatus.phoneNumber = null
          pairingCodeRequested = false
        }
      } else if (connection === 'open') {
        connectionStatus.connected = true
        connectionStatus.phoneNumber = socket?.user?.id?.split(':')[0] || null
        qrCode = null
        pairingCodeRequested = false
        console.log('[v0] WhatsApp connected successfully:', connectionStatus.phoneNumber)
        
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
    console.error('[v0] Error initializing WhatsApp connection:', error)
    return null
  }
}

export async function getQRCode(): Promise<string | null> {
  // If not initialized or no QR code, try to initialize
  if (!socket && !qrCode) {
    await initializeConnection(false)
    // Wait a bit for QR to be generated
    await new Promise(resolve => setTimeout(resolve, 2000))
  }
  return qrCode
}

export async function getConnectionStatus() {
  return connectionStatus
}

export async function requestPairingCode(phoneNumber: string): Promise<string | null> {
  try {
    // Clean phone number
    const cleanPhone = phoneNumber.replace(/\D/g, '')
    
    if (!cleanPhone || cleanPhone.length < 10) {
      console.error('[v0] Invalid phone number:', phoneNumber)
      return null
    }

    // If already connected, return null
    if (connectionStatus.connected) {
      console.log('[v0] Already connected')
      return null
    }

    // Initialize connection if not already done
    if (!socket) {
      pairingCodeRequested = true
      await initializeConnection(true)
      // Wait for socket to be ready
      await new Promise(resolve => setTimeout(resolve, 3000))
    }

    if (socket && !connectionStatus.connected) {
      pairingCodeRequested = true
      console.log('[v0] Requesting pairing code for:', cleanPhone)
      
      try {
        const code = await socket.requestPairingCode(cleanPhone)
        console.log('[v0] Pairing code received:', code)
        return code
      } catch (err) {
        console.error('[v0] Error requesting pairing code:', err)
        // If pairing code fails, reset and let QR code work
        pairingCodeRequested = false
        return null
      }
    }

    return null
  } catch (error) {
    console.error('[v0] Error in requestPairingCode:', error)
    pairingCodeRequested = false
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
      pairingCodeRequested = false

      // Clear auth folder
      if (fs.existsSync(AUTH_FOLDER)) {
        fs.rmSync(AUTH_FOLDER, { recursive: true, force: true })
        fs.mkdirSync(AUTH_FOLDER, { recursive: true })
      }

      console.log('[v0] WhatsApp disconnected successfully')
      return true
    }
    return false
  } catch (error) {
    console.error('[v0] Error disconnecting WhatsApp:', error)
    return false
  }
}

export async function sendMessage(to: string, message: string): Promise<boolean> {
  try {
    if (!socket || !connectionStatus.connected) {
      console.error('[v0] Cannot send message: not connected')
      return false
    }

    const jid = to.includes('@s.whatsapp.net') ? to : `${to}@s.whatsapp.net`
    await socket.sendMessage(jid, { text: message })
    console.log('[v0] Message sent to:', jid)
    return true
  } catch (error) {
    console.error('[v0] Error sending message:', error)
    return false
  }
}

export function getSocket(): WASocket | null {
  return socket
}

// Reset connection state
export async function resetConnection(): Promise<void> {
  socket = null
  qrCode = null
  pairingCodeRequested = false
  connectionStatus.connected = false
  connectionStatus.phoneNumber = null

  // Clear auth folder
  if (fs.existsSync(AUTH_FOLDER)) {
    fs.rmSync(AUTH_FOLDER, { recursive: true, force: true })
    fs.mkdirSync(AUTH_FOLDER, { recursive: true })
  }
  
  console.log('[v0] Connection reset')
}
