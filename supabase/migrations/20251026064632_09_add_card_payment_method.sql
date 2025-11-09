/*
  # Add Card Payment Method Option

  1. Changes
    - Update `payment_method` check constraint to include 'card'
    - Add fields for card payment details
  
  2. New Fields
    - `card_instructions` (text) - Instructions for card payment (e.g., payment link, phone number)
  
  3. Security
    - No changes to RLS policies needed
*/

-- Add card_instructions field for manual card payment details
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payment_settings' AND column_name = 'card_instructions'
  ) THEN
    ALTER TABLE payment_settings ADD COLUMN card_instructions text;
  END IF;
END $$;

-- Update payment_method constraint to include 'card'
ALTER TABLE payment_settings DROP CONSTRAINT IF EXISTS payment_settings_payment_method_check;

ALTER TABLE payment_settings ADD CONSTRAINT payment_settings_payment_method_check 
  CHECK (payment_method IN ('bank_transfer', 'paypal', 'stripe', 'card'));
