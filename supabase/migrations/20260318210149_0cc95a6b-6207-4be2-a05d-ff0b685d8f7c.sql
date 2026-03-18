
-- Table for weekly bulletins
CREATE TABLE public.weekly_bulletins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  pastoral_message text,
  bulletin_pdf_url text,
  published_at date NOT NULL DEFAULT CURRENT_DATE,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.weekly_bulletins ENABLE ROW LEVEL SECURITY;

-- Anyone can view active bulletins (public page)
CREATE POLICY "Anyone can view active bulletins"
ON public.weekly_bulletins
FOR SELECT
TO public
USING (active = true);

-- Admin manages all bulletins
CREATE POLICY "Admin manages bulletins"
ON public.weekly_bulletins
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Storage bucket for bulletin PDFs (public so anyone can download)
INSERT INTO storage.buckets (id, name, public) VALUES ('bulletins', 'bulletins', true);

-- Anyone can read bulletin files
CREATE POLICY "Public read bulletins"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'bulletins');

-- Admin can upload/delete bulletin files
CREATE POLICY "Admin manages bulletin files"
ON storage.objects
FOR ALL
TO authenticated
USING (bucket_id = 'bulletins' AND public.has_role(auth.uid(), 'admin'));
