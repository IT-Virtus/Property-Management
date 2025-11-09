/*
  # Create Payment Settings Table

  1. New Tables
    - `payment_settings`
      - `id` (uuid, primary key)
      - `payment_method` (text) - 'bank_transfer' or 'paypal'
      - `bank_name` (text, optional)
      - `account_holder` (text, optional)
      - `iban` (text, optional)
      - `bic_swift` (text, optional)
      - `paypal_email` (text, optional)
      - `additional_instructions` (text, optional)
      - `is_active` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on `payment_settings` table
    - Add policy for admins to manage payment settings
    - Add policy for authenticated users to view payment settings
*/

CREATE TABLE IF NOT EXISTS payment_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_method text NOT NULL CHECK (payment_method IN ('bank_transfer', 'paypal')),
  bank_name text,
  account_holder text,
  iban text,
  bic_swift text,
  paypal_email text,
  additional_instructions text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE payment_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage payment settings"
  ON payment_settings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Authenticated users can view active payment settings"
  ON payment_settings
  FOR SELECT
  TO authenticated
  USING (is_active = true);
