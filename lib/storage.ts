
// ============================================
// PeterAi - PostgreSQL Database Storage
// ============================================

import type { User, Payment, LogEntry, BotSettings } from "./types";
import { query, getUser as dbGetUser, getUsers as dbGetUsers, saveUser as dbSaveUser, updateUser as dbUpdateUser, deleteUser as dbDeleteUser } from "./db";
import { getPayments as dbGetPayments, getPayment as dbGetPayment, savePayment as dbSavePayment, updatePayment as dbUpdatePayment } from "./db";
import { getLogs as dbGetLogs, saveLog as dbSaveLog } from "./db";
import { getSettings as dbGetSettings, saveSettings as dbSaveSettings } from "./db";

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
  baileysConnected: false,
  baileysPhone: "",
  autoTypingEnabled: true,
  autoReactionEnabled: true,
};

// ---- Users ----
export async function getUsers(): Promise<User[]> {
  return dbGetUsers();
}

export async function getUser(phone: string): Promise<User | null> {
  return dbGetUser(phone);
}

export async function saveUser(user: User): Promise<void> {
  return dbSaveUser(user);
}

export async function updateUser(
  phone: string,
  updates: Partial<User>
): Promise<User | null> {
  return dbUpdateUser(phone, updates);
}

export async function deleteUser(phone: string): Promise<boolean> {
  return dbDeleteUser(phone);
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
  };
}

// ---- Payments ----
export async function getPayments(): Promise<Payment[]> {
  return dbGetPayments();
}

export async function getPayment(orderId: string): Promise<Payment | null> {
  return dbGetPayment(orderId);
}

export async function savePayment(payment: Payment): Promise<void> {
  return dbSavePayment(payment);
}

export async function updatePayment(
  orderId: string,
  updates: Partial<Payment>
): Promise<Payment | null> {
  return dbUpdatePayment(orderId, updates);
}

// ---- Logs ----
export async function getLogs(): Promise<LogEntry[]> {
  return dbGetLogs();
}

export async function saveLog(log: LogEntry): Promise<void> {
  return dbSaveLog(log);
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
  };
}

// ---- Settings ----
export async function getSettings(): Promise<BotSettings> {
  return dbGetSettings();
}

export async function saveSettings(
  settings: Partial<BotSettings>
): Promise<BotSettings> {
  return dbSaveSettings(settings);
}

// ---- Utility: Check Subscription ----
export function isSubscriptionActive(user: User): boolean {
  if (!user.subscription.active) return false;
  if (!user.subscription.expiresAt) return false;
  return new Date(user.subscription.expiresAt) > new Date();
}

export function hasCredits(user: User, cost: number = 1): boolean {
  return user.credits >= cost;
}

export function canUseBot(user: User, creditCost: number = 1): boolean {
  return isSubscriptionActive(user) || hasCredits(user, creditCost);
}
