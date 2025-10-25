-- 1. Groups Table: Stores information about split-billing groups.
CREATE TABLE groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '30 days') NOT NULL
);
COMMENT ON TABLE groups IS 'Stores split-billing groups.';

-- 2. Profiles Table: Stores user profiles, not linked to auth.
-- The ID is generated on the client-side and stored in localStorage.
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL
);
COMMENT ON TABLE profiles IS 'Stores user profiles, identified by a client-side generated UUID.';

-- 3. Group Members Table: Junction table for groups and profiles.
CREATE TABLE group_members (
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (group_id, profile_id)
);
COMMENT ON TABLE group_members IS 'Junction table for groups and profiles.';

-- 4. Payments Table: Stores payment records.
CREATE TABLE payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  payer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  amount BIGINT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
COMMENT ON TABLE payments IS 'Stores payment records.';
