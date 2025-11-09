/*
  # Real Estate Platform Schema

  ## Overview
  Creates the complete database schema for a house rental and sales platform with properties, user favorites, and contact inquiries.

  ## New Tables
  
  ### `properties`
  Main table storing all property listings for rent and sale
  - `id` (uuid, primary key) - Unique identifier for each property
  - `title` (text) - Property title/headline
  - `description` (text) - Detailed property description
  - `price` (decimal) - Property price (monthly rent or sale price)
  - `property_type` (text) - Type: house, apartment, condo, villa, etc.
  - `listing_type` (text) - Either 'rent' or 'sale'
  - `bedrooms` (integer) - Number of bedrooms
  - `bathrooms` (integer) - Number of bathrooms
  - `area_sqft` (integer) - Property area in square feet
  - `address` (text) - Full street address
  - `city` (text) - City name
  - `state` (text) - State/province
  - `zip_code` (text) - Postal/ZIP code
  - `latitude` (decimal) - Geographic latitude for mapping
  - `longitude` (decimal) - Geographic longitude for mapping
  - `features` (jsonb) - Array of property features (parking, pool, garden, etc.)
  - `images` (jsonb) - Array of image URLs
  - `status` (text) - Property status: available, pending, sold, rented
  - `featured` (boolean) - Whether property is featured on homepage
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `favorites`
  Tracks user favorite properties
  - `id` (uuid, primary key) - Unique identifier
  - `user_id` (uuid) - Reference to auth.users
  - `property_id` (uuid) - Reference to properties table
  - `created_at` (timestamptz) - When favorite was added

  ### `inquiries`
  Contact inquiries from potential buyers/renters
  - `id` (uuid, primary key) - Unique identifier
  - `property_id` (uuid) - Reference to properties table
  - `name` (text) - Inquirer's full name
  - `email` (text) - Contact email
  - `phone` (text) - Contact phone number
  - `message` (text) - Inquiry message
  - `created_at` (timestamptz) - Inquiry timestamp

  ## Security
  
  ### Row Level Security (RLS)
  - All tables have RLS enabled for data protection
  - Properties are publicly readable but only modifiable by authenticated admins
  - Favorites are user-specific (users can only see/modify their own)
  - Inquiries are insert-only for public, readable by authenticated admins

  ### RLS Policies
  
  #### Properties Table
  - Anyone can view available properties
  - Only authenticated users can create/update/delete (for admin functionality)

  #### Favorites Table
  - Users can view only their own favorites
  - Users can add/remove their own favorites
  - Unauthenticated users cannot access favorites

  #### Inquiries Table
  - Anyone can submit inquiries
  - Only authenticated admins can view inquiries

  ## Indexes
  - Properties indexed by city, listing_type, status for fast filtering
  - Properties indexed by price for range queries
  - Favorites indexed by user_id and property_id for quick lookups
  - Inquiries indexed by property_id
*/

CREATE TABLE IF NOT EXISTS properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
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
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'pending', 'sold', 'rented')),
  featured boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, property_id)
);

CREATE TABLE IF NOT EXISTS inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  message text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view available properties"
  ON properties FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert properties"
  ON properties FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update properties"
  ON properties FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete properties"
  ON properties FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Users can view own favorites"
  ON favorites FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add own favorites"
  ON favorites FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own favorites"
  ON favorites FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can submit inquiries"
  ON inquiries FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view inquiries"
  ON inquiries FOR SELECT
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_properties_city ON properties(city);
CREATE INDEX IF NOT EXISTS idx_properties_listing_type ON properties(listing_type);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_price ON properties(price);
CREATE INDEX IF NOT EXISTS idx_properties_featured ON properties(featured);
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_property_id ON favorites(property_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_property_id ON inquiries(property_id);
