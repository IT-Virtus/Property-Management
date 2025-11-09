/*
  # Client Property Submissions with Payment Tracking

  ## Overview
  Enables clients to submit property listings and tracks commission payments based on a percentage of rent/sale value.

  ## New Tables

  ### `property_submissions`
  Tracks client-submitted properties pending approval
  - `id` (uuid, primary key) - Unique identifier
  - `user_id` (uuid) - Reference to submitting user
  - `title` (text) - Property title
  - `description` (text) - Property description
  - `price` (decimal) - Property price (rent/sale)
  - `property_type` (text) - Type of property
  - `listing_type` (text) - rent or sale
  - `bedrooms` (integer) - Number of bedrooms
  - `bathrooms` (integer) - Number of bathrooms
  - `area_sqft` (integer) - Square footage
  - `address` (text) - Full address
  - `city` (text) - City
  - `state` (text) - State
  - `zip_code` (text) - ZIP code
  - `latitude` (decimal) - Latitude
  - `longitude` (decimal) - Longitude
  - `features` (jsonb) - Property features array
  - `images` (jsonb) - Image URLs array
  - `commission_percentage` (decimal) - Percentage fee (e.g., 5.00 for 5%)
  - `commission_amount` (decimal) - Calculated commission amount
  - `payment_status` (text) - unpaid, paid, refunded
  - `payment_id` (text) - Stripe payment intent ID
  - `submission_status` (text) - pending, approved, rejected
  - `approved_property_id` (uuid) - Links to properties table if approved
  - `rejection_reason` (text) - Reason if rejected
  - `submitted_at` (timestamptz) - Submission timestamp
  - `reviewed_at` (timestamptz) - When admin reviewed
  - `reviewed_by` (uuid) - Admin who reviewed

  ### `commission_settings`
  Configurable commission rates for different listing types
  - `id` (uuid, primary key) - Unique identifier
  - `listing_type` (text) - rent or sale
  - `commission_percentage` (decimal) - Default percentage rate
  - `updated_at` (timestamptz) - Last update
  - `updated_by` (uuid) - Admin who updated

  ## Security

  ### Row Level Security
  - All tables have RLS enabled
  - Users can only view/edit their own submissions
  - Only admins can approve/reject submissions
  - Commission settings are admin-only

  ### RLS Policies

  #### property_submissions Table
  - Users can view their own submissions
  - Users can create new submissions
  - Users can update their own pending submissions
  - Admins can view all submissions
  - Admins can update submission status (approve/reject)

  #### commission_settings Table
  - Anyone can read commission rates
  - Only admins can modify rates

  ## Indexes
  - Indexed by user_id for user dashboard
  - Indexed by submission_status for admin review queue
  - Indexed by payment_status for payment tracking

  ## Important Notes
  1. Commission is calculated as: (price × commission_percentage / 100)
  2. For rentals, commission is typically based on monthly rent
  3. For sales, commission is based on sale price
  4. Payment must be completed before submission goes to admin review
  5. Approved submissions create a new entry in properties table
*/

-- Create property_submissions table
CREATE TABLE IF NOT EXISTS property_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  price decimal(12,2) NOT NULL,
  property_type text NOT NULL,
  listing_type text NOT NULL CHECK (listing_type IN ('rent', 'sale')),
  bedrooms integer NOT NULL DEFAULT 0,
  bathrooms integer NOT NULL DEFAULT 0,
  area_sqft integer NOT NULL DEFAULT 0,
  address text NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  zip_code text NOT NULL,
  latitude decimal(10,8),
  longitude decimal(11,8),
  features jsonb DEFAULT '[]'::jsonb,
  images jsonb DEFAULT '[]'::jsonb,
  commission_percentage decimal(5,2) NOT NULL,
  commission_amount decimal(12,2) NOT NULL,
  payment_status text NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'refunded')),
  payment_id text,
  submission_status text NOT NULL DEFAULT 'pending' CHECK (submission_status IN ('pending', 'approved', 'rejected')),
  approved_property_id uuid REFERENCES properties(id) ON DELETE SET NULL,
  rejection_reason text,
  submitted_at timestamptz DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create commission_settings table
CREATE TABLE IF NOT EXISTS commission_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_type text UNIQUE NOT NULL CHECK (listing_type IN ('rent', 'sale')),
  commission_percentage decimal(5,2) NOT NULL,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable Row Level Security
ALTER TABLE property_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_settings ENABLE ROW LEVEL SECURITY;

-- Property Submissions Policies

-- Users can view their own submissions
CREATE POLICY "Users can view own submissions"
  ON property_submissions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can view all submissions
CREATE POLICY "Admins can view all submissions"
  ON property_submissions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Users can create submissions
CREATE POLICY "Users can create submissions"
  ON property_submissions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own pending submissions
CREATE POLICY "Users can update own pending submissions"
  ON property_submissions FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id 
    AND submission_status = 'pending'
  )
  WITH CHECK (
    auth.uid() = user_id 
    AND submission_status = 'pending'
  );

-- Admins can update any submission (for approval/rejection)
CREATE POLICY "Admins can update submissions"
  ON property_submissions FOR UPDATE
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

-- Commission Settings Policies

-- Anyone can view commission rates
CREATE POLICY "Anyone can view commission rates"
  ON commission_settings FOR SELECT
  USING (true);

-- Only admins can insert commission settings
CREATE POLICY "Admins can insert commission settings"
  ON commission_settings FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Only admins can update commission settings
CREATE POLICY "Admins can update commission settings"
  ON commission_settings FOR UPDATE
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON property_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON property_submissions(submission_status);
CREATE INDEX IF NOT EXISTS idx_submissions_payment_status ON property_submissions(payment_status);
CREATE INDEX IF NOT EXISTS idx_submissions_listing_type ON property_submissions(listing_type);

-- Insert default commission rates
INSERT INTO commission_settings (listing_type, commission_percentage)
VALUES 
  ('rent', 10.00),  -- 10% of monthly rent
  ('sale', 3.00)    -- 3% of sale price
ON CONFLICT (listing_type) DO NOTHING;