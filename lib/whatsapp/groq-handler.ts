import { generateText } from 'ai'
import { createGroq } from '@ai-sdk/groq'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
})

const SYSTEM_PROMPT = `Wewe ni PeterAi, msaidizi wa AI anayesaidia kupitia WhatsApp. 
Jibu kwa Kiswahili kwa ufupi na kwa uwazi.
Wewe ni msaada, mwenye hekima, na unapenda kusaidia watu.
Usizidi maneno 200 kwa jibu moja isipokuwa uombwe zaidi.`

export interface BotUser {
  id: string
  phone: string
  name: string | null
  credits: number
  subscription_active: boolean
  subscription_plan: string
}

export async function getOrCreateBotUser(phone: string, name?: string): Promise<BotUser | null> {
  try {
    // Try to find existing user
    const { data: existingUser } = await supabase
      .from('bot_users')
      .select('*')
      .eq('phone', phone)
      .single()

    if (existingUser) {
      // Update last active
      await supabase
        .from('bot_users')
        .update({ last_active: new Date().toISOString() })
        .eq('id', existingUser.id)
      
      return existingUser as BotUser
    }

    // Create new user with 5 free credits
    const { data: newUser, error } = await supabase
      .from('bot_users')
      .insert({
        phone,
        name: name || null,
        credits: 5,
        subscription_active: false,
        subscription_plan: 'none',
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating bot user:', error)
      return null
    }

    return newUser as BotUser
  } catch (error) {
    console.error('Error in getOrCreateBotUser:', error)
    return null
  }
}

export async function canUserChat(user: BotUser): Promise<{ allowed: boolean; reason?: string }> {
  if (user.subscription_active) {
    return { allowed: true }
  }

  if (user.credits > 0) {
    return { allowed: true }
  }

  return { 
    allowed: false, 
    reason: 'Salio lako limekwisha. Tuma "lipa" kupata credit zaidi au "usajili" kwa usajili wa kila mwezi.'
  }
}

export async function deductCredit(userId: string): Promise<boolean> {
  try {
    const { data: user } = await supabase
      .from('bot_users')
      .select('credits, subscription_active, total_messages')
      .eq('id', userId)
      .single()

    if (!user) return false

    // Don't deduct if on active subscription
    if (user.subscription_active) return true

    if (user.credits <= 0) return false

    // Deduct credit and increment total messages
    const { error } = await supabase
      .from('bot_users')
      .update({ 
        credits: user.credits - 1,
        total_messages: (user.total_messages || 0) + 1
      })
      .eq('id', userId)

    if (error) {
      console.error('Error updating credits:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error deducting credit:', error)
    return false
  }
}

export async function generateAIResponse(
  message: string, 
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<string> {
  try {
    const messages = [
      { role: 'system' as const, content: SYSTEM_PROMPT },
      ...conversationHistory.slice(-10).map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      { role: 'user' as const, content: message },
    ]

    const { text } = await generateText({
      model: groq('llama-3.3-70b-versatile'),
      messages,
      maxTokens: 500,
    })

    return text
  } catch (error) {
    console.error('Error generating AI response:', error)
    return 'Samahani, kuna tatizo la muda. Tafadhali jaribu tena baadaye.'
  }
}

export async function saveConversation(
  botUserId: string,
  userMessage: string,
  assistantResponse: string
): Promise<void> {
  try {
    // Get or create conversation
    let { data: conversation } = await supabase
      .from('conversations')
      .select('id')
      .eq('bot_user_id', botUserId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!conversation) {
      const { data: newConv } = await supabase
        .from('conversations')
        .insert({
          bot_user_id: botUserId,
          title: userMessage.slice(0, 50),
        })
        .select()
        .single()
      
      conversation = newConv
    }

    if (conversation) {
      // Save messages
      await supabase.from('messages').insert([
        {
          conversation_id: conversation.id,
          role: 'user',
          content: userMessage,
        },
        {
          conversation_id: conversation.id,
          role: 'assistant',
          content: assistantResponse,
        },
      ])

      // Update conversation
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversation.id)
    }
  } catch (error) {
    console.error('Error saving conversation:', error)
  }
}

export async function logActivity(
  phone: string,
  userName: string | null,
  type: 'command' | 'ai_chat' | 'payment' | 'system' | 'error',
  command?: string,
  message?: string,
  response?: string,
  botUserId?: string
): Promise<void> {
  try {
    await supabase.from('logs').insert({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      phone,
      user_name: userName,
      type,
      command,
      message,
      response,
      bot_user_id: botUserId,
    })
  } catch (error) {
    console.error('Error logging activity:', error)
  }
}
