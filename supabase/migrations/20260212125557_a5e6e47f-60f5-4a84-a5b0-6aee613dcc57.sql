
-- Add new columns to visitors table
ALTER TABLE public.visitors
  ADD COLUMN cidade TEXT,
  ADD COLUMN uf TEXT,
  ADD COLUMN is_ipb_member BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN other_church TEXT;

-- Allow anonymous users to insert visitors (public registration page)
CREATE POLICY "Anyone can register as visitor"
  ON public.visitors
  FOR INSERT
  TO anon
  WITH CHECK (true);
