// ============================================
// /ai <question> - Ask AI a question
// ============================================

import { generateResponse } from "../groq"
import { getSettings, saveUser, canUseBot, isSubscriptionActive } from "../storage"
import type { User } from "../types"

export async function handleAiCommand(
  user: User,
  question: string
): Promise<{ response: string; user: User }> {
  const settings = await getSettings()

  if (!question.trim()) {
    return {
      response: "Tafadhali andika swali lako baada ya /ai\n\nMfano: /ai Eleza jinsi blockchain inavyofanya kazi",
      user,
    }
  }

  const cost = settings.messageCreditCost
  if (!canUseBot(user, cost)) {
    return {
      response: `Huna credits za kutosha! Unahitaji credit ${cost}.\n\nSalio lako: ${user.credits} credits\n\nTumia /pay ${settings.creditPrice} kununua credits ${settings.creditsPerPack}\nAu /pay ${settings.subscriptionPrice} kwa subscription ya mwezi mzima.`,
      user,
    }
  }

  try {
    const aiResponse = await generateResponse(
      question,
      settings.aiSystemPrompt,
      settings.aiModel
    )

    // Deduct credits only if not on active subscription
    if (!isSubscriptionActive(user)) {
      user.credits -= cost
    }
    user.totalMessages += 1
    user.lastActive = new Date().toISOString()
    await saveUser(user)

    return { response: aiResponse, user }
  } catch (error) {
    console.error("AI command error:", error)
    return {
      response: "Samahani, kuna tatizo la muda na AI. Tafadhali jaribu tena baadaye.",
      user,
    }
  }
}
