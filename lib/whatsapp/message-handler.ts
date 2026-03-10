import { WAMessage, WASocket } from '@whiskeysockets/baileys'
import { 
  getOrCreateBotUser, 
  canUserChat, 
  deductCredit, 
  generateAIResponse,
  saveConversation,
  logActivity,
  BotUser
} from './groq-handler'

interface Command {
  name: string
  aliases: string[]
  description: string
  handler: (socket: WASocket, from: string, user: BotUser, args: string[]) => Promise<string>
}

const commands: Command[] = [
  {
    name: 'help',
    aliases: ['msaada', 'menu', 'start'],
    description: 'Ona amri zote zinazopatikana',
    handler: async () => {
      return `🤖 *PeterAi - Msaada*

*Amri Zinazopatikana:*
• *msaada* - Ona menu hii
• *salio* - Angalia credit zako
• *lipa* - Nunua credit zaidi
• *usajili* - Ona mipango ya usajili
• *stop* - Sitisha bot (kwa dakika 30)

*Jinsi ya kutumia AI:*
Andika tu swali lako au ujumbe wowote na AI itakujibu!

*Credit:*
Kila jibu la AI hutumia credit 1.
Unapata credit 5 za bure unapoanza.

Kwa msaada zaidi tuma ujumbe hapa.`
    },
  },
  {
    name: 'balance',
    aliases: ['salio', 'credits', 'bal'],
    description: 'Angalia salio lako',
    handler: async (socket, from, user) => {
      const status = user.subscription_active 
        ? '✅ Usajili Hai' 
        : `💰 Credit: ${user.credits}`

      return `📊 *Salio Lako*

${status}
${user.subscription_active ? `📅 Mpango: ${user.subscription_plan === 'monthly' ? 'Kila Mwezi' : 'Credit'}` : ''}
📱 Nambari: ${user.phone}
📨 Jumbe zilizotumwa: ${user.credits >= 0 ? 'Zinafanya kazi' : 'Zimezuiwa'}

${!user.subscription_active && user.credits < 3 ? '⚠️ Credit zako zinakaribia kuisha. Tuma "lipa" kupata zaidi.' : ''}`
    },
  },
  {
    name: 'pay',
    aliases: ['lipa', 'nunua', 'buy'],
    description: 'Nunua credit',
    handler: async () => {
      return `💳 *Nunua Credit*

*Bei za Credit:*
• 10 Credit = TZS 1,000
• 25 Credit = TZS 2,000
• 50 Credit = TZS 3,500
• 100 Credit = TZS 6,000

*Jinsi ya Kulipa:*
Jibu na kiasi unachotaka kulipa, mfano: *lipa 1000*

Malipo yatatumwa kupitia M-Pesa/Tigo Pesa/Airtel Money moja kwa moja kwenye simu yako.`
    },
  },
  {
    name: 'subscribe',
    aliases: ['usajili', 'subscribe', 'plan'],
    description: 'Ona mipango ya usajili',
    handler: async () => {
      return `📋 *Mipango ya Usajili*

*Bure (Sasa hivi):*
• Credit 5 za bure
• Ujumbe 5 kwa wiki

*Basic - TZS 5,000/mwezi:*
• Ujumbe 100 kwa mwezi
• Msaada wa haraka

*Premium - TZS 15,000/mwezi:*
• Ujumbe bila kikomo
• Msaada wa haraka
• Vipengele vya ziada

Jibu na *usajili basic* au *usajili premium* kuchagua mpango wako.`
    },
  },
  {
    name: 'stop',
    aliases: ['sitisha', 'pause'],
    description: 'Sitisha bot',
    handler: async () => {
      return `⏸️ *Bot Imesitishwa*

Bot haitakujibu kwa dakika 30.
Tuma "msaada" kuanza tena.`
    },
  },
]

export async function handleMessage(
  socket: WASocket,
  message: WAMessage
): Promise<void> {
  try {
    const from = message.key.remoteJid
    if (!from || from === 'status@broadcast') return

    // Get message content
    const messageContent = 
      message.message?.conversation ||
      message.message?.extendedTextMessage?.text ||
      ''

    if (!messageContent.trim()) return

    const phone = from.replace('@s.whatsapp.net', '')
    const pushName = message.pushName || null

    // Get or create user
    const user = await getOrCreateBotUser(phone, pushName || undefined)
    if (!user) {
      await socket.sendMessage(from, { 
        text: 'Samahani, kuna tatizo la muda. Tafadhali jaribu tena.' 
      })
      return
    }

    const text = messageContent.trim().toLowerCase()
    const args = text.split(/\s+/)
    const commandName = args[0]

    // Check for commands
    const command = commands.find(
      cmd => cmd.name === commandName || cmd.aliases.includes(commandName)
    )

    if (command) {
      const response = await command.handler(socket, from, user, args.slice(1))
      await socket.sendMessage(from, { text: response })
      await logActivity(phone, user.name, 'command', commandName, messageContent, response, user.id)
      return
    }

    // AI Chat
    const canChat = await canUserChat(user)
    if (!canChat.allowed) {
      await socket.sendMessage(from, { 
        text: canChat.reason || 'Salio lako limekwisha.' 
      })
      await logActivity(phone, user.name, 'system', undefined, messageContent, canChat.reason, user.id)
      return
    }

    // Show typing indicator
    await socket.sendPresenceUpdate('composing', from)

    // Generate AI response
    const aiResponse = await generateAIResponse(messageContent, [])
    
    // Deduct credit
    await deductCredit(user.id)

    // Send response
    await socket.sendPresenceUpdate('paused', from)
    await socket.sendMessage(from, { text: aiResponse })

    // Save and log
    await saveConversation(user.id, messageContent, aiResponse)
    await logActivity(phone, user.name, 'ai_chat', undefined, messageContent, aiResponse, user.id)

  } catch (error) {
    console.error('Error handling message:', error)
  }
}

export function setupMessageHandler(socket: WASocket): void {
  socket.ev.on('messages.upsert', async ({ messages }) => {
    for (const message of messages) {
      // Only handle incoming messages (not from us)
      if (!message.key.fromMe) {
        await handleMessage(socket, message)
      }
    }
  })
}
