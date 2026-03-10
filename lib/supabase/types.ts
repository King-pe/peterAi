export type UserRole = 'user' | 'admin'

export interface Profile {
  id: string
  email: string | null
  full_name: string | null
  role: UserRole
  phone: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface BotUser {
  id: string
  phone: string
  name: string | null
  credits: number
  subscription_active: boolean
  subscription_plan: 'credits' | 'monthly' | 'none'
  subscription_expires_at: string | null
  banned: boolean
  joined_at: string
  last_active: string
  total_messages: number
  total_spent: number
  linked_profile_id: string | null
}

export interface Payment {
  id: string
  order_id: string
  phone: string
  amount: number
  currency: string
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'
  type: 'credits' | 'subscription'
  credits_added: number
  reference: string | null
  created_at: string
  updated_at: string
  completed_at: string | null
  bot_user_id: string | null
}

export interface Log {
  id: string
  phone: string | null
  user_name: string | null
  command: string | null
  message: string | null
  response: string | null
  type: 'command' | 'ai_chat' | 'payment' | 'system' | 'error'
  timestamp: string
  bot_user_id: string | null
}

export interface Setting {
  key: string
  value: string
  updated_at: string
}

export interface Conversation {
  id: string
  bot_user_id: string
  title: string | null
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  conversation_id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  created_at: string
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at' | 'updated_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>
      }
      bot_users: {
        Row: BotUser
        Insert: Omit<BotUser, 'id' | 'joined_at' | 'last_active' | 'total_messages' | 'total_spent'>
        Update: Partial<Omit<BotUser, 'id' | 'joined_at'>>
      }
      payments: {
        Row: Payment
        Insert: Omit<Payment, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Payment, 'id' | 'created_at'>>
      }
      logs: {
        Row: Log
        Insert: Omit<Log, 'timestamp'>
        Update: Partial<Log>
      }
      settings: {
        Row: Setting
        Insert: Omit<Setting, 'updated_at'>
        Update: Partial<Omit<Setting, 'key' | 'updated_at'>>
      }
      conversations: {
        Row: Conversation
        Insert: Omit<Conversation, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Conversation, 'id' | 'created_at'>>
      }
      messages: {
        Row: Message
        Insert: Omit<Message, 'id' | 'created_at'>
        Update: Partial<Omit<Message, 'id' | 'created_at'>>
      }
    }
  }
}
