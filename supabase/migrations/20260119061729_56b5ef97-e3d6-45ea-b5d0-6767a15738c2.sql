-- Fix handle_updated_at function to include search_path
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  new.updated_at = now();
  return new;
END;
$$;