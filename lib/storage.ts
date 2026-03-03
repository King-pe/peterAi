// ============================================
// PeterAi - JSON File-Based Storage
// ============================================

import { promises as fs } from "fs"
import path from "path"
import type { User, Payment, LogEntry, BotSettings } from "./types"

const DATA_DIR = path.join(process.cwd(), "data")

const DEFAULT_SETTINGS: BotSettings = {
  botName: "PeterAi",
  welcomeMessage:
    "Karibu PeterAi! Mimi ni bot yako ya AI yenye nguvu. Tumia /help kuona commands zote zinazopatikana.",
  aiSystemPrompt:
    "Wewe ni PeterAi, msaidizi wa AI anayezungumza Kiswahili na Kiingereza. Jibu kwa ufupi na kwa usahihi. Kuwa wa kirafiki na msaidizi.",
  creditPrice: 1000,
  creditsPerPack: 50,
  subscriptionPrice: 5000,
  messageCreditCost: 1,
  imageCreditCost: 3,
  premiumGroupId: "",
  botPhoneNumber: "",
  currency: "TZS",
  maxMessageLength: 4096,
  aiModel: "llama-3.3-70b-versatile",
  whapiToken: "",
  whapiConnected: false,
  whapiPhone: "",
}

async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR)
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true })
  }
}

async function readJsonFile<T>(filename: string, defaultValue: T): Promise<T> {
  await ensureDataDir()
  const filePath = path.join(DATA_DIR, filename)
  try {
    const data = await fs.readFile(filePath, "utf-8")
    return JSON.parse(data) as T
  } catch {
    await fs.writeFile(filePath, JSON.stringify(defaultValue, null, 2))
    return defaultValue
  }
}

async function writeJsonFile<T>(filename: string, data: T): Promise<void> {
  await ensureDataDir()
  const filePath = path.join(DATA_DIR, filename)
  await fs.writeFile(filePath, JSON.stringify(data, null, 2))
}

// ---- Users ----
export async function getUsers(): Promise<User[]> {
  return readJsonFile<User[]>("users.json", [])
}

export async function getUser(phone: string): Promise<User | null> {
  const users = await getUsers()
  return users.find((u) => u.phone === phone) || null
}

export async function saveUser(user: User): Promise<void> {
  const users = await getUsers()
  const index = users.findIndex((u) => u.phone === user.phone)
  if (index >= 0) {
    users[index] = user
  } else {
    users.push(user)
  }
  await writeJsonFile("users.json", users)
}

export async function updateUser(
  phone: string,
  updates: Partial<User>
): Promise<User | null> {
  const users = await getUsers()
  const index = users.findIndex((u) => u.phone === phone)
  if (index < 0) return null
  users[index] = { ...users[index], ...updates }
  await writeJsonFile("users.json", users)
  return users[index]
}

export async function deleteUser(phone: string): Promise<boolean> {
  const users = await getUsers()
  const filtered = users.filter((u) => u.phone !== phone)
  if (filtered.length === users.length) return false
  await writeJsonFile("users.json", filtered)
  return true
}

export function createNewUser(phone: string, name: string): User {
  return {
    phone,
    name,
    credits: 5, // free starter credits
    subscription: { active: false, plan: "none", expiresAt: null },
    banned: false,
    joinedAt: new Date().toISOString(),
    lastActive: new Date().toISOString(),
    totalMessages: 0,
    totalSpent: 0,
  }
}

// ---- Payments ----
export async function getPayments(): Promise<Payment[]> {
  return readJsonFile<Payment[]>("payments.json", [])
}

export async function getPayment(orderId: string): Promise<Payment | null> {
  const payments = await getPayments()
  return payments.find((p) => p.orderId === orderId) || null
}

export async function savePayment(payment: Payment): Promise<void> {
  const payments = await getPayments()
  const index = payments.findIndex((p) => p.orderId === payment.orderId)
  if (index >= 0) {
    payments[index] = payment
  } else {
    payments.push(payment)
  }
  await writeJsonFile("payments.json", payments)
}

export async function updatePayment(
  orderId: string,
  updates: Partial<Payment>
): Promise<Payment | null> {
  const payments = await getPayments()
  const index = payments.findIndex((p) => p.orderId === orderId)
  if (index < 0) return null
  payments[index] = { ...payments[index], ...updates }
  await writeJsonFile("payments.json", payments)
  return payments[index]
}

// ---- Logs ----
export async function getLogs(): Promise<LogEntry[]> {
  return readJsonFile<LogEntry[]>("logs.json", [])
}

export async function saveLog(log: LogEntry): Promise<void> {
  const logs = await getLogs()
  logs.unshift(log) // newest first
  // Keep only last 10000 logs
  if (logs.length > 10000) {
    logs.length = 10000
  }
  await writeJsonFile("logs.json", logs)
}

export function createLogEntry(
  phone: string,
  userName: string,
  command: string,
  message: string,
  response: string,
  type: LogEntry["type"] = "command"
): LogEntry {
  return {
    id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    phone,
    userName,
    command,
    message,
    response,
    type,
    timestamp: new Date().toISOString(),
  }
}

// ---- Settings ----
export async function getSettings(): Promise<BotSettings> {
  return readJsonFile<BotSettings>("settings.json", DEFAULT_SETTINGS)
}

export async function saveSettings(
  settings: Partial<BotSettings>
): Promise<BotSettings> {
  const current = await getSettings()
  const updated = { ...current, ...settings }
  await writeJsonFile("settings.json", updated)
  return updated
}

// ---- Utility: Check Subscription ----
export function isSubscriptionActive(user: User): boolean {
  if (!user.subscription.active) return false
  if (!user.subscription.expiresAt) return false
  return new Date(user.subscription.expiresAt) > new Date()
}

export function hasCredits(user: User, cost: number = 1): boolean {
  return user.credits >= cost
}

export function canUseBot(user: User, creditCost: number = 1): boolean {
  return isSubscriptionActive(user) || hasCredits(user, creditCost)
}
