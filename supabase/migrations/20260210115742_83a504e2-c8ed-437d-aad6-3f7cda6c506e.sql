
-- Create storage bucket for financial documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('financial-docs', 'financial-docs', true);

-- Allow authenticated users to view files
CREATE POLICY "Authenticated users can view financial docs"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'financial-docs');

-- Allow admins to upload financial docs
CREATE POLICY "Admins can upload financial docs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'financial-docs'
  AND public.has_role(auth.uid(), 'admin')
);

-- Allow admins to delete financial docs
CREATE POLICY "Admins can delete financial docs"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'financial-docs'
  AND public.has_role(auth.uid(), 'admin')
);

-- Add document_url column to financial_reports
ALTER TABLE public.financial_reports
ADD COLUMN document_url text;
