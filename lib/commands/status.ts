// ============================================
// /status like|comment - React to WhatsApp status
// Powered by Peter Joram
// ============================================

import { reactToMessage, sendText } from "../baileys"
import type { BaileysMessage } from "../types"

export async function handleStatusCommand(
  message: BaileysMessage,
  args: string
): Promise<{ response: string }> {
  const parts = args.trim().split(/\s+/)
  const action = parts[0]?.toLowerCase()

  if (!action) {
    return {
      response: `*Status Commands:*\n\n/status like - Penda status (reply kwa status)\n/status comment <maandishi> - Andika comment kwenye status\n\n_Jibu (reply) status unayotaka ku-react na andika command._`,
    }
  }

  const contextId = message.quotedMessage?.id

  switch (action) {
    case "like": {
      if (!contextId) {
        return {
          response:
            "Tafadhali jibu (reply) status unayotaka ku-like na andika /status like",
        }
      }

      try {
        await reactToMessage(message.chatId, contextId, "\u2764\uFE0F")
        return {
          response: "Umefanikiwa ku-like status!",
        }
      } catch (error) {
        console.error("Status like error:", error)
        return {
          response: "Samahani, kuna tatizo la ku-like status. Jaribu tena.",
        }
      }
    }

    case "comment": {
      const commentText = parts.slice(1).join(" ")
      if (!commentText) {
        return {
          response:
            "Tafadhali andika comment yako.\n\nMfano: /status comment Picha nzuri sana!",
        }
      }

      if (!contextId) {
        return {
          response:
            "Tafadhali jibu (reply) status unayotaka ku-comment na andika /status comment <maandishi>",
        }
      }

      try {
        await sendText(message.from, commentText)
        return {
          response: "Comment yako imetumwa!",
        }
      } catch (error) {
        console.error("Status comment error:", error)
        return {
          response: "Samahani, kuna tatizo la kutuma comment. Jaribu tena.",
        }
      }
    }

    default:
      return {
        response: `Command "${action}" haijulikani.\n\nTumia:\n/status like - Penda status\n/status comment <maandishi> - Andika comment`,
      }
  }
}
