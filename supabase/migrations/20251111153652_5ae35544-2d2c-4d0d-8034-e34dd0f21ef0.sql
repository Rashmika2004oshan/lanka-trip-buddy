-- Create storage buckets for vehicle and hotel images
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('vehicle-images', 'vehicle-images', true),
  ('hotel-images', 'hotel-images', true);

-- Create vehicles table
CREATE TABLE public.vehicles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vehicle_type text NOT NULL,
  model text NOT NULL,
  vehicle_number text NOT NULL,
  per_km_charge numeric NOT NULL CHECK (per_km_charge > 0),
  image_url text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Enable RLS on vehicles
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

-- RLS policies for vehicles
CREATE POLICY "Vehicles are viewable by everyone" 
ON public.vehicles 
FOR SELECT 
USING (true);

CREATE POLICY "Drivers can create their own vehicles" 
ON public.vehicles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Drivers can update their own vehicles" 
ON public.vehicles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Drivers can delete their own vehicles" 
ON public.vehicles 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create hotels table
CREATE TABLE public.hotels (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hotel_name text NOT NULL,
  stars integer NOT NULL CHECK (stars >= 1 AND stars <= 5),
  per_night_charge numeric NOT NULL CHECK (per_night_charge > 0),
  category text NOT NULL CHECK (category IN ('Luxury', 'Middle', 'Low')),
  city text NOT NULL,
  image_url text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Enable RLS on hotels
ALTER TABLE public.hotels ENABLE ROW LEVEL SECURITY;

-- RLS policies for hotels
CREATE POLICY "Hotels are viewable by everyone" 
ON public.hotels 
FOR SELECT 
USING (true);

CREATE POLICY "Hotel owners can create their own hotels" 
ON public.hotels 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Hotel owners can update their own hotels" 
ON public.hotels 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Hotel owners can delete their own hotels" 
ON public.hotels 
FOR DELETE 
USING (auth.uid() = user_id);

-- Storage policies for vehicle images
CREATE POLICY "Vehicle images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'vehicle-images');

CREATE POLICY "Authenticated users can upload vehicle images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'vehicle-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own vehicle images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'vehicle-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their own vehicle images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'vehicle-images' AND auth.uid() IS NOT NULL);

-- Storage policies for hotel images
CREATE POLICY "Hotel images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'hotel-images');

CREATE POLICY "Authenticated users can upload hotel images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'hotel-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own hotel images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'hotel-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their own hotel images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'hotel-images' AND auth.uid() IS NOT NULL);

-- Trigger for vehicles updated_at
CREATE TRIGGER update_vehicles_updated_at
BEFORE UPDATE ON public.vehicles
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Trigger for hotels updated_at
CREATE TRIGGER update_hotels_updated_at
BEFORE UPDATE ON public.hotels
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();