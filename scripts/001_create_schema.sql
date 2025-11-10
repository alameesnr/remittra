-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  country TEXT DEFAULT 'NG',
  kyc_status TEXT DEFAULT 'unverified' CHECK (kyc_status IN ('unverified', 'pending', 'verified')),
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create wallets table
CREATE TABLE IF NOT EXISTS public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  currency TEXT DEFAULT 'NGN',
  balance NUMERIC(14, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('credit', 'debit')),
  amount NUMERIC(14, 2) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create ajo_groups table
CREATE TABLE IF NOT EXISTS public.ajo_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  contribution_amount NUMERIC(14, 2) NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly')),
  start_date DATE,
  started_at TIMESTAMPTZ,
  status TEXT DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create ajo_members table
CREATE TABLE IF NOT EXISTS public.ajo_members (
  group_id UUID NOT NULL REFERENCES public.ajo_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (group_id, user_id)
);

-- Create ajo_cycles table
CREATE TABLE IF NOT EXISTS public.ajo_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.ajo_groups(id) ON DELETE CASCADE,
  cycle_number INTEGER NOT NULL,
  payout_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  paid_out BOOLEAN DEFAULT FALSE,
  pool_amount NUMERIC(14, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Create ajo_ledger table
CREATE TABLE IF NOT EXISTS public.ajo_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.ajo_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cycle_number INTEGER NOT NULL,
  movement TEXT NOT NULL CHECK (movement IN ('contribution', 'payout')),
  amount NUMERIC(14, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ajo_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ajo_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ajo_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ajo_ledger ENABLE ROW LEVEL SECURITY;

-- Profiles RLS policies
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_delete_own" ON public.profiles FOR DELETE USING (auth.uid() = id);

-- Wallets RLS policies
CREATE POLICY "wallets_select_own" ON public.wallets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "wallets_insert_own" ON public.wallets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "wallets_update_own" ON public.wallets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "wallets_delete_own" ON public.wallets FOR DELETE USING (auth.uid() = user_id);

-- Transactions RLS policies
CREATE POLICY "transactions_select_own" ON public.transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "transactions_insert_own" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "transactions_delete_own" ON public.transactions FOR DELETE USING (auth.uid() = user_id);

-- Ajo groups RLS policies
CREATE POLICY "ajo_groups_select_own_or_member" ON public.ajo_groups FOR SELECT 
  USING (auth.uid() = owner_id OR auth.uid() IN (SELECT user_id FROM public.ajo_members WHERE group_id = id));
CREATE POLICY "ajo_groups_insert_own" ON public.ajo_groups FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "ajo_groups_update_own" ON public.ajo_groups FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "ajo_groups_delete_own" ON public.ajo_groups FOR DELETE USING (auth.uid() = owner_id);

-- Ajo members RLS policies
CREATE POLICY "ajo_members_select" ON public.ajo_members FOR SELECT 
  USING (auth.uid() = user_id OR group_id IN (SELECT id FROM public.ajo_groups WHERE owner_id = auth.uid()));
CREATE POLICY "ajo_members_insert" ON public.ajo_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ajo_members_delete" ON public.ajo_members FOR DELETE USING (auth.uid() = user_id);

-- Ajo cycles RLS policies
CREATE POLICY "ajo_cycles_select" ON public.ajo_cycles FOR SELECT 
  USING (group_id IN (SELECT id FROM public.ajo_groups WHERE owner_id = auth.uid() OR id IN (SELECT group_id FROM public.ajo_members WHERE user_id = auth.uid())));
CREATE POLICY "ajo_cycles_insert" ON public.ajo_cycles FOR INSERT WITH CHECK (group_id IN (SELECT id FROM public.ajo_groups WHERE owner_id = auth.uid()));
CREATE POLICY "ajo_cycles_update" ON public.ajo_cycles FOR UPDATE USING (group_id IN (SELECT id FROM public.ajo_groups WHERE owner_id = auth.uid()));

-- Ajo ledger RLS policies
CREATE POLICY "ajo_ledger_select" ON public.ajo_ledger FOR SELECT 
  USING (group_id IN (SELECT id FROM public.ajo_groups WHERE owner_id = auth.uid() OR id IN (SELECT group_id FROM public.ajo_members WHERE user_id = auth.uid())));
CREATE POLICY "ajo_ledger_insert" ON public.ajo_ledger FOR INSERT WITH CHECK (group_id IN (SELECT id FROM public.ajo_groups WHERE owner_id = auth.uid() OR id IN (SELECT group_id FROM public.ajo_members WHERE user_id = auth.uid())));

-- Create function to auto-create wallet on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (new.id, COALESCE(new.raw_user_meta_data ->> 'full_name', 'User'))
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.wallets (user_id, currency, balance)
  VALUES (new.id, 'NGN', 0)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN new;
END;
$$;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
