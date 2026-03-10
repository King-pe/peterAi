-- ============================================
-- PeterAi - Supabase Database Schema
-- ============================================
-- Creates tables for users, bot users, admins, payments, logs, and settings

-- ---- Profiles Table (linked to Supabase Auth) ----
-- Stores additional user data for authenticated users
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---- Bot Users Table ----
-- Stores WhatsApp bot users (different from authenticated web users)
CREATE TABLE IF NOT EXISTS public.bot_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT UNIQUE NOT NULL,
  name TEXT,
  credits INTEGER DEFAULT 5,
  subscription_active BOOLEAN DEFAULT FALSE,
  subscription_plan TEXT DEFAULT 'none' CHECK (subscription_plan IN ('credits', 'monthly', 'none')),
  subscription_expires_at TIMESTAMPTZ,
  banned BOOLEAN DEFAULT FALSE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_active TIMESTAMPTZ DEFAULT NOW(),
  total_messages INTEGER DEFAULT 0,
  total_spent NUMERIC(10, 2) DEFAULT 0,
  -- Link to web user (optional)
  linked_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- ---- Payments Table ----
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT UNIQUE NOT NULL,
  phone TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  currency TEXT DEFAULT 'TZS',
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED')),
  type TEXT DEFAULT 'credits' CHECK (type IN ('credits', 'subscription')),
  credits_added INTEGER DEFAULT 0,
  reference TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  -- Link to bot user
  bot_user_id UUID REFERENCES public.bot_users(id) ON DELETE SET NULL
);

-- ---- Logs Table ----
CREATE TABLE IF NOT EXISTS public.logs (
  id TEXT PRIMARY KEY,
  phone TEXT,
  user_name TEXT,
  command TEXT,
  message TEXT,
  response TEXT,
  type TEXT DEFAULT 'command' CHECK (type IN ('command', 'ai_chat', 'payment', 'system', 'error')),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  -- Link to bot user
  bot_user_id UUID REFERENCES public.bot_users(id) ON DELETE SET NULL
);

-- ---- Settings Table ----
CREATE TABLE IF NOT EXISTS public.settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---- Conversations Table (for user dashboard chat history) ----
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_user_id UUID NOT NULL REFERENCES public.bot_users(id) ON DELETE CASCADE,
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---- Messages Table (for user dashboard chat history) ----
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---- Create Indexes ----
CREATE INDEX IF NOT EXISTS idx_bot_users_phone ON public.bot_users(phone);
CREATE INDEX IF NOT EXISTS idx_bot_users_linked_profile ON public.bot_users(linked_profile_id);
CREATE INDEX IF NOT EXISTS idx_payments_phone ON public.payments(phone);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_bot_user ON public.payments(bot_user_id);
CREATE INDEX IF NOT EXISTS idx_logs_phone ON public.logs(phone);
CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON public.logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_bot_user ON public.conversations(bot_user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id);

-- ---- Enable Row Level Security ----
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bot_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
