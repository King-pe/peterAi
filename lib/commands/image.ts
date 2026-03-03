// ============================================
// /image <prompt> - Generate AI image
// ============================================

import { generateImagePrompt } from "../groq"
import { getSettings, saveUser, canUseBot, isSubscriptionActive } from "../storage"
import type { User } from "../types"

const FAL_API_URL = "https://queue.fal.run/fal-ai/fast-sdxl"

async function generateImageWithFal(prompt: string): Promise<string | null> {
  const apiKey = process.env.FAL_API_KEY
  if (!apiKey) {
    console.error("FAL_API_KEY not set")
    return null
  }

  try {
    const res = await fetch(FAL_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Key ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        image_size: "square_hd",
        num_inference_steps: 25,
        num_images: 1,
      }),
    })

    if (!res.ok) {
      console.error("Fal API error:", await res.text())
      return null
    }

    const data = (await res.json()) as {
      images?: { url: string }[]
    }

    return data.images?.[0]?.url || null
  } catch (error) {
    console.error("Image generation error:", error)
    return null
  }
}

export async function handleImageCommand(
  user: User,
  prompt: string
): Promise<{ response: string; imageUrl?: string; user: User }> {
  const settings = await getSettings()

  if (!prompt.trim()) {
    return {
      response: "Tafadhali eleza picha unayotaka kutengeneza.\n\nMfano: /image Simba anayekimbia kwenye savanna wakati wa jua la kutua",
      user,
    }
  }

  const cost = settings.imageCreditCost
  if (!canUseBot(user, cost)) {
    return {
      response: `Huna credits za kutosha! Picha inahitaji credits ${cost}.\n\nSalio lako: ${user.credits} credits\n\nTumia /pay ${settings.creditPrice} kununua credits.`,
      user,
    }
  }

  try {
    // Enhance prompt with AI
    const enhancedPrompt = await generateImagePrompt(prompt)

    // Generate image
    const imageUrl = await generateImageWithFal(enhancedPrompt)

    if (!imageUrl) {
      return {
        response: "Samahani, kuna tatizo la kutengeneza picha. Tafadhali jaribu tena.",
        user,
      }
    }

    // Deduct credits
    if (!isSubscriptionActive(user)) {
      user.credits -= cost
    }
    user.totalMessages += 1
    user.lastActive = new Date().toISOString()
    await saveUser(user)

    return {
      response: `Picha imetengenezwa! (Credits zilizobaki: ${user.credits})`,
      imageUrl,
      user,
    }
  } catch (error) {
    console.error("Image command error:", error)
    return {
      response: "Samahani, kuna tatizo la kutengeneza picha. Tafadhali jaribu tena baadaye.",
      user,
    }
  }
}
