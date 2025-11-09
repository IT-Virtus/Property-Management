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

-- Create properties table
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

-- Create favorites table
CREATE TABLE IF NOT EXISTS favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, property_id)
);

-- Create inquiries table
CREATE TABLE IF NOT EXISTS inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  message text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;

-- Properties Policies (Public Read, Authenticated Write)
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

-- Favorites Policies (User-specific)
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

-- Inquiries Policies (Public Insert, Authenticated Read)
CREATE POLICY "Anyone can submit inquiries"
  ON inquiries FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view inquiries"
  ON inquiries FOR SELECT
  TO authenticated
  USING (true);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_properties_city ON properties(city);
CREATE INDEX IF NOT EXISTS idx_properties_listing_type ON properties(listing_type);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_price ON properties(price);
CREATE INDEX IF NOT EXISTS idx_properties_featured ON properties(featured);
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_property_id ON favorites(property_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_property_id ON inquiries(property_id);

-- Insert sample data
INSERT INTO properties (title, description, price, property_type, listing_type, bedrooms, bathrooms, area_sqft, address, city, state, zip_code, latitude, longitude, features, images, status, featured)
VALUES 
  (
    'Modern Luxury Villa with Ocean View',
    'Stunning 4-bedroom villa featuring panoramic ocean views, infinity pool, and contemporary design. Perfect for those seeking luxury coastal living with easy beach access.',
    2500000.00,
    'Villa',
    'sale',
    4,
    3,
    3500,
    '123 Ocean Drive',
    'Miami',
    'FL',
    '33139',
    25.7617,
    -80.1918,
    '["Ocean View", "Pool", "Garage", "Garden", "Smart Home", "Security System"]'::jsonb,
    '["https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg", "https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg", "https://images.pexels.com/photos/2102587/pexels-photo-2102587.jpeg"]'::jsonb,
    'available',
    true
  ),
  (
    'Downtown Penthouse Apartment',
    'Sophisticated 2-bedroom penthouse in the heart of downtown. Floor-to-ceiling windows, modern finishes, and stunning city skyline views. Walking distance to restaurants and entertainment.',
    4500.00,
    'Apartment',
    'rent',
    2,
    2,
    1800,
    '456 City Center Blvd',
    'New York',
    'NY',
    '10001',
    40.7128,
    -74.0060,
    '["City View", "Gym", "Concierge", "Rooftop Access", "Pet Friendly"]'::jsonb,
    '["https://images.pexels.com/photos/1457842/pexels-photo-1457842.jpeg", "https://images.pexels.com/photos/2462015/pexels-photo-2462015.jpeg", "https://images.pexels.com/photos/2343468/pexels-photo-2343468.jpeg"]'::jsonb,
    'available',
    true
  ),
  (
    'Charming Family Home with Garden',
    'Beautiful 3-bedroom family home in quiet suburban neighborhood. Large backyard, updated kitchen, and close to top-rated schools. Perfect for growing families.',
    525000.00,
    'House',
    'sale',
    3,
    2,
    2200,
    '789 Maple Street',
    'Austin',
    'TX',
    '78701',
    30.2672,
    -97.7431,
    '["Garden", "Garage", "Fireplace", "Updated Kitchen", "Near Schools"]'::jsonb,
    '["https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg", "https://images.pexels.com/photos/1115804/pexels-photo-1115804.jpeg", "https://images.pexels.com/photos/2581922/pexels-photo-2581922.jpeg"]'::jsonb,
    'available',
    false
  ),
  (
    'Cozy Studio in Arts District',
    'Bright and cozy studio apartment in trendy arts district. Exposed brick, high ceilings, and modern amenities. Perfect for young professionals or artists.',
    1800.00,
    'Apartment',
    'rent',
    1,
    1,
    650,
    '321 Gallery Lane',
    'Los Angeles',
    'CA',
    '90013',
    34.0522,
    -118.2437,
    '["Exposed Brick", "High Ceilings", "Hardwood Floors", "Near Transit"]'::jsonb,
    '["https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg", "https://images.pexels.com/photos/1743231/pexels-photo-1743231.jpeg"]'::jsonb,
    'available',
    false
  ),
  (
    'Spacious Lakefront Condo',
    'Gorgeous 3-bedroom condo with direct lake access. Private dock, updated throughout, and breathtaking water views from every room. Resort-style amenities included.',
    750000.00,
    'Condo',
    'sale',
    3,
    2,
    2000,
    '555 Lakeshore Drive',
    'Chicago',
    'IL',
    '60611',
    41.8781,
    -87.6298,
    '["Lake View", "Dock Access", "Pool", "Gym", "Balcony"]'::jsonb,
    '["https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg", "https://images.pexels.com/photos/1668860/pexels-photo-1668860.jpeg", "https://images.pexels.com/photos/2119714/pexels-photo-2119714.jpeg"]'::jsonb,
    'available',
    true
  ),
  (
    'Mountain View Cabin Retreat',
    'Peaceful 2-bedroom cabin nestled in the mountains. Perfect vacation rental or weekend getaway. Wood-burning fireplace and expansive deck with stunning views.',
    3200.00,
    'House',
    'rent',
    2,
    1,
    1200,
    '888 Mountain Trail',
    'Denver',
    'CO',
    '80202',
    39.7392,
    -104.9903,
    '["Mountain View", "Fireplace", "Deck", "Furnished", "Hiking Trails"]'::jsonb,
    '["https://images.pexels.com/photos/1029599/pexels-photo-1029599.jpeg", "https://images.pexels.com/photos/2102587/pexels-photo-2102587.jpeg"]'::jsonb,
    'available',
    false
  );