-- Initial Schema for Equalin (Refactored)

-- 1. Groups Table
CREATE TABLE groups (
  id TEXT PRIMARY KEY, -- NanoID
  name TEXT NOT NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '30 days') NOT NULL
);

-- 2. Members Table (Entities for payments, registered by owner)
CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id TEXT REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Group Collaborators Table (Users who can access/edit the group)
CREATE TABLE group_collaborators (
  group_id TEXT REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  PRIMARY KEY (group_id, user_id)
);

-- 4. Payments Table
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id TEXT REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  payer_member_id UUID REFERENCES members(id) ON DELETE CASCADE NOT NULL,
  amount BIGINT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Payment Participants Table
CREATE TABLE payment_participants (
  payment_id UUID REFERENCES payments(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  PRIMARY KEY (payment_id, member_id)
);

-- Enable RLS
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_participants ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies

-- Groups: IDを知っている人なら誰でも閲覧可能（NanoIDによるアクセス制限）
CREATE POLICY "Groups are readable by anyone with ID" ON groups
  FOR SELECT USING (true);
CREATE POLICY "Anyone can create group" ON groups
  FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owner can update group" ON groups
  FOR UPDATE USING (auth.uid() = owner_id);

-- Members: グループのコラボレーターが閲覧・編集可能
CREATE POLICY "Members are manageable by group collaborators" ON members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM group_collaborators
      WHERE group_collaborators.group_id = members.group_id
      AND group_collaborators.user_id = auth.uid()
    )
  );

-- Group Collaborators:
-- オーナーが追加・削除可能
-- 招待リンクを踏んだ本人が自分を追加可能
CREATE POLICY "Collaborators are manageable by owner or self" ON group_collaborators
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM groups
      WHERE groups.id = group_collaborators.group_id
      AND groups.owner_id = auth.uid()
    )
    OR auth.uid() = user_id
  );

-- Payments:
-- グループのコラボレーターが閲覧・作成可能
CREATE POLICY "Collaborators can see group payments" ON payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM group_collaborators
      WHERE group_collaborators.group_id = payments.group_id
      AND group_collaborators.user_id = auth.uid()
    )
  );
CREATE POLICY "Collaborators can create payments" ON payments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_collaborators
      WHERE group_collaborators.group_id = payments.group_id
      AND group_collaborators.user_id = auth.uid()
    )
  );
-- オーナーのみが削除可能
CREATE POLICY "Owner can delete payments" ON payments
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM groups
      WHERE groups.id = payments.group_id
      AND groups.owner_id = auth.uid()
    )
  );

-- Payment Participants:
-- グループのコラボレーターが管理可能
CREATE POLICY "Collaborators can manage participants" ON payment_participants
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM payments
      JOIN group_collaborators ON payments.group_id = group_collaborators.group_id
      WHERE payments.id = payment_participants.payment_id
      AND group_collaborators.user_id = auth.uid()
    )
  );
