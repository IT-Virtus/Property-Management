/*
  # Final Security Fixes

  ## Changes Made

  ### 1. Add Missing Foreign Key Indexes
  - Add index on `favorites.property_id`
  - Add index on `inquiries.property_id`

  ### 2. Remove Unused Indexes
  - Remove newly created but unused indexes on commission_settings and property_submissions

  ### 3. Clean Up All Duplicate Policies
  - Remove ALL existing policies on payment_settings and property_submissions
  - Recreate clean, consolidated policies with proper naming

  ## Notes
  - Ensures only one policy per action exists
  - Eliminates all "Multiple Permissive Policies" warnings
  - Optimizes index usage
*/

-- =====================================================
-- 1. ADD MISSING FOREIGN KEY INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_favorites_property_id 
  ON favorites(property_id);

CREATE INDEX IF NOT EXISTS idx_inquiries_property_id 
  ON inquiries(property_id);

-- =====================================================
-- 2. REMOVE UNUSED INDEXES
-- =====================================================

-- These were just created but are not being used by queries
DROP INDEX IF EXISTS idx_commission_settings_updated_by;
DROP INDEX IF EXISTS idx_property_submissions_approved_property_id;
DROP INDEX IF EXISTS idx_property_submissions_reviewed_by;

-- =====================================================
-- 3. CLEAN UP PAYMENT_SETTINGS POLICIES
-- =====================================================

-- Drop ALL existing policies
DROP POLICY IF EXISTS "payment_settings_select" ON payment_settings;
DROP POLICY IF EXISTS "payment_settings_insert" ON payment_settings;
DROP POLICY IF EXISTS "payment_settings_update" ON payment_settings;
DROP POLICY IF EXISTS "payment_settings_delete" ON payment_settings;
DROP POLICY IF EXISTS "Admins can manage payment settings" ON payment_settings;
DROP POLICY IF EXISTS "Authenticated users can view active payment settings" ON payment_settings;
DROP POLICY IF EXISTS "Authenticated users can view active or admins can view all" ON payment_settings;
DROP POLICY IF EXISTS "View payment settings policy" ON payment_settings;
DROP POLICY IF EXISTS "Admins can insert payment settings" ON payment_settings;
DROP POLICY IF EXISTS "Admins can update payment settings" ON payment_settings;

-- Create clean, consolidated policies
CREATE POLICY "payment_settings_select_policy"
  ON payment_settings FOR SELECT
  TO authenticated
  USING (
    is_active = true OR
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.user_id = (select auth.uid())
    )
  );

CREATE POLICY "payment_settings_insert_policy"
  ON payment_settings FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.user_id = (select auth.uid())
    )
  );

CREATE POLICY "payment_settings_update_policy"
  ON payment_settings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.user_id = (select auth.uid())
    )
  );

CREATE POLICY "payment_settings_delete_policy"
  ON payment_settings FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.user_id = (select auth.uid())
    )
  );

-- =====================================================
-- 4. CLEAN UP PROPERTY_SUBMISSIONS POLICIES
-- =====================================================

-- Drop ALL existing policies
DROP POLICY IF EXISTS "property_submissions_select" ON property_submissions;
DROP POLICY IF EXISTS "property_submissions_insert" ON property_submissions;
DROP POLICY IF EXISTS "property_submissions_update" ON property_submissions;
DROP POLICY IF EXISTS "property_submissions_delete" ON property_submissions;
DROP POLICY IF EXISTS "Users can view own submissions" ON property_submissions;
DROP POLICY IF EXISTS "Users can create submissions" ON property_submissions;
DROP POLICY IF EXISTS "Users can update own pending submissions" ON property_submissions;
DROP POLICY IF EXISTS "Admins can view all submissions" ON property_submissions;
DROP POLICY IF EXISTS "Admins can update submissions" ON property_submissions;
DROP POLICY IF EXISTS "Admins can delete submissions" ON property_submissions;
DROP POLICY IF EXISTS "View submissions policy" ON property_submissions;
DROP POLICY IF EXISTS "Update submissions policy" ON property_submissions;
DROP POLICY IF EXISTS "Users can view own submissions or admins can view all" ON property_submissions;
DROP POLICY IF EXISTS "Users can update own pending or admins can update all" ON property_submissions;

-- Create clean, consolidated policies
CREATE POLICY "property_submissions_select_policy"
  ON property_submissions FOR SELECT
  TO authenticated
  USING (
    user_id = (select auth.uid()) OR 
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.user_id = (select auth.uid())
    )
  );

CREATE POLICY "property_submissions_insert_policy"
  ON property_submissions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "property_submissions_update_policy"
  ON property_submissions FOR UPDATE
  TO authenticated
  USING (
    (user_id = (select auth.uid()) AND submission_status = 'pending') OR
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.user_id = (select auth.uid())
    )
  );

CREATE POLICY "property_submissions_delete_policy"
  ON property_submissions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.user_id = (select auth.uid())
    )
  );
