// ============================================
// PeterAi - Groq AI Client
// ============================================

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

function getApiKey(): string {
  const key = process.env.GROQ_API_KEY
  if (!key) throw new Error("GROQ_API_KEY is not set")
  return key
}

export async function generateResponse(
  prompt: string,
  systemPrompt: string = "Wewe ni PeterAi, msaidizi wa AI anayezungumza Kiswahili na Kiingereza. Jibu kwa ufupi na kwa usahihi. Kuwa wa kirafiki na msaidizi.",
  model: string = "llama-3.3-70b-versatile"
): Promise<string> {
  const res = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      max_tokens: 1024,
      temperature: 0.7,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    console.error(`Groq API error [${res.status}]: ${text}`)
    throw new Error(`Groq API error: ${res.status}`)
  }

  const data = (await res.json()) as {
    choices: { message: { content: string } }[]
  }
  return data.choices[0]?.message?.content || "Samahani, sijaweza kujibu."
}

export async function generateImagePrompt(
  userPrompt: string
): Promise<string> {
  return generateResponse(
    `Create a detailed, descriptive prompt for AI image generation based on this request: "${userPrompt}". Return ONLY the image prompt, nothing else. Make it descriptive and detailed for best image quality.`,
    "You are an expert at creating detailed image generation prompts. Return only the prompt text, no explanations.",
    "llama-3.3-70b-versatile"
  )
}

export async function analyzeImage(
  imageUrl: string,
  question: string = "Eleza picha hii kwa Kiswahili."
): Promise<string> {
  const res = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.2-90b-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: question },
            { type: "image_url", image_url: { url: imageUrl } },
          ],
        },
      ],
      max_tokens: 1024,
      temperature: 0.7,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    console.error(`Groq Vision error [${res.status}]: ${text}`)
    throw new Error(`Groq Vision error: ${res.status}`)
  }

  const data = (await res.json()) as {
    choices: { message: { content: string } }[]
  }
  return data.choices[0]?.message?.content || "Samahani, sijaweza kueleza picha."
}
