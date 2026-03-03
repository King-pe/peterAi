-- ============================================
-- PeterAi - PostgreSQL Database Schema
-- Powered by Peter Joram
-- ============================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
  phone VARCHAR(20) PRIMARY KEY,
  name VARCHAR(255) NOT NULL DEFAULT '',
  credits INTEGER NOT NULL DEFAULT 5,
  subscription_active BOOLEAN NOT NULL DEFAULT FALSE,
  subscription_plan VARCHAR(20) NOT NULL DEFAULT 'none',
  subscription_expires_at TIMESTAMPTZ,
  banned BOOLEAN NOT NULL DEFAULT FALSE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_active TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  total_messages INTEGER NOT NULL DEFAULT 0,
  total_spent NUMERIC(12,2) NOT NULL DEFAULT 0
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id VARCHAR(64) PRIMARY KEY,
  order_id VARCHAR(64) UNIQUE NOT NULL,
  phone VARCHAR(20) NOT NULL REFERENCES users(phone) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency VARCHAR(10) NOT NULL DEFAULT 'TZS',
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  type VARCHAR(20) NOT NULL DEFAULT 'credits',
  credits_added INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  reference VARCHAR(255)
);

-- Logs table
CREATE TABLE IF NOT EXISTS logs (
  id VARCHAR(64) PRIMARY KEY,
  phone VARCHAR(20) NOT NULL,
  user_name VARCHAR(255) NOT NULL DEFAULT '',
  command VARCHAR(100) NOT NULL DEFAULT '',
  message TEXT NOT NULL DEFAULT '',
  response TEXT NOT NULL DEFAULT '',
  type VARCHAR(20) NOT NULL DEFAULT 'command',
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Bot settings (single row)
CREATE TABLE IF NOT EXISTS bot_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  bot_name VARCHAR(100) NOT NULL DEFAULT 'PeterAi',
  welcome_message TEXT NOT NULL DEFAULT 'Karibu PeterAi! Mimi ni bot yako ya AI yenye nguvu. Tumia /help kuona commands zote zinazopatikana.',
  ai_system_prompt TEXT NOT NULL DEFAULT 'Wewe ni PeterAi, msaidizi wa AI anayezungumza Kiswahili na Kiingereza. Jibu kwa ufupi na kwa usahihi. Kuwa wa kirafiki na msaidizi.',
  credit_price INTEGER NOT NULL DEFAULT 1000,
  credits_per_pack INTEGER NOT NULL DEFAULT 50,
  subscription_price INTEGER NOT NULL DEFAULT 5000,
  message_credit_cost INTEGER NOT NULL DEFAULT 1,
  image_credit_cost INTEGER NOT NULL DEFAULT 3,
  premium_group_id VARCHAR(100) NOT NULL DEFAULT '',
  bot_phone_number VARCHAR(20) NOT NULL DEFAULT '',
  currency VARCHAR(10) NOT NULL DEFAULT 'TZS',
  max_message_length INTEGER NOT NULL DEFAULT 4096,
  ai_model VARCHAR(100) NOT NULL DEFAULT 'llama-3.3-70b-versatile',
  whatsapp_connected BOOLEAN NOT NULL DEFAULT FALSE,
  whatsapp_phone VARCHAR(20) NOT NULL DEFAULT '',
  auto_typing_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  auto_reaction_enabled BOOLEAN NOT NULL DEFAULT TRUE
);

-- WhatsApp auth state (for Baileys sessions)
CREATE TABLE IF NOT EXISTS wa_auth_creds (
  id VARCHAR(100) PRIMARY KEY DEFAULT 'creds',
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wa_auth_keys (
  id VARCHAR(255) PRIMARY KEY,
  type VARCHAR(100) NOT NULL,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_payments_phone ON payments(phone);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_logs_phone ON logs(phone);
CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_logs_type ON logs(type);
CREATE INDEX IF NOT EXISTS idx_wa_auth_keys_type ON wa_auth_keys(type);

-- Insert default settings row
INSERT INTO bot_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
