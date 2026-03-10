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
        const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode
        // Only stop reconnecting if user explicitly logged out (statusCode 401)
        const isLoggedOut = statusCode === DisconnectReason.loggedOut

        connectionStatus.connected = false
        console.log('[v0] Connection closed, statusCode:', statusCode, 'isLoggedOut:', isLoggedOut)

        if (!isLoggedOut) {
          // Always try to reconnect unless explicitly logged out
          console.log('[v0] Reconnecting in 2 seconds...')
          setTimeout(() => initializeConnection(), 2000)
        } else {
          // Only clear auth data if explicitly logged out by user
          console.log('[v0] Logged out by user - clearing auth data')
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
          
          // Send welcome message to the connected phone
          const phoneNumber = connectionStatus.phoneNumber
          if (phoneNumber) {
            const welcomeMessage = `🎉 *PeterAi Bot Imeunganishwa!*

Hongera! WhatsApp yako imeunganishwa na PeterAi Bot.

*Maelezo:*
- Nambari: ${phoneNumber}
- Hali: Imeunganishwa
- Wakati: ${new Date().toLocaleString('sw-TZ')}

Bot yako sasa iko tayari kupokea na kujibu ujumbe.

Tuma "msaada" kuona amri zote zinazopatikana.`

            try {
              const jid = `${phoneNumber}@s.whatsapp.net`
              await socket.sendMessage(jid, { text: welcomeMessage })
              console.log('[v0] Welcome message sent to:', phoneNumber)
            } catch (err) {
              console.error('[v0] Error sending welcome message:', err)
            }
          }
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
    // Clean phone number - ensure it starts with country code
    let cleanPhone = phoneNumber.replace(/\D/g, '')
    
    // Handle Tanzania numbers
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '255' + cleanPhone.slice(1)
    } else if (!cleanPhone.startsWith('255') && cleanPhone.length === 9) {
      cleanPhone = '255' + cleanPhone
    }
    
    if (!cleanPhone || cleanPhone.length < 12) {
      console.error('[v0] Invalid phone number:', phoneNumber, '-> cleaned:', cleanPhone)
      return null
    }

    console.log('[v0] Requesting pairing code for:', cleanPhone)

    // If already connected, return null
    if (connectionStatus.connected) {
      console.log('[v0] Already connected')
      return null
    }

    // Reset connection to ensure fresh state for pairing
    if (socket) {
      try {
        socket.ev.removeAllListeners('connection.update')
        socket.ev.removeAllListeners('creds.update')
        socket = null
      } catch (e) {
        console.log('[v0] Error cleaning up socket:', e)
      }
    }

    // Initialize fresh connection for pairing
    pairingCodeRequested = true
    qrCode = null
    
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
    })

    // Setup connection handler
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
        console.log('[v0] WhatsApp connected via pairing code:', connectionStatus.phoneNumber)
        
        if (socket) {
          setupMessageHandler(socket)
          
          // Send welcome message
          const phoneNumber = connectionStatus.phoneNumber
          if (phoneNumber) {
            const welcomeMessage = `🎉 *PeterAi Bot Imeunganishwa!*

Hongera! WhatsApp yako imeunganishwa na PeterAi Bot kupitia pairing code.

*Maelezo:*
- Nambari: ${phoneNumber}
- Hali: Imeunganishwa
- Wakati: ${new Date().toLocaleString('sw-TZ')}

Bot yako sasa iko tayari kupokea na kujibu ujumbe.

Tuma "msaada" kuona amri zote zinazopatikana.`

            try {
              const jid = `${phoneNumber}@s.whatsapp.net`
              await socket.sendMessage(jid, { text: welcomeMessage })
              console.log('[v0] Welcome message sent via pairing:', phoneNumber)
            } catch (err) {
              console.error('[v0] Error sending welcome message:', err)
            }
          }
        }
      }
    })

    socket.ev.on('creds.update', saveCreds)

    // Wait for socket to be ready - longer timeout
    await new Promise(resolve => setTimeout(resolve, 3000))

    if (socket) {
      // Check if already registered
      if (socket.authState?.creds?.registered) {
        console.log('[v0] Device already registered')
        pairingCodeRequested = false
        return null
      }

      try {
        console.log('[v0] Socket ready, requesting pairing code for:', cleanPhone)
        
        // Add timeout wrapper for pairing code request
        const timeoutPromise = new Promise<null>((resolve) => {
          setTimeout(() => {
            console.log('[v0] Pairing code request timed out')
            resolve(null)
          }, 30000) // 30 second timeout
        })

        const codePromise = socket.requestPairingCode(cleanPhone)
        const code = await Promise.race([codePromise, timeoutPromise])
        
        if (code) {
          console.log('[v0] Pairing code received:', code)
          return code
        } else {
          console.log('[v0] No pairing code received')
          pairingCodeRequested = false
          return null
        }
      } catch (err: unknown) {
        const error = err as Error
        console.error('[v0] Error requesting pairing code:', error.message, error)
        pairingCodeRequested = false
        return null
      }
    } else {
      console.log('[v0] Socket not initialized')
      pairingCodeRequested = false
      return null
    }
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
