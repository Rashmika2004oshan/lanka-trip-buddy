
-- Allow users to insert their own driver/hotel_owner role (not admin)
CREATE POLICY "Users can self-assign driver or hotel_owner role"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id 
  AND role IN ('driver', 'hotel_owner')
);

-- Allow upsert on role_requests for auto-approval
ALTER TABLE public.role_requests DROP CONSTRAINT IF EXISTS role_requests_user_id_requested_role_key;
ALTER TABLE public.role_requests ADD CONSTRAINT role_requests_user_id_requested_role_key UNIQUE (user_id, requested_role);
