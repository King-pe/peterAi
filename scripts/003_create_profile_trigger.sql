-- ============================================
-- PeterAi - Auto-create Profile on Signup
-- ============================================
-- Trigger to automatically create a profile when a new user signs up

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', NULL),
    COALESCE(new.raw_user_meta_data ->> 'role', 'user')
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN new;
END;
$$;

-- Drop existing trigger if any
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- Function to link WhatsApp phone to profile
-- ============================================

CREATE OR REPLACE FUNCTION public.link_phone_to_profile(
  p_profile_id UUID,
  p_phone TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_bot_user_id UUID;
BEGIN
  -- Check if bot user exists
  SELECT id INTO v_bot_user_id FROM public.bot_users WHERE phone = p_phone;
  
  IF v_bot_user_id IS NULL THEN
    -- Create new bot user linked to profile
    INSERT INTO public.bot_users (phone, linked_profile_id)
    VALUES (p_phone, p_profile_id);
  ELSE
    -- Link existing bot user to profile
    UPDATE public.bot_users
    SET linked_profile_id = p_profile_id
    WHERE id = v_bot_user_id;
  END IF;
  
  -- Update profile phone
  UPDATE public.profiles
  SET phone = p_phone
  WHERE id = p_profile_id;
  
  RETURN TRUE;
END;
$$;

-- ============================================
-- Function to check if user is admin
-- ============================================

CREATE OR REPLACE FUNCTION public.is_admin(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = p_user_id AND role = 'admin'
  );
END;
$$;
