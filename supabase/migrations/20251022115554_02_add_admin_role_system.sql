/*
  # Add Admin Role System

  ## Overview
  Implements an admin role system to restrict property management to specific users only.

  ## Changes
  
  ### New Tables
  
  #### `admin_users`
  Stores list of admin users who can manage properties
  - `id` (uuid, primary key) - Unique identifier
  - `user_id` (uuid) - Reference to auth.users
  - `email` (text) - Admin user's email for easy identification
  - `created_at` (timestamptz) - When admin access was granted
  
  ### Security
  - Enable RLS on admin_users table
  - Only authenticated users can check if they are admin (read-only)
  - No one can modify admin_users table via API (must be done via SQL)
  
  ### Helper Function
  - `is_admin()` - Function to check if current user is an admin
  
  ### Updated RLS Policies
  - Update properties policies to only allow admin users to insert/update/delete
  - Public can still view all properties
  
  ## Important Notes
  To make a user an admin, you need to run SQL manually:
  
  ```sql
  INSERT INTO admin_users (user_id, email)
  SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';
  ```
*/

CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  email text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view admin list"
  ON admin_users FOR SELECT
  TO authenticated
  USING (true);

CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP POLICY IF EXISTS "Authenticated users can insert properties" ON properties;
DROP POLICY IF EXISTS "Authenticated users can update properties" ON properties;
DROP POLICY IF EXISTS "Authenticated users can delete properties" ON properties;

CREATE POLICY "Only admins can insert properties"
  ON properties FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Only admins can update properties"
  ON properties FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Only admins can delete properties"
  ON properties FOR DELETE
  TO authenticated
  USING (is_admin());

CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON admin_users(user_id);
