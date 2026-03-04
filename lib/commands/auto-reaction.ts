// ============================================
// PeterAi - Smart Auto-Reaction System
// ============================================
// Analyzes incoming message content via Groq AI
// and reacts with a contextually appropriate emoji.
// Includes a randomness factor so it doesn't react to every message.

import { generateResponse } from "../groq"
import { reactToMessage } from "../whapi"

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

const REACT_PROBABILITY = 0.6 // 60% chance to react

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export async function analyzeAndReact(
  messageId: string,
  messageText: string,
  chatId?: string
): Promise<void> {
  // Randomness gate: skip ~40% of messages
  if (Math.random() > REACT_PROBABILITY) return

  // Skip very short messages or commands
  if (!messageText || messageText.length < 3 || messageText.startsWith("/")) return

  try {
    const classification = await generateResponse(
      `Classify the sentiment/tone of this message into EXACTLY one of these categories: funny, happy, sad, question, greeting, gratitude, angry, neutral.\n\nMessage: "${messageText}"\n\nRespond with ONLY the category word, nothing else.`,
      "You are a sentiment classifier. Respond with exactly one word from the given categories. No explanations.",
      "llama-3.3-70b-versatile"
    )

    const category = classification.trim().toLowerCase().replace(/[^a-z]/g, "")
    const emojis = REACTION_MAP[category] || REACTION_MAP.neutral

    if (emojis.length === 0) return // Don't react to neutral messages

    // For questions, only react 30% of the time
    if (category === "question" && Math.random() > 0.3) return

    const emoji = pickRandom(emojis)
    await reactToMessage(messageId, emoji, chatId)
  } catch (err) {
    // Silently fail - reactions are non-critical
    console.error("Auto-reaction error:", err)
  }
}
