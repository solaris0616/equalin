-- Add indexes to foreign keys and columns used in RLS policies to improve performance

-- 1. members table
CREATE INDEX idx_members_group_id ON members(group_id);

-- 2. group_collaborators table
-- Primary key is (group_id, user_id), which already provides an index on group_id.
-- We add an index on user_id for queries looking up groups for a specific user.
CREATE INDEX idx_group_collaborators_user_id ON group_collaborators(user_id);

-- 3. payments table
CREATE INDEX idx_payments_group_id ON payments(group_id);
CREATE INDEX idx_payments_payer_member_id ON payments(payer_member_id);
CREATE INDEX idx_payments_created_at ON payments(created_at DESC);

-- 4. payment_participants table
-- Primary key is (payment_id, member_id), which already provides an index on payment_id.
-- We add an index on member_id for reverse lookups.
CREATE INDEX idx_payment_participants_member_id ON payment_participants(member_id);
