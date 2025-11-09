/*
  # Add Auto-Approve Setting for Paid Listings

  1. Changes
    - Add `auto_approve_paid` column to `commission_settings` table
    - This allows admins to configure whether paid listings should be automatically approved
    - Default value is `false` to maintain existing behavior
  
  2. Security
    - No RLS changes needed as commission_settings already has proper policies
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'commission_settings' AND column_name = 'auto_approve_paid'
  ) THEN
    ALTER TABLE commission_settings ADD COLUMN auto_approve_paid boolean DEFAULT false;
  END IF;
END $$;
