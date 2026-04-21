-- Initial Schema for Equalin: All IDs use TEXT (NanoID)

-- 1. Groups Table: Stores information about split-billing groups.
CREATE TABLE groups (
  id TEXT PRIMARY KEY,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '30 days') NOT NULL
);
COMMENT ON TABLE groups IS 'Stores split-billing groups.';

-- 2. Profiles Table: Stores user profiles, not linked to auth.
CREATE TABLE profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL
);
COMMENT ON TABLE profiles IS 'Stores user profiles, identified by a client-side generated NanoID.';

-- 3. Group Members Table: Junction table for groups and profiles.
CREATE TABLE group_members (
  group_id TEXT REFERENCES groups(id) ON DELETE CASCADE,
  profile_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (group_id, profile_id)
);
COMMENT ON TABLE group_members IS 'Junction table for groups and profiles.';

-- 4. Payments Table: Stores payment records.
CREATE TABLE payments (
  id TEXT PRIMARY KEY,
  group_id TEXT REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  payer_id TEXT REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  amount BIGINT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
COMMENT ON TABLE payments IS 'Stores payment records.';

-- 5. Payment Participants Table: Tracks which users participate in each payment for split calculation
CREATE TABLE payment_participants (
  payment_id TEXT REFERENCES payments(id) ON DELETE CASCADE,
  profile_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (payment_id, profile_id)
);
COMMENT ON TABLE payment_participants IS 'Tracks which users participate in each payment for split calculation';
