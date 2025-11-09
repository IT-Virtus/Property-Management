/*
  # Add Stripe Support to Payment Settings

  1. Changes
    - Update `payment_method` check constraint to include 'stripe'
    - Add `stripe_publishable_key` column for frontend
    - Add `stripe_secret_key` column for backend (encrypted)
    - Add `stripe_webhook_secret` column for webhook verification
  
  2. Security
    - RLS policies remain the same
    - Secret keys only accessible to admins
*/

-- Drop existing constraint
ALTER TABLE payment_settings DROP CONSTRAINT IF EXISTS payment_settings_payment_method_check;

-- Add new constraint with stripe
ALTER TABLE payment_settings ADD CONSTRAINT payment_settings_payment_method_check 
  CHECK (payment_method IN ('bank_transfer', 'paypal', 'stripe'));

-- Add Stripe columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payment_settings' AND column_name = 'stripe_publishable_key'
  ) THEN
    ALTER TABLE payment_settings ADD COLUMN stripe_publishable_key text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payment_settings' AND column_name = 'stripe_secret_key'
  ) THEN
    ALTER TABLE payment_settings ADD COLUMN stripe_secret_key text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payment_settings' AND column_name = 'stripe_webhook_secret'
  ) THEN
    ALTER TABLE payment_settings ADD COLUMN stripe_webhook_secret text;
  END IF;
END $$;
