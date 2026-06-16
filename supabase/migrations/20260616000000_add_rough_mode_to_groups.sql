-- Add is_rough_mode column to groups table
ALTER TABLE groups ADD COLUMN is_rough_mode BOOLEAN DEFAULT FALSE NOT NULL;
