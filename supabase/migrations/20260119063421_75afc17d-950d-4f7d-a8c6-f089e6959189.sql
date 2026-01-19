-- Fix 1: Remove card_last_four column from bookings table (SECRETS_EXPOSED)
ALTER TABLE public.bookings DROP COLUMN IF EXISTS card_last_four;

-- Fix 2: Add RLS policies for service providers to view their bookings (MISSING_RLS)
-- Allow drivers to see bookings for their vehicles
CREATE POLICY "Drivers can view bookings for their vehicles"
ON public.bookings
FOR SELECT
USING (
  vehicle_id IN (
    SELECT id FROM public.vehicles 
    WHERE user_id = auth.uid()
  )
);

-- Allow hotel owners to see bookings for their hotels
CREATE POLICY "Hotel owners can view bookings for their hotels"
ON public.bookings
FOR SELECT
USING (
  hotel_id IN (
    SELECT id FROM public.hotels 
    WHERE user_id = auth.uid()
  )
);

-- Allow admins to view all bookings
CREATE POLICY "Admins can view all bookings"
ON public.bookings
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));