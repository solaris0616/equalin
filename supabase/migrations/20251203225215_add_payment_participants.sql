-- Payment Participants Table: Tracks which users participate in each payment for split calculation
CREATE TABLE payment_participants (
  payment_id UUID REFERENCES payments(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (payment_id, profile_id)
);

COMMENT ON TABLE payment_participants IS 'Tracks which users participate in each payment for split calculation';
