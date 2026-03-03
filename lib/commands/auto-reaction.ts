// ============================================
// PeterAi - Smart Auto-Reaction System
// Powered by Peter Joram
// ============================================

import { generateResponse } from "../groq"
import { reactToMessage } from "../baileys"

const REACTION_MAP: Record<string, string[]> = {
  funny: ["😂", "🤣", "😆"],
  happy: ["👍", "❤️", "🔥", "💯"],
  sad: ["😢", "🙏", "💙"],
  question: ["🤔"],
  greeting: ["👋", "😊"],
  gratitude: ["❤️", "🙏", "💯"],
  angry: ["😮", "🙏"],
  neutral: [],
}

const REACT_PROBABILITY = 0.6

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export async function analyzeAndReact(
  messageId: string,
  messageText: string,
  chatId: string
): Promise<void> {
  if (Math.random() > REACT_PROBABILITY) return
  if (!messageText || messageText.length < 3 || messageText.startsWith("/")) return

  try {
    const classification = await generateResponse(
      `Classify the sentiment/tone of this message into EXACTLY one of these categories: funny, happy, sad, question, greeting, gratitude, angry, neutral.\n\nMessage: "${messageText}"\n\nRespond with ONLY the category word, nothing else.`,
      "You are a sentiment classifier. Respond with exactly one word from the given categories. No explanations.",
      "llama-3.3-70b-versatile"
    )

    const category = classification.trim().toLowerCase().replace(/[^a-z]/g, "")
    const emojis = REACTION_MAP[category] || REACTION_MAP.neutral

    if (emojis.length === 0) return
    if (category === "question" && Math.random() > 0.3) return

    const emoji = pickRandom(emojis)
    await reactToMessage(chatId, messageId, emoji)
  } catch (err) {
    console.error("Auto-reaction error:", err)
  }
}
