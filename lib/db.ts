
import { Pool } from 'pg';
import type { User, Payment, LogEntry, BotSettings } from "./types";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function query(text: string, params?: any[]) {
  const client = await pool.connect();
  try {
    const res = await client.query(text, params);
    return res;
  } finally {
    client.release();
  }
}

// ---- Users ----
export async function getUsers(): Promise<User[]> {
  const res = await query('SELECT * FROM users');
  return res.rows.map(row => ({
    phone: row.phone,
    name: row.name,
    credits: row.credits,
    subscription: {
      active: row.subscription_active,
      plan: row.subscription_plan,
      expiresAt: row.subscription_expires_at ? new Date(row.subscription_expires_at).toISOString() : null,
    },
    banned: row.banned,
    joinedAt: new Date(row.joined_at).toISOString(),
    lastActive: new Date(row.last_active).toISOString(),
    totalMessages: row.total_messages,
    totalSpent: row.total_spent,
  }));
}

export async function getUser(phone: string): Promise<User | null> {
  const res = await query('SELECT * FROM users WHERE phone = $1', [phone]);
  if (res.rows.length === 0) return null;
  const row = res.rows[0];
  return {
    phone: row.phone,
    name: row.name,
    credits: row.credits,
    subscription: {
      active: row.subscription_active,
      plan: row.subscription_plan,
      expiresAt: row.subscription_expires_at ? new Date(row.subscription_expires_at).toISOString() : null,
    },
    banned: row.banned,
    joinedAt: new Date(row.joined_at).toISOString(),
    lastActive: new Date(row.last_active).toISOString(),
    totalMessages: row.total_messages,
    totalSpent: row.total_spent,
  };
}

export async function saveUser(user: User): Promise<void> {
  const existingUser = await getUser(user.phone);
  if (existingUser) {
    await query(
      `UPDATE users SET name = $1, credits = $2, subscription_active = $3, subscription_plan = $4, subscription_expires_at = $5, banned = $6, last_active = $7, total_messages = $8, total_spent = $9 WHERE phone = $10`,
      [
        user.name,
        user.credits,
        user.subscription.active,
        user.subscription.plan,
        user.subscription.expiresAt ? new Date(user.subscription.expiresAt) : null,
        user.banned,
        new Date(user.lastActive),
        user.totalMessages,
        user.totalSpent,
        user.phone,
      ]
    );
  } else {
    await query(
      `INSERT INTO users (phone, name, credits, subscription_active, subscription_plan, subscription_expires_at, banned, joined_at, last_active, total_messages, total_spent) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        user.phone,
        user.name,
        user.credits,
        user.subscription.active,
        user.subscription.plan,
        user.subscription.expiresAt ? new Date(user.subscription.expiresAt) : null,
        user.banned,
        new Date(user.joinedAt),
        new Date(user.lastActive),
        user.totalMessages,
        user.totalSpent,
      ]
    );
  }
}

export async function updateUser(
  phone: string,
  updates: Partial<User>
): Promise<User | null> {
  const user = await getUser(phone);
  if (!user) return null;

  const updatedUser = { ...user, ...updates };
  if (updates.subscription) {
    updatedUser.subscription = { ...user.subscription, ...updates.subscription };
  }

  await saveUser(updatedUser);
  return updatedUser;
}

export async function deleteUser(phone: string): Promise<boolean> {
  const res = await query('DELETE FROM users WHERE phone = $1', [phone]);
  return res.rowCount > 0;
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
  const res = await query('SELECT * FROM payments');
  return res.rows.map(row => ({
    orderId: row.order_id,
    phone: row.phone,
    amount: row.amount,
    currency: row.currency,
    status: row.status,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  }));
}

export async function getPayment(orderId: string): Promise<Payment | null> {
  const res = await query('SELECT * FROM payments WHERE order_id = $1', [orderId]);
  if (res.rows.length === 0) return null;
  const row = res.rows[0];
  return {
    orderId: row.order_id,
    phone: row.phone,
    amount: row.amount,
    currency: row.currency,
    status: row.status,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

export async function savePayment(payment: Payment): Promise<void> {
  const existingPayment = await getPayment(payment.orderId);
  if (existingPayment) {
    await query(
      `UPDATE payments SET phone = $1, amount = $2, currency = $3, status = $4, updated_at = $5 WHERE order_id = $6`,
      [
        payment.phone,
        payment.amount,
        payment.currency,
        payment.status,
        new Date(payment.updatedAt),
        payment.orderId,
      ]
    );
  } else {
    await query(
      `INSERT INTO payments (order_id, phone, amount, currency, status, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        payment.orderId,
        payment.phone,
        payment.amount,
        payment.currency,
        payment.status,
        new Date(payment.createdAt),
        new Date(payment.updatedAt),
      ]
    );
  }
}

export async function updatePayment(
  orderId: string,
  updates: Partial<Payment>
): Promise<Payment | null> {
  const payment = await getPayment(orderId);
  if (!payment) return null;
  const updatedPayment = { ...payment, ...updates };
  await savePayment(updatedPayment);
  return updatedPayment;
}

// ---- Logs ----
export async function getLogs(): Promise<LogEntry[]> {
  const res = await query('SELECT * FROM logs ORDER BY timestamp DESC');
  return res.rows.map(row => ({
    id: row.id,
    phone: row.phone,
    userName: row.user_name,
    command: row.command,
    message: row.message,
    response: row.response,
    type: row.type,
    timestamp: new Date(row.timestamp).toISOString(),
  }));
}

export async function saveLog(log: LogEntry): Promise<void> {
  await query(
    `INSERT INTO logs (id, phone, user_name, command, message, response, type, timestamp) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      log.id,
      log.phone,
      log.userName,
      log.command,
      log.message,
      log.response,
      log.type,
      new Date(log.timestamp),
    ]
  );
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

export async function getSettings(): Promise<BotSettings> {
  const res = await query('SELECT key, value FROM settings');
  const settingsMap = new Map<string, string>();
  res.rows.forEach(row => settingsMap.set(row.key, row.value));

  const currentSettings: BotSettings = { ...DEFAULT_SETTINGS };
  for (const key in currentSettings) {
    if (settingsMap.has(key)) {
      // Special handling for boolean and number types
      const value = settingsMap.get(key);
      if (typeof (currentSettings as any)[key] === 'boolean') {
        (currentSettings as any)[key] = value === 'true';
      } else if (typeof (currentSettings as any)[key] === 'number') {
        (currentSettings as any)[key] = Number(value);
      } else {
        (currentSettings as any)[key] = value;
      }
    }
  }
  return currentSettings;
}

export async function saveSettings(
  settings: Partial<BotSettings>
): Promise<BotSettings> {
  for (const key in settings) {
    const value = (settings as any)[key];
    await query(
      `INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2`,
      [key, String(value)]
    );
  }
  return getSettings();
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
