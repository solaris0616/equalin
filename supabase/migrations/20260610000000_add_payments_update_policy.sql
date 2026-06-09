-- Allow collaborators to update payments in the group
CREATE POLICY "Collaborators can update payments" ON payments
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM group_collaborators
      WHERE group_collaborators.group_id = payments.group_id
      AND group_collaborators.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_collaborators
      WHERE group_collaborators.group_id = payments.group_id
      AND group_collaborators.user_id = auth.uid()
    )
  );
