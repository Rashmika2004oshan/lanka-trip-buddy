-- Create destinations table for interest categories
CREATE TABLE public.destinations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  interest_category text NOT NULL CHECK (interest_category IN ('Culture', 'Beaches', 'Nature', 'Wildlife')),
  name text NOT NULL,
  description text NOT NULL,
  city text,
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.destinations ENABLE ROW LEVEL SECURITY;

-- Everyone can view destinations
CREATE POLICY "Destinations are viewable by everyone" 
ON public.destinations FOR SELECT 
USING (true);

-- Only admins can manage destinations
CREATE POLICY "Admins can manage destinations" 
ON public.destinations FOR ALL 
USING (has_role(auth.uid(), 'admin'));

-- Create vehicle_types table
CREATE TABLE public.vehicle_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  min_passengers int NOT NULL,
  max_passengers int NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vehicle_types ENABLE ROW LEVEL SECURITY;

-- Everyone can view vehicle types
CREATE POLICY "Vehicle types are viewable by everyone" 
ON public.vehicle_types FOR SELECT 
USING (true);

-- Create vehicle_classes table  
CREATE TABLE public.vehicle_classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_type_id uuid REFERENCES public.vehicle_types(id) ON DELETE CASCADE NOT NULL,
  class_name text NOT NULL CHECK (class_name IN ('Mid', 'Luxury')),
  price_multiplier numeric DEFAULT 1.0,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (vehicle_type_id, class_name)
);

-- Enable RLS
ALTER TABLE public.vehicle_classes ENABLE ROW LEVEL SECURITY;

-- Everyone can view vehicle classes
CREATE POLICY "Vehicle classes are viewable by everyone" 
ON public.vehicle_classes FOR SELECT 
USING (true);

-- Insert destinations for Culture
INSERT INTO public.destinations (interest_category, name, description, city) VALUES
('Culture', 'Sigiriya Rock Fortress', 'Ancient rock fortress with stunning frescoes and panoramic views, a UNESCO World Heritage Site built in the 5th century.', 'Sigiriya'),
('Culture', 'Temple of the Sacred Tooth Relic', 'The most sacred Buddhist temple in Sri Lanka, housing Buddha''s tooth relic in the historic city of Kandy.', 'Kandy'),
('Culture', 'Galle Fort', 'A well-preserved 16th-century Portuguese fort, now a UNESCO World Heritage Site with colonial architecture and charming streets.', 'Galle');

-- Insert destinations for Beaches
INSERT INTO public.destinations (interest_category, name, description, city) VALUES
('Beaches', 'Mirissa Beach', 'A crescent-shaped beach famous for whale watching, surfing, and stunning sunsets on the southern coast.', 'Mirissa'),
('Beaches', 'Unawatuna Beach', 'A picturesque bay with calm waters perfect for swimming, snorkeling, and enjoying beachfront restaurants.', 'Unawatuna'),
('Beaches', 'Arugam Bay', 'World-renowned surfing destination on the east coast with perfect waves and laid-back beach vibes.', 'Arugam Bay');

-- Insert destinations for Nature
INSERT INTO public.destinations (interest_category, name, description, city) VALUES
('Nature', 'Ella and Nine Arches Bridge', 'A scenic mountain village with iconic colonial-era railway bridge surrounded by lush tea plantations.', 'Ella'),
('Nature', 'Horton Plains National Park', 'A stunning highland plateau featuring World''s End cliff and Baker''s Falls amid cloud forests.', 'Nuwara Eliya'),
('Nature', 'Sinharaja Forest Reserve', 'A UNESCO World Heritage rainforest, home to endemic species and incredible biodiversity.', 'Ratnapura');

-- Insert destinations for Wildlife
INSERT INTO public.destinations (interest_category, name, description, city) VALUES
('Wildlife', 'Yala National Park', 'Sri Lanka''s most famous wildlife park, known for having the highest density of leopards in the world.', 'Tissamaharama'),
('Wildlife', 'Udawalawe National Park', 'Home to over 500 wild elephants, offering guaranteed elephant sightings on every safari.', 'Udawalawe'),
('Wildlife', 'Minneriya National Park', 'Famous for "The Gathering" - the largest wild Asian elephant congregation in the world.', 'Habarana');

-- Insert vehicle types
INSERT INTO public.vehicle_types (name, min_passengers, max_passengers, description) VALUES
('Car', 1, 4, 'Comfortable sedan or hatchback for small groups'),
('Van', 5, 7, 'Spacious van for medium-sized groups'),
('Bus', 8, 30, 'Mini bus or coach for large groups');

-- Insert vehicle classes for each vehicle type
INSERT INTO public.vehicle_classes (vehicle_type_id, class_name, price_multiplier, description)
SELECT id, 'Mid', 1.0, 'Standard comfort with air conditioning'
FROM public.vehicle_types;

INSERT INTO public.vehicle_classes (vehicle_type_id, class_name, price_multiplier, description)
SELECT id, 'Luxury', 1.5, 'Premium comfort with enhanced amenities'
FROM public.vehicle_types;

-- Insert real Sri Lankan hotels for Budget category
INSERT INTO public.hotels (user_id, hotel_name, category, city, stars, per_night_charge, owner_email)
SELECT 
  (SELECT id FROM auth.users LIMIT 1),
  hotel_name,
  'Low',
  city,
  stars,
  per_night_charge,
  NULL
FROM (VALUES
  ('Clock Inn Colombo', 'Colombo', 2, 25),
  ('Hangover Hostels Ella', 'Ella', 2, 20),
  ('Back of Beyond Pidurangala', 'Sigiriya', 2, 30)
) AS t(hotel_name, city, stars, per_night_charge)
WHERE NOT EXISTS (SELECT 1 FROM auth.users LIMIT 1) OR EXISTS (SELECT 1 FROM auth.users LIMIT 1);

-- Insert real Sri Lankan hotels for Middle category  
INSERT INTO public.hotels (user_id, hotel_name, category, city, stars, per_night_charge, owner_email)
SELECT 
  (SELECT id FROM auth.users LIMIT 1),
  hotel_name,
  'Middle',
  city,
  stars,
  per_night_charge,
  NULL
FROM (VALUES
  ('Araliya Green Hills Nuwara Eliya', 'Nuwara Eliya', 4, 85),
  ('The Habitat Kosgoda', 'Kosgoda', 3, 75),
  ('Cinnamon Citadel Kandy', 'Kandy', 4, 95)
) AS t(hotel_name, city, stars, per_night_charge)
WHERE NOT EXISTS (SELECT 1 FROM auth.users LIMIT 1) OR EXISTS (SELECT 1 FROM auth.users LIMIT 1);

-- Insert real Sri Lankan hotels for Luxury category
INSERT INTO public.hotels (user_id, hotel_name, category, city, stars, per_night_charge, owner_email)
SELECT 
  (SELECT id FROM auth.users LIMIT 1),
  hotel_name,
  'Luxury',
  city,
  stars,
  per_night_charge,
  NULL
FROM (VALUES
  ('Shangri-La Colombo', 'Colombo', 5, 280),
  ('Wild Coast Tented Lodge Yala', 'Yala', 5, 450),
  ('Cape Weligama', 'Weligama', 5, 380)
) AS t(hotel_name, city, stars, per_night_charge)
WHERE NOT EXISTS (SELECT 1 FROM auth.users LIMIT 1) OR EXISTS (SELECT 1 FROM auth.users LIMIT 1);