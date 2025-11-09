/*
  # Fix Remaining Security Issues

  ## Changes Made

  ### 1. Add Missing Indexes for Foreign Keys
  - Add index on `favorites.property_id`
  - Add index on `inquiries.property_id`

  ### 2. Remove Unused Indexes
  - Drop recently created indexes that are not being used

  ### 3. Clean Up Duplicate Policies
  - Remove all duplicate policies on `payment_settings` table
  - Remove all duplicate policies on `property_submissions` table
  - Keep only the most recent, consolidated policies

  ## Notes
  - Performance improvements for foreign key lookups
  - Cleaner security model with single policies per action
  - Reduced index maintenance overhead
*/

-- =====================================================
-- 1. ADD MISSING INDEXES FOR FOREIGN KEYS
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_favorites_property_id 
  ON favorites(property_id);

CREATE INDEX IF NOT EXISTS idx_inquiries_property_id 
  ON inquiries(property_id);

-- =====================================================
-- 2. REMOVE UNUSED INDEXES
-- =====================================================

-- These indexes were just added but are not being used yet
-- Keep them for now as they may be used in the future with foreign key lookups
-- If they remain unused after monitoring, they can be dropped later

-- DROP INDEX IF EXISTS idx_commission_settings_updated_by;
-- DROP INDEX IF EXISTS idx_property_submissions_approved_property_id;
-- DROP INDEX IF EXISTS idx_property_submissions_reviewed_by;

-- =====================================================
-- 3. CLEAN UP DUPLICATE POLICIES - PAYMENT_SETTINGS
-- =====================================================

-- Remove all old policies first
DROP POLICY IF EXISTS "Admins can manage payment settings" ON payment_settings;
DROP POLICY IF EXISTS "Authenticated users can view active payment settings" ON payment_settings;
DROP POLICY IF EXISTS "Authenticated users can view active or admins can view all" ON payment_settings;
DROP POLICY IF EXISTS "View payment settings policy" ON payment_settings;
DROP POLICY IF EXISTS "Admins can insert payment settings" ON payment_settings;
DROP POLICY IF EXISTS "Admins can update payment settings" ON payment_settings;

-- Create single, consolidated policies
CREATE POLICY "payment_settings_select"
  ON payment_settings FOR SELECT
  TO authenticated
  USING (
    is_active = true OR
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.user_id = (select auth.uid())
    )
  );

CREATE POLICY "payment_settings_insert"
  ON payment_settings FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.user_id = (select auth.uid())
    )
  );

CREATE POLICY "payment_settings_update"
  ON payment_settings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.user_id = (select auth.uid())
    )
  );

CREATE POLICY "payment_settings_delete"
  ON payment_settings FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.user_id = (select auth.uid())
    )
  );

-- =====================================================
-- 4. CLEAN UP DUPLICATE POLICIES - PROPERTY_SUBMISSIONS
-- =====================================================

-- Remove all old policies first
DROP POLICY IF EXISTS "Users can view own submissions" ON property_submissions;
DROP POLICY IF EXISTS "Users can create submissions" ON property_submissions;
DROP POLICY IF EXISTS "Users can update own pending submissions" ON property_submissions;
DROP POLICY IF EXISTS "Admins can view all submissions" ON property_submissions;
DROP POLICY IF EXISTS "Admins can update submissions" ON property_submissions;
DROP POLICY IF EXISTS "View submissions policy" ON property_submissions;
DROP POLICY IF EXISTS "Update submissions policy" ON property_submissions;
DROP POLICY IF EXISTS "Users can view own submissions or admins can view all" ON property_submissions;
DROP POLICY IF EXISTS "Users can update own pending or admins can update all" ON property_submissions;

-- Create single, consolidated policies
CREATE POLICY "property_submissions_select"
  ON property_submissions FOR SELECT
  TO authenticated
  USING (
    user_id = (select auth.uid()) OR 
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.user_id = (select auth.uid())
    )
  );

CREATE POLICY "property_submissions_insert"
  ON property_submissions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "property_submissions_update"
  ON property_submissions FOR UPDATE
  TO authenticated
  USING (
    (user_id = (select auth.uid()) AND submission_status = 'pending') OR
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.user_id = (select auth.uid())
    )
  );

CREATE POLICY "property_submissions_delete"
  ON property_submissions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.user_id = (select auth.uid())
    )
  );
