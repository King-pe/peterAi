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
let qrCodeRaw: string | null = null
let pairingCodeRequested = false
let isInitializing = false
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
  // Prevent multiple simultaneous initializations
  if (isInitializing) {
    return socket
  }

  if (socket && connectionStatus.connected) {
    return socket
  }

  isInitializing = true

  try {
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER)
    const { version } = await fetchLatestBaileysVersion()

    // Close existing socket if any
    if (socket) {
      try {
        socket.ev.removeAllListeners('connection.update')
        socket.ev.removeAllListeners('creds.update')
        socket.ev.removeAllListeners('messages.upsert')
      } catch {
        // Ignore cleanup errors
      }
    }

    socket = makeWASocket({
      version,
      logger,
      printQRInTerminal: false,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, logger),
      },
      generateHighQualityLinkPreview: true,
      browser: ['PeterAi Bot', 'Chrome', '120.0.0'],
      // Keep connection alive
      keepAliveIntervalMs: 30000,
      // Connection timeout
      connectTimeoutMs: 60000,
      // Default query timeout
      defaultQueryTimeoutMs: 60000,
      // Emit close when deleting closed connections
      emitOwnEvents: true,
      // Mark online
      markOnlineOnConnect: true,
    })

    // Handle connection updates
    socket.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update

      // Generate new QR code when received
      if (qr && !usePairingCode && !pairingCodeRequested) {
        qrCodeRaw = qr
        try {
          qrCode = await QRCode.toDataURL(qr, {
            width: 300,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#ffffff',
            },
          })
        } catch (err) {
          console.error('Error generating QR code:', err)
        }
      }

      if (connection === 'connecting') {
        connectionStatus.connected = false
      }

      if (connection === 'close') {
        const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode
        const isLoggedOut = statusCode === DisconnectReason.loggedOut

        connectionStatus.connected = false
        isInitializing = false

        if (!isLoggedOut) {
          // Reconnect after a short delay
          qrCode = null
          qrCodeRaw = null
          setTimeout(() => initializeConnection(), 3000)
        } else {
          // Clear everything if logged out
          qrCode = null
          qrCodeRaw = null
          connectionStatus.phoneNumber = null
          pairingCodeRequested = false
        }
      } else if (connection === 'open') {
        connectionStatus.connected = true
        connectionStatus.phoneNumber = socket?.user?.id?.split(':')[0] || null
        qrCode = null
        qrCodeRaw = null
        pairingCodeRequested = false
        isInitializing = false
        
        // Setup message handler when connected
        if (socket) {
          setupMessageHandler(socket)
          
          // Send welcome message to the connected phone
          const phoneNumber = connectionStatus.phoneNumber
          if (phoneNumber) {
            const welcomeMessage = `*PeterAi Bot Imeunganishwa!*

Hongera! WhatsApp yako imeunganishwa na PeterAi Bot.

Nambari: ${phoneNumber}
Wakati: ${new Date().toLocaleString('sw-TZ')}

Bot yako sasa iko tayari kupokea na kujibu ujumbe.

Tuma "msaada" kuona amri zote zinazopatikana.`

            try {
              const jid = `${phoneNumber}@s.whatsapp.net`
              await socket.sendMessage(jid, { text: welcomeMessage })
            } catch (err) {
              console.error('Error sending welcome message:', err)
            }
          }
        }
      }
    })

    // Save credentials on update - IMPORTANT for persistent login
    socket.ev.on('creds.update', saveCreds)

    isInitializing = false
    return socket
  } catch (error) {
    console.error('Error initializing WhatsApp connection:', error)
    isInitializing = false
    return null
  }
}

export async function getQRCode(): Promise<string | null> {
  // If not initialized, start initialization
  if (!socket && !isInitializing) {
    await initializeConnection(false)
  }
  
  // Wait a bit for QR to be generated if initializing
  if (isInitializing && !qrCode) {
    await new Promise(resolve => setTimeout(resolve, 3000))
  }
  
  return qrCode
}

