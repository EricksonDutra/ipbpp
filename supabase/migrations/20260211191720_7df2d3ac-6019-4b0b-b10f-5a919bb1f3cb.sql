
-- Make the financial-docs bucket private
UPDATE storage.buckets SET public = false WHERE id = 'financial-docs';

-- Add SELECT policy so authenticated active members can view financial docs
CREATE POLICY "Authenticated members can view financial docs"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'financial-docs'
  AND (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR (
      public.is_active_member(auth.uid())
      AND public.has_role(auth.uid(), 'member'::public.app_role)
    )
  )
);
