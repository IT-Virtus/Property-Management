/*
  # Cleanup Duplicate RLS Policies

  ## Changes Made

  ### Remove Old/Duplicate Policies
  - Remove old policies from payment_settings that weren't properly dropped
  - Remove old policies from property_submissions that conflict with new consolidated ones
  
  ## Notes
  - This ensures only one policy per action exists
  - Eliminates "Multiple Permissive Policies" warnings
*/

-- =====================================================
-- CLEANUP PAYMENT_SETTINGS DUPLICATE POLICIES
-- =====================================================

-- Remove old "Admins can manage payment settings" - it's for ALL operations, replaced by specific ones
DROP POLICY IF EXISTS "Admins can manage payment settings" ON payment_settings;

-- Remove old generic policy, keep the new consolidated one
DROP POLICY IF EXISTS "Authenticated users can view active or admins can view all" ON payment_settings;

-- =====================================================
-- CLEANUP PROPERTY_SUBMISSIONS DUPLICATE POLICIES
-- =====================================================

-- Remove old separate policies that were replaced by consolidated versions
DROP POLICY IF EXISTS "Users can view own submissions or admins can view all" ON property_submissions;
DROP POLICY IF EXISTS "Users can update own pending or admins can update all" ON property_submissions;

-- =====================================================
-- VERIFY NO UNUSED INDEXES REMAIN
-- =====================================================

-- Double-check that unused indexes were dropped (in case migration partially failed)
DROP INDEX IF EXISTS idx_submissions_listing_type;
DROP INDEX IF EXISTS idx_user_profiles_email;
DROP INDEX IF EXISTS idx_user_profiles_user_type;
DROP INDEX IF EXISTS idx_properties_expires_at;
DROP INDEX IF EXISTS idx_properties_is_expired;
DROP INDEX IF EXISTS idx_properties_city;
DROP INDEX IF EXISTS idx_properties_listing_type;
DROP INDEX IF EXISTS idx_properties_price;
DROP INDEX IF EXISTS idx_properties_featured;
DROP INDEX IF EXISTS idx_favorites_user_id;
DROP INDEX IF EXISTS idx_favorites_property_id;
DROP INDEX IF EXISTS idx_inquiries_property_id;
DROP INDEX IF EXISTS idx_submissions_status;
DROP INDEX IF EXISTS idx_submissions_payment_status;
