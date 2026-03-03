// ============================================
// PeterAi - Type Definitions
// Powered by Peter Joram
// ============================================

export interface User {
  phone: string
  name: string
  credits: number
  subscription: {
    active: boolean
    plan: "credits" | "monthly" | "none"
    expiresAt: string | null
  }
  banned: boolean
  joinedAt: string
  lastActive: string
  totalMessages: number
  totalSpent: number
}

export interface Payment {
  id: string
  orderId: string
  phone: string
  amount: number
  currency: string
  status: "PENDING" | "COMPLETED" | "FAILED" | "CANCELLED"
  type: "credits" | "subscription"
  creditsAdded: number
  createdAt: string
  completedAt: string | null
  reference: string | null
}

export interface LogEntry {
  id: string
  phone: string
  userName: string
  command: string
  message: string
  response: string
  type: "command" | "ai_chat" | "payment" | "system" | "error"
  timestamp: string
}

export interface BotSettings {
  botName: string
  welcomeMessage: string
  aiSystemPrompt: string
  creditPrice: number
  creditsPerPack: number
  subscriptionPrice: number
  messageCreditCost: number
  imageCreditCost: number
  premiumGroupId: string
  botPhoneNumber: string
  currency: string
  maxMessageLength: number
  aiModel: string
  whatsappConnected: boolean
  whatsappPhone: string
  autoTypingEnabled: boolean
  autoReactionEnabled: boolean
}

// Baileys Message Types (simplified for bot handler)
export interface BaileysMessage {
  id: string
  chatId: string
  from: string
  fromName: string
  fromMe: boolean
  text?: string
  image?: {
    caption?: string
    url?: string
  }
  video?: {
    caption?: string
    url?: string
  }
  audio?: {
    url?: string
  }
  document?: {
    filename?: string
    url?: string
  }
  quotedMessage?: {
    id: string
    text?: string
  }
  timestamp: number
}

// PeterPay Types
export interface PeterPayCreateOrderRequest {
  amount: number
  buyer_name: string
  buyer_phone: string
  buyer_email: string
  description: string
  webhook_url: string
  redirect_url: string
}

export interface PeterPayCreateOrderResponse {
  status: boolean
  message: string
  order_id: string
  payment_url: string
}

export interface PeterPayDirectPayRequest {
  order_id: string
  phone: string
  provider: "Mpesa" | "TigoPesa" | "Airtel" | "Halopesa"
}

export interface PeterPayDirectPayResponse {
  status: boolean
  message: string
}

export interface PeterPayWebhookPayload {
  order_id: string
  status: string
  amount: string
  buyer_name: string
  buyer_phone: string
  buyer_email: string
  reference: string
  paid_at: string
}

export interface PeterPayStatusResponse {
  status: boolean
  message: string
  data: {
    order_id: string
    amount: string
    status: string
    buyer_name: string
    buyer_phone: string
    reference: string | null
    paid_at: string | null
  }
}

// Dashboard Types
export interface DashboardStats {
  totalUsers: number
  activeSubscriptions: number
  totalRevenue: number
  messagesToday: number
  messagesThisWeek: number
  revenueThisMonth: number
  pendingPayments: number
  bannedUsers: number
  popularCommands: { command: string; count: number }[]
  recentActivity: LogEntry[]
  dailyMessages: { date: string; count: number }[]
  monthlyRevenue: { month: string; amount: number }[]
}

export interface AdminSession {
  authenticated: boolean
  expiresAt: number
}
