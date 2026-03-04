// ============================================
// PeterAi - Main Bot Handler / Dispatcher
// ============================================

import type { WhapiMessage } from "./types"
import {
  getUser,
  saveUser,
  createNewUser,
  getSettings,
  saveLog,
  createLogEntry,
  canUseBot,
  isSubscriptionActive,
} from "./storage"
import { sendText, sendImage, sendDocument, extractPhone, sendTypingPresence } from "./whapi"
import { generateResponse } from "./groq"
import { getHelpMessage } from "./commands/help"
import { handleAiCommand } from "./commands/ai"
import { handlePayCommand } from "./commands/pay"
import { handleBalanceCommand } from "./commands/balance"
import { handleJoinCommand } from "./commands/join"
import { handleImageCommand } from "./commands/image"
import { handleDownloadCommand } from "./commands/download"
import { handleStatusCommand } from "./commands/status"
import { analyzeAndReact } from "./commands/auto-reaction"

function getWebhookBaseUrl(): string {
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL
  }
  return "http://localhost:3000"
}

export async function handleIncomingMessage(
  message: WhapiMessage
): Promise<void> {
  // Skip outgoing messages
  if (message.from_me) return

  // Skip group messages (optional: can be enabled later)
  const chatId = message.chat_id
  if (chatId.endsWith("@g.us")) return

  const phone = extractPhone(message.from)
  const messageText = message.text?.body?.trim() || ""
  const fromName = message.from_name || phone

  if (!messageText && !message.image && !message.video && !message.audio) {
    return // Skip empty messages
  }

  // Get or create user
  let user = await getUser(phone)
  if (!user) {
    user = createNewUser(phone, fromName)
    await saveUser(user)

    // Send welcome message
    const settings = await getSettings()
    await sendText(chatId, settings.welcomeMessage)
    await saveLog(
      createLogEntry(phone, fromName, "system", "New user joined", settings.welcomeMessage, "system")
    )
  }

  // Check if user is banned
  if (user.banned) {
    await sendText(chatId, "Akaunti yako imezuiwa. Wasiliana na admin kwa msaada.")
    return
  }

  // Update last active
  user.lastActive = new Date().toISOString()
  user.name = fromName // Update name in case it changed

  let responseText = ""
  let command = ""
  const settings = await getSettings()

  try {
    // Auto-typing: send typing presence before processing
    if (settings.autoTypingEnabled) {
      sendTypingPresence(chatId).catch(() => {})
    }

    // Auto-reaction: analyze incoming message and react (async, non-blocking)
    if (settings.autoReactionEnabled && messageText) {
      analyzeAndReact(message.id, messageText, chatId).catch(() => {})
    }

    // Parse command
    if (messageText.startsWith("/")) {
      const parts = messageText.split(/\s+/)
      command = parts[0].toLowerCase()
      const args = messageText.slice(command.length).trim()

      switch (command) {
        case "/help": {
          responseText = getHelpMessage(settings, user)
          break
        }

        case "/ai": {
          const result = await handleAiCommand(user, args)
          responseText = result.response
          user = result.user
          break
        }

        case "/pay": {
          const baseUrl = getWebhookBaseUrl()
          const result = await handlePayCommand(user, args, baseUrl)
          responseText = result.response
          user = result.user
          break
        }

        case "/balance": {
          const result = await handleBalanceCommand(user)
          responseText = result.response
          break
        }

        case "/join": {
          const result = await handleJoinCommand(user)
          responseText = result.response
          break
        }

        case "/image": {
          const result = await handleImageCommand(user, args)
          responseText = result.response
          user = result.user

          // Send image if generated
          if (result.imageUrl) {
            await sendImage(chatId, result.imageUrl, responseText)
            await saveUser(user)
            await saveLog(
              createLogEntry(phone, fromName, command, messageText, "Image sent", "command")
            )
            return // Already sent image with caption
          }
          break
        }

        case "/download": {
          const result = await handleDownloadCommand(message)
          responseText = result.response

          if (result.mediaUrl && result.filename) {
            await sendDocument(chatId, result.mediaUrl, result.filename, responseText)
            await saveLog(
              createLogEntry(phone, fromName, command, messageText, "Media downloaded", "command")
            )
            return
          }
          break
        }

        case "/status": {
          const result = await handleStatusCommand(message, args)
          responseText = result.response
          break
        }

        default: {
          responseText = `Command "${command}" haijulikani. Tumia /help kuona commands zote.`
          break
        }
      }
    } else {
      // AI chat mode (no command prefix)
      command = "ai_chat"
      const cost = settings.messageCreditCost

      if (!canUseBot(user, cost)) {
        responseText = `Credits zako zimeisha!\n\nSalio: ${user.credits} credits\n\nTumia /pay ${settings.creditPrice} kununua credits ${settings.creditsPerPack}\nAu /pay ${settings.subscriptionPrice} kwa subscription.`
      } else {
        try {
          responseText = await generateResponse(
            messageText,
            settings.aiSystemPrompt,
            settings.aiModel
          )

          if (!isSubscriptionActive(user)) {
            user.credits -= cost
          }
          user.totalMessages += 1
        } catch {
          responseText = "Samahani, kuna tatizo la muda. Tafadhali jaribu tena."
        }
      }
    }

    // Send response
    if (responseText) {
      // Split long messages
      if (responseText.length > 4096) {
        const chunks = splitMessage(responseText, 4000)
        for (const chunk of chunks) {
          await sendText(chatId, chunk)
        }
      } else {
        await sendText(chatId, responseText)
      }
    }

    // Save user and log
    await saveUser(user)
    await saveLog(
      createLogEntry(
        phone,
        fromName,
        command,
        messageText,
        responseText.slice(0, 500),
        command === "ai_chat" ? "ai_chat" : "command"
      )
    )
  } catch (error) {
    console.error("Bot handler error:", error)

    try {
      await sendText(
        chatId,
        "Samahani, kuna tatizo la muda. Tafadhali jaribu tena baadaye."
      )
      await saveLog(
        createLogEntry(
          phone,
          fromName,
          command,
          messageText,
          `Error: ${error instanceof Error ? error.message : "Unknown"}`,
          "error"
        )
      )
    } catch {
      // Final fallback - just log
      console.error("Failed to send error message")
    }
  }
}

function splitMessage(text: string, maxLength: number): string[] {
  const chunks: string[] = []
  let remaining = text

  while (remaining.length > 0) {
    if (remaining.length <= maxLength) {
      chunks.push(remaining)
      break
    }

    // Try to split at a newline
    let splitIndex = remaining.lastIndexOf("\n", maxLength)
    if (splitIndex === -1 || splitIndex < maxLength / 2) {
      // Try to split at a space
      splitIndex = remaining.lastIndexOf(" ", maxLength)
    }
    if (splitIndex === -1 || splitIndex < maxLength / 2) {
      splitIndex = maxLength
    }

    chunks.push(remaining.slice(0, splitIndex))
    remaining = remaining.slice(splitIndex).trimStart()
  }

  return chunks
}
