
CREATE POLICY "Pastor can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'pastor'::app_role));