export async function refreshQRCode(): Promise<string | null> {
  // Force new QR code by reinitializing
  if (socket && !connectionStatus.connected) {
    try {
      socket.ev.removeAllListeners('connection.update')
      socket.ev.removeAllListeners('creds.update')
      socket = null
    } catch {
      // Ignore
    }
  }
  
  qrCode = null
  qrCodeRaw = null
  
  await initializeConnection(false)
  await new Promise(resolve => setTimeout(resolve, 3000))
  
  return qrCode
}

export async function getConnectionStatus() {
  return connectionStatus
}

export async function requestPairingCode(phoneNumber: string): Promise<string | null> {
  try {
    // Clean phone number
    let cleanPhone = phoneNumber.replace(/\D/g, '')
    
    // Handle Tanzania numbers
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '255' + cleanPhone.slice(1)
    } else if (!cleanPhone.startsWith('255') && cleanPhone.length === 9) {
      cleanPhone = '255' + cleanPhone
    }
    
    if (!cleanPhone || cleanPhone.length < 12) {
      return null
    }

    if (connectionStatus.connected) {
      return null
    }

    // Reset connection for pairing
    if (socket) {
      try {
        socket.ev.removeAllListeners('connection.update')
        socket.ev.removeAllListeners('creds.update')
        socket = null
      } catch {
        // Ignore
      }
    }

    pairingCodeRequested = true
    qrCode = null
    qrCodeRaw = null
    
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
      browser: ['PeterAi Bot', 'Chrome', '120.0.0'],
      keepAliveIntervalMs: 30000,
      connectTimeoutMs: 60000,
    })

    socket.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect } = update

      if (connection === 'close') {
        const shouldReconnect =
          (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut
        connectionStatus.connected = false
        
        if (shouldReconnect && !pairingCodeRequested) {
          setTimeout(() => initializeConnection(), 5000)
        }
      } else if (connection === 'open') {
        connectionStatus.connected = true
        connectionStatus.phoneNumber = socket?.user?.id?.split(':')[0] || null
        pairingCodeRequested = false
        
        if (socket) {
          setupMessageHandler(socket)
          
          const phoneNumber = connectionStatus.phoneNumber
          if (phoneNumber) {
            const welcomeMessage = `*PeterAi Bot Imeunganishwa!*

Hongera! WhatsApp yako imeunganishwa na PeterAi Bot.

Nambari: ${phoneNumber}
Wakati: ${new Date().toLocaleString('sw-TZ')}

Bot yako sasa iko tayari.

Tuma "msaada" kuona amri zote.`

            try {
              const jid = `${phoneNumber}@s.whatsapp.net`
              await socket.sendMessage(jid, { text: welcomeMessage })
            } catch {
              // Ignore send errors
            }
          }
        }
      }
    })

    socket.ev.on('creds.update', saveCreds)

    // Wait for socket to be ready
    await new Promise(resolve => setTimeout(resolve, 4000))

    if (socket && !socket.authState?.creds?.registered) {
      try {
        const code = await socket.requestPairingCode(cleanPhone)
        return code
      } catch {
        pairingCodeRequested = false
        return null
      }
    }
    
    pairingCodeRequested = false
    return null
  } catch {
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
      qrCodeRaw = null
      pairingCodeRequested = false

      // Clear auth folder
      if (fs.existsSync(AUTH_FOLDER)) {
        fs.rmSync(AUTH_FOLDER, { recursive: true, force: true })
        fs.mkdirSync(AUTH_FOLDER, { recursive: true })
      }

      return true
    }
    return false
  } catch {
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
  } catch {
    return false
  }
}

export function getSocket(): WASocket | null {
  return socket
}

export async function resetConnection(): Promise<void> {
  if (socket) {
    try {
      socket.ev.removeAllListeners('connection.update')
      socket.ev.removeAllListeners('creds.update')
    } catch {
      // Ignore
    }
  }
  
  socket = null
  qrCode = null
  qrCodeRaw = null
  pairingCodeRequested = false
  isInitializing = false
  connectionStatus.connected = false
  connectionStatus.phoneNumber = null

  // Clear auth folder
  if (fs.existsSync(AUTH_FOLDER)) {
    fs.rmSync(AUTH_FOLDER, { recursive: true, force: true })
    fs.mkdirSync(AUTH_FOLDER, { recursive: true })
  }
}
