-- ============================================
-- PeterAi - Row Level Security Policies
-- ============================================

-- ---- Profiles RLS Policies ----

-- Users can read their own profile
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Admins can read all profiles
CREATE POLICY "profiles_select_admin" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update all profiles
CREATE POLICY "profiles_update_admin" ON public.profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ---- Bot Users RLS Policies ----

-- Users can read their linked bot user
CREATE POLICY "bot_users_select_own" ON public.bot_users
  FOR SELECT USING (linked_profile_id = auth.uid());

-- Users can update their linked bot user
CREATE POLICY "bot_users_update_own" ON public.bot_users
  FOR UPDATE USING (linked_profile_id = auth.uid());

-- Admins can read all bot users
CREATE POLICY "bot_users_select_admin" ON public.bot_users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can insert bot users
CREATE POLICY "bot_users_insert_admin" ON public.bot_users
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update all bot users
CREATE POLICY "bot_users_update_admin" ON public.bot_users
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can delete bot users
CREATE POLICY "bot_users_delete_admin" ON public.bot_users
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ---- Payments RLS Policies ----

-- Users can read their own payments (via linked bot user)
CREATE POLICY "payments_select_own" ON public.payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.bot_users
      WHERE bot_users.id = payments.bot_user_id
      AND bot_users.linked_profile_id = auth.uid()
    )
  );

-- Admins can read all payments
CREATE POLICY "payments_select_admin" ON public.payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can insert payments
CREATE POLICY "payments_insert_admin" ON public.payments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update payments
CREATE POLICY "payments_update_admin" ON public.payments
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ---- Logs RLS Policies ----

-- Users can read their own logs (via phone)
CREATE POLICY "logs_select_own" ON public.logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.bot_users
      WHERE bot_users.phone = logs.phone
      AND bot_users.linked_profile_id = auth.uid()
    )
  );

-- Admins can read all logs
CREATE POLICY "logs_select_admin" ON public.logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can insert logs
CREATE POLICY "logs_insert_admin" ON public.logs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ---- Settings RLS Policies ----

-- Admins can read settings
CREATE POLICY "settings_select_admin" ON public.settings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can insert settings
CREATE POLICY "settings_insert_admin" ON public.settings
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update settings
CREATE POLICY "settings_update_admin" ON public.settings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ---- Conversations RLS Policies ----

-- Users can read their own conversations
CREATE POLICY "conversations_select_own" ON public.conversations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.bot_users
      WHERE bot_users.id = conversations.bot_user_id
      AND bot_users.linked_profile_id = auth.uid()
    )
  );

-- Users can insert their own conversations
CREATE POLICY "conversations_insert_own" ON public.conversations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.bot_users
      WHERE bot_users.id = bot_user_id
      AND bot_users.linked_profile_id = auth.uid()
    )
  );

-- Admins can read all conversations
CREATE POLICY "conversations_select_admin" ON public.conversations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ---- Messages RLS Policies ----

-- Users can read their own messages (via conversation)
CREATE POLICY "messages_select_own" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      JOIN public.bot_users b ON b.id = c.bot_user_id
      WHERE c.id = messages.conversation_id
      AND b.linked_profile_id = auth.uid()
    )
  );

-- Users can insert their own messages
CREATE POLICY "messages_insert_own" ON public.messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.conversations c
      JOIN public.bot_users b ON b.id = c.bot_user_id
      WHERE c.id = conversation_id
      AND b.linked_profile_id = auth.uid()
    )
  );

-- Admins can read all messages
CREATE POLICY "messages_select_admin" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
