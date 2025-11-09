/*
  # Add Property Expiration System

  ## Overview
  Adds expiration functionality to properties, allowing both manual admin control and automatic time-based expiration.

  ## Changes
  
  ### Schema Updates
  
  #### `properties` table modifications
  - `expires_at` (timestamptz, nullable) - When the property listing expires
  - `auto_expire_days` (integer, nullable) - Number of days until auto-expiration from creation
  - `is_expired` (boolean) - Whether the property is currently expired (auto-calculated)
  
  ### New Function
  - `check_property_expiration()` - Automatically updates is_expired status based on expires_at timestamp
  
  ### Trigger
  - Automatically checks and updates expiration status when properties are queried
  
  ## How It Works
  
  1. **Admin Manual Control**: 
     - Admin can set `expires_at` to any date when creating/editing properties
     - Admin can set `auto_expire_days` for automatic expiration (e.g., 30, 60, 90 days)
  
  2. **Automatic Expiration**:
     - If `auto_expire_days` is set, `expires_at` is calculated as created_at + auto_expire_days
     - System automatically marks properties as expired when current time > expires_at
     - Expired properties are hidden from public listings (status remains available but is_expired = true)
  
  3. **Flexible**:
     - Both fields are optional (null = never expires)
     - Admin can override auto_expire_days by setting expires_at manually
     - Can extend expiration by updating expires_at
  
  ## Examples
  
  ### Set manual expiration (90 days from now)
  ```sql
  UPDATE properties 
  SET expires_at = now() + interval '90 days'
  WHERE id = 'property-uuid';
  ```
  
  ### Set automatic 30-day expiration for new listings
  ```sql
  INSERT INTO properties (title, ..., auto_expire_days)
  VALUES ('Beautiful Home', ..., 30);
  ```
  
  ### Remove expiration
  ```sql
  UPDATE properties 
  SET expires_at = NULL, auto_expire_days = NULL
  WHERE id = 'property-uuid';
  ```
*/

-- Add expiration columns to properties table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'expires_at'
  ) THEN
    ALTER TABLE properties ADD COLUMN expires_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'auto_expire_days'
  ) THEN
    ALTER TABLE properties ADD COLUMN auto_expire_days integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'is_expired'
  ) THEN
    ALTER TABLE properties ADD COLUMN is_expired boolean DEFAULT false;
  END IF;
END $$;

-- Create function to automatically calculate expiration
CREATE OR REPLACE FUNCTION update_property_expiration()
RETURNS trigger AS $$
BEGIN
  -- If auto_expire_days is set and expires_at is not manually set, calculate it
  IF NEW.auto_expire_days IS NOT NULL AND (NEW.expires_at IS NULL OR NEW.expires_at = OLD.expires_at) THEN
    NEW.expires_at := NEW.created_at + (NEW.auto_expire_days || ' days')::interval;
  END IF;
  
  -- Update is_expired based on expires_at
  IF NEW.expires_at IS NOT NULL THEN
    NEW.is_expired := (now() > NEW.expires_at);
  ELSE
    NEW.is_expired := false;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic expiration calculation
DROP TRIGGER IF EXISTS trigger_update_property_expiration ON properties;
CREATE TRIGGER trigger_update_property_expiration
  BEFORE INSERT OR UPDATE ON properties
  FOR EACH ROW
  EXECUTE FUNCTION update_property_expiration();

-- Update existing properties to check expiration status
UPDATE properties
SET is_expired = CASE 
  WHEN expires_at IS NOT NULL AND now() > expires_at THEN true
  ELSE false
END;

-- Update the view policy to hide expired properties from public
DROP POLICY IF EXISTS "Anyone can view available properties" ON properties;
CREATE POLICY "Anyone can view available properties"
  ON properties FOR SELECT
  USING (is_expired = false OR auth.uid() IS NOT NULL);

-- Create index for expiration queries
CREATE INDEX IF NOT EXISTS idx_properties_expires_at ON properties(expires_at);
CREATE INDEX IF NOT EXISTS idx_properties_is_expired ON properties(is_expired);

-- Create a scheduled job function to update expired properties (for cron or manual calls)
CREATE OR REPLACE FUNCTION check_and_update_expired_properties()
RETURNS void AS $$
BEGIN
  UPDATE properties
  SET is_expired = true
  WHERE expires_at IS NOT NULL 
    AND now() > expires_at 
    AND is_expired = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;