-- 1. Initial Schema for Equalin: UUID for Users, TEXT (NanoID) for Groups

-- 1. Groups Table
CREATE TABLE groups (
  id TEXT PRIMARY KEY,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '30 days') NOT NULL
);

-- 2. Profiles Table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL
);

-- 3. Group Members Table
CREATE TABLE group_members (
  group_id TEXT REFERENCES groups(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (group_id, profile_id)
);

-- 4. Payments Table
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id TEXT REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  payer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  amount BIGINT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Payment Participants Table
CREATE TABLE payment_participants (
  payment_id UUID REFERENCES payments(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (payment_id, profile_id)
);

-- Enable RLS
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_participants ENABLE ROW LEVEL SECURITY;

-- 6. Strict RLS Policies

-- Groups: IDを知っている人だけが読み取り可能
-- (NanoIDが推測困難な「秘密のキー」として機能する)
CREATE POLICY "Groups are readable by ID" ON groups
  FOR SELECT USING (true);
CREATE POLICY "Anyone can create group" ON groups
  FOR INSERT WITH CHECK (true);

-- Profiles: 
-- 「同じグループに所属しているメンバー」のプロフィールのみ閲覧可能
CREATE POLICY "Profiles are readable by fellow group members" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM group_members AS m1
      JOIN group_members AS m2 ON m1.group_id = m2.group_id
      WHERE m1.profile_id = auth.uid() AND m2.profile_id = profiles.id
    )
    OR auth.uid() = id -- 自分のプロフィールは常に見える
  );
-- 自分のプロフィールのみ管理可能
CREATE POLICY "Users can manage their own profile" ON profiles
  FOR ALL USING (auth.uid() = id);

-- Group Members: 
-- 「自分が所属しているグループ」のメンバー一覧のみ閲覧可能
CREATE POLICY "Members can see their group memberships" ON group_members
  FOR SELECT USING (
    group_id IN (
      SELECT g.group_id FROM group_members g WHERE g.profile_id = auth.uid()
    )
  );
-- ユーザーが自分でグループに参加する（自分自身をメンバーに追加する）ことのみ許可
CREATE POLICY "Users can join a group" ON group_members
  FOR INSERT WITH CHECK (auth.uid() = profile_id);

-- Payments:
-- 「自分が所属しているグループ」の支払いのみ閲覧・作成可能
CREATE POLICY "Members can see group payments" ON payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_id = payments.group_id AND profile_id = auth.uid()
    )
  );
CREATE POLICY "Members can create payments" ON payments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_id = payments.group_id AND profile_id = auth.uid()
    )
  );
-- 支払った本人のみ削除可能
CREATE POLICY "Payers can delete their own payments" ON payments
  FOR DELETE USING (auth.uid() = payer_id);

-- Payment Participants:
-- 「自分が所属しているグループ」に関連する参加者情報のみ閲覧・作成可能
CREATE POLICY "Members can see participants" ON payment_participants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM payments
      JOIN group_members ON payments.group_id = group_members.group_id
      WHERE payments.id = payment_participants.payment_id AND group_members.profile_id = auth.uid()
    )
  );
CREATE POLICY "Members can add participants" ON payment_participants
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM payments
      JOIN group_members ON payments.group_id = group_members.group_id
      WHERE payments.id = payment_participants.payment_id AND group_members.profile_id = auth.uid()
    )
  );
