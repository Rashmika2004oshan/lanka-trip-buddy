-- Add board_type column to bookings table for accommodation bookings
ALTER TABLE public.bookings ADD COLUMN board_type TEXT CHECK (board_type IN ('Full Board', 'Half Board', 'Bed Only'));